package handlers

import (
	"net/http"

	"battlezone/backend/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type UserHandler struct {
	DB *gorm.DB
}

func NewUserHandler(db *gorm.DB) *UserHandler {
	return &UserHandler{DB: db}
}

type BindUIDRequest struct {
	FFUID  string `json:"ff_uid" binding:"required"`
	FFName string `json:"ff_name" binding:"required"`
}

// BindUID binds Free Fire UID to user account (one time only)
func (h *UserHandler) BindUID(c *gin.Context) {
	user := c.MustGet("user").(models.User)

	if user.FFUID != "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "UID already bound. Contact admin to change."})
		return
	}

	var req BindUIDRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check for duplicate UID
	var existing models.User
	if err := h.DB.Where("ff_uid = ?", req.FFUID).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "This Free Fire UID is already registered"})
		return
	}

	if err := h.DB.Model(&user).Updates(models.User{FFUID: req.FFUID, FFName: req.FFName}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to bind UID"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Free Fire UID bound successfully", "user": user})
}

// GetProfile returns user profile
func (h *UserHandler) GetProfile(c *gin.Context) {
	user := c.MustGet("user").(models.User)

	var matchCount, winCount int64
	h.DB.Model(&models.MatchParticipant{}).Where("user_id = ?", user.ID).Count(&matchCount)
	h.DB.Model(&models.MatchParticipant{}).Where("user_id = ? AND rank = 1", user.ID).Count(&winCount)

	var totalEarnings float64
	h.DB.Model(&models.WalletTransaction{}).
		Select("COALESCE(SUM(amount), 0)").
		Where("user_id = ? AND type = 'credit' AND status = 'approved'", user.ID).
		Scan(&totalEarnings)

	c.JSON(http.StatusOK, gin.H{
		"user":           user,
		"match_count":    matchCount,
		"win_count":      winCount,
		"total_earnings": totalEarnings,
	})
}

// GetReferrals returns user's referral info
func (h *UserHandler) GetReferrals(c *gin.Context) {
	user := c.MustGet("user").(models.User)

	var referrals []models.Referral
	h.DB.Preload("Referred").Where("referrer_id = ?", user.ID).Find(&referrals)

	var totalEarned float64
	h.DB.Model(&models.Referral{}).
		Select("COALESCE(SUM(reward_amount), 0)").
		Where("referrer_id = ? AND status = 'credited'", user.ID).
		Scan(&totalEarned)

	// Get referral settings
	settings := h.getSettings()

	c.JSON(http.StatusOK, gin.H{
		"referral_code":     user.ReferralCode,
		"referrals":         referrals,
		"total_earned":      totalEarned,
		"referrer_reward":   settings["referrer_reward"],
		"new_user_bonus":    settings["new_user_bonus"],
		"max_referral_limit": settings["max_referral_limit"],
	})
}

func (h *UserHandler) getSettings() map[string]string {
	var settings []models.PlatformSetting
	h.DB.Find(&settings)
	result := map[string]string{}
	for _, s := range settings {
		result[s.Key] = s.Value
	}
	return result
}

// GetLeaderboard returns top players
func (h *UserHandler) GetLeaderboard(c *gin.Context) {
	period := c.DefaultQuery("period", "weekly")

	var results []struct {
		UserID        uint    `json:"user_id"`
		Name          string  `json:"name"`
		FFUID         string  `json:"ff_uid"`
		FFName        string  `json:"ff_name"`
		TotalKills    int     `json:"total_kills"`
		TotalEarnings float64 `json:"total_earnings"`
		TotalMatches  int     `json:"total_matches"`
	}

	query := h.DB.Table("match_participants mp").
		Select("mp.user_id, u.name, u.ff_uid, u.ff_name, COALESCE(SUM(mp.kills), 0) as total_kills, COALESCE(SUM(mp.reward_amount), 0) as total_earnings, COUNT(DISTINCT mp.match_id) as total_matches").
		Joins("JOIN users u ON u.id = mp.user_id").
		Where("mp.deleted_at IS NULL AND u.deleted_at IS NULL AND mp.verified_by_admin = true")

	switch period {
	case "daily":
		query = query.Where("mp.created_at >= NOW() - INTERVAL '1 day'")
	case "monthly":
		query = query.Where("mp.created_at >= NOW() - INTERVAL '30 days'")
	default: // weekly
		query = query.Where("mp.created_at >= NOW() - INTERVAL '7 days'")
	}

	query.Group("mp.user_id, u.name, u.ff_uid, u.ff_name").
		Order("total_earnings DESC, total_kills DESC").
		Limit(50).
		Scan(&results)

	c.JSON(http.StatusOK, gin.H{
		"leaderboard": results,
		"period":      period,
	})
}
