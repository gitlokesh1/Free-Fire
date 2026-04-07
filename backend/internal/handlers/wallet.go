package handlers

import (
	"fmt"
	"net/http"

	"battlezone/backend/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type WalletHandler struct {
	DB *gorm.DB
}

func NewWalletHandler(db *gorm.DB) *WalletHandler {
	return &WalletHandler{DB: db}
}

// GetWallet returns wallet balance and transactions
func (h *WalletHandler) GetWallet(c *gin.Context) {
	user := c.MustGet("user").(models.User)

	// Refresh user balance
	h.DB.First(&user, user.ID)

	var transactions []models.WalletTransaction
	h.DB.Where("user_id = ?", user.ID).
		Order("created_at DESC").
		Limit(50).
		Find(&transactions)

	c.JSON(http.StatusOK, gin.H{
		"balance":      user.WalletBalance,
		"transactions": transactions,
	})
}

// RequestAddMoney creates an add money request
func (h *WalletHandler) RequestAddMoney(c *gin.Context) {
	user := c.MustGet("user").(models.User)

	var req struct {
		Amount float64 `json:"amount" binding:"required,min=1"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	addRequest := models.AddMoneyRequest{
		UserID: user.ID,
		Amount: req.Amount,
		Status: "pending",
	}

	if err := h.DB.Create(&addRequest).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create request"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Add money request submitted. Pending admin approval.",
		"request": addRequest,
	})
}

// RequestWithdraw creates a withdrawal request
func (h *WalletHandler) RequestWithdraw(c *gin.Context) {
	user := c.MustGet("user").(models.User)

	var req struct {
		Amount float64 `json:"amount" binding:"required,min=1"`
		UPIID  string  `json:"upi_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check minimum withdrawal
	var setting models.PlatformSetting
	var minWithdraw float64 = 100
	if err := h.DB.Where("key = ?", "min_withdraw_amount").First(&setting).Error; err == nil {
		fmt.Sscanf(setting.Value, "%f", &minWithdraw)
	}

	if req.Amount < minWithdraw {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Minimum withdrawal amount is ₹%.0f", minWithdraw)})
		return
	}

	// Refresh balance
	h.DB.First(&user, user.ID)

	if user.WalletBalance < req.Amount {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient balance"})
		return
	}

	// Reserve the amount
	if err := h.DB.Model(&user).Update("wallet_balance", gorm.Expr("wallet_balance - ?", req.Amount)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reserve amount"})
		return
	}

	withdrawRequest := models.WithdrawRequest{
		UserID: user.ID,
		Amount: req.Amount,
		UPIID:  req.UPIID,
		Status: "pending",
	}

	if err := h.DB.Create(&withdrawRequest).Error; err != nil {
		// Refund reserved amount
		h.DB.Model(&user).Update("wallet_balance", gorm.Expr("wallet_balance + ?", req.Amount))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create request"})
		return
	}

	// Create pending transaction
	h.DB.Create(&models.WalletTransaction{
		UserID:      user.ID,
		Type:        "debit",
		Amount:      req.Amount,
		Description: fmt.Sprintf("Withdrawal request to UPI: %s", req.UPIID),
		Status:      "pending",
	})

	c.JSON(http.StatusCreated, gin.H{
		"message": "Withdrawal request submitted. Pending admin approval.",
		"request": withdrawRequest,
	})
}

// GetAddMoneyRequests returns user's add money requests
func (h *WalletHandler) GetAddMoneyRequests(c *gin.Context) {
	user := c.MustGet("user").(models.User)

	var requests []models.AddMoneyRequest
	h.DB.Where("user_id = ?", user.ID).Order("created_at DESC").Find(&requests)

	c.JSON(http.StatusOK, gin.H{"requests": requests})
}

// GetWithdrawRequests returns user's withdrawal requests
func (h *WalletHandler) GetWithdrawRequests(c *gin.Context) {
	user := c.MustGet("user").(models.User)

	var requests []models.WithdrawRequest
	h.DB.Where("user_id = ?", user.ID).Order("created_at DESC").Find(&requests)

	c.JSON(http.StatusOK, gin.H{"requests": requests})
}
