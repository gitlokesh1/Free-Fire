package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"time"

	"battlezone/backend/config"
	"battlezone/backend/internal/middleware"
	"battlezone/backend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

type AuthHandler struct {
	DB *gorm.DB
}

func NewAuthHandler(db *gorm.DB) *AuthHandler {
	return &AuthHandler{DB: db}
}

type SendOTPRequest struct {
	Phone string `json:"phone" binding:"required"`
}

type VerifyOTPRequest struct {
	Phone     string `json:"phone" binding:"required"`
	OTP       string `json:"otp" binding:"required"`
	SessionID string `json:"session_id" binding:"required"`
	Referral  string `json:"referral_code"`
}

type TwoFactorSendResponse struct {
	Status  string `json:"Status"`
	Details string `json:"Details"`
}

// SendOTP sends OTP via 2Factor.in
func (h *AuthHandler) SendOTP(c *gin.Context) {
	var req SendOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate Indian phone number
	phone := req.Phone
	if len(phone) == 10 {
		phone = "+91" + phone
	}

	apiKey := config.AppConfig.TwoFactorAPIKey
	url := fmt.Sprintf("https://2factor.in/API/V1/%s/SMS/%s/AUTOGEN", apiKey, phone)

	resp, err := http.Get(url)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send OTP"})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var tfResp TwoFactorSendResponse
	if err := json.Unmarshal(body, &tfResp); err != nil || tfResp.Status != "Success" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send OTP"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "OTP sent successfully",
		"session_id": tfResp.Details,
	})
}

// VerifyOTP verifies OTP and logs in or registers user
func (h *AuthHandler) VerifyOTP(c *gin.Context) {
	var req VerifyOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	apiKey := config.AppConfig.TwoFactorAPIKey
	url := fmt.Sprintf("https://2factor.in/API/V1/%s/SMS/VERIFY/%s/%s",
		apiKey, req.SessionID, req.OTP)

	resp, err := http.Get(url)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "OTP verification failed"})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var tfResp TwoFactorSendResponse
	if err := json.Unmarshal(body, &tfResp); err != nil || tfResp.Status != "Success" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid OTP"})
		return
	}

	phone := req.Phone
	if len(phone) == 10 {
		phone = "+91" + phone
	}

	// Find or create user
	var user models.User
	result := h.DB.Where("phone = ?", phone).First(&user)

	if result.Error != nil {
		// New user - create account
		user = models.User{
			Phone:        phone,
			ReferralCode: generateReferralCode(),
		}

		// Apply signup bonus from platform settings
		var setting models.PlatformSetting
		if err := h.DB.Where("key = ?", "signup_bonus").First(&setting).Error; err == nil {
			var bonus float64
			fmt.Sscanf(setting.Value, "%f", &bonus)
			user.WalletBalance = bonus
			user.SignupBonus = bonus
		}

		if err := h.DB.Create(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
			return
		}

		// Handle referral
		if req.Referral != "" {
			h.processReferral(user, req.Referral)
		}
	}

	token, err := generateJWT(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token":     token,
		"user":      user,
		"is_new":    result.Error != nil,
		"uid_bound": user.FFUID != "",
	})
}

func (h *AuthHandler) processReferral(newUser models.User, referralCode string) {
	var referrer models.User
	if err := h.DB.Where("referral_code = ?", referralCode).First(&referrer).Error; err != nil {
		return
	}

	if referrer.ID == newUser.ID {
		return
	}

	// Check max referral limit
	var setting models.PlatformSetting
	var maxReferrals int64 = 100
	if err := h.DB.Where("key = ?", "max_referral_limit").First(&setting).Error; err == nil {
		fmt.Sscanf(setting.Value, "%d", &maxReferrals)
	}

	var referralCount int64
	h.DB.Model(&models.Referral{}).Where("referrer_id = ?", referrer.ID).Count(&referralCount)
	if referralCount >= maxReferrals {
		return
	}

	// Get reward amounts
	var referrerReward, newUserBonus float64
	var rSetting, nSetting models.PlatformSetting
	if err := h.DB.Where("key = ?", "referrer_reward").First(&rSetting).Error; err == nil {
		fmt.Sscanf(rSetting.Value, "%f", &referrerReward)
	}
	if err := h.DB.Where("key = ?", "new_user_bonus").First(&nSetting).Error; err == nil {
		fmt.Sscanf(nSetting.Value, "%f", &newUserBonus)
	}

	// Create referral record
	referral := models.Referral{
		ReferrerID:   referrer.ID,
		ReferredID:   newUser.ID,
		RewardAmount: referrerReward,
		Status:       "credited",
	}
	h.DB.Create(&referral)

	// Credit referrer
	h.DB.Model(&models.User{}).Where("id = ?", referrer.ID).
		Update("wallet_balance", gorm.Expr("wallet_balance + ?", referrerReward))
	h.DB.Create(&models.WalletTransaction{
		UserID:      referrer.ID,
		Type:        "credit",
		Amount:      referrerReward,
		Description: fmt.Sprintf("Referral bonus for inviting user %s", newUser.Phone),
		Status:      "approved",
	})

	// Credit new user bonus
	if newUserBonus > 0 {
		h.DB.Model(&models.User{}).Where("id = ?", newUser.ID).
			Update("wallet_balance", gorm.Expr("wallet_balance + ?", newUserBonus))
		h.DB.Create(&models.WalletTransaction{
			UserID:      newUser.ID,
			Type:        "credit",
			Amount:      newUserBonus,
			Description: "Referral welcome bonus",
			Status:      "approved",
		})
	}
}

func generateReferralCode() string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	code := make([]byte, 8)
	for i := range code {
		code[i] = chars[rng.Intn(len(chars))]
	}
	return string(code)
}

func generateJWT(user models.User) (string, error) {
	claims := middleware.Claims{
		UserID:  user.ID,
		Phone:   user.Phone,
		IsAdmin: user.IsAdmin,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(30 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(config.AppConfig.JWTSecret))
}
