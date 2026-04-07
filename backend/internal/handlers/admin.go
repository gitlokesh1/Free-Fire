package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"battlezone/backend/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AdminHandler struct {
	DB *gorm.DB
}

func NewAdminHandler(db *gorm.DB) *AdminHandler {
	return &AdminHandler{DB: db}
}

// GetDashboardStats returns admin dashboard statistics
func (h *AdminHandler) GetDashboardStats(c *gin.Context) {
	var totalUsers, totalMatches int64
	var totalRevenue float64

	h.DB.Model(&models.User{}).Where("is_admin = false").Count(&totalUsers)
	h.DB.Model(&models.Match{}).Count(&totalMatches)

	h.DB.Model(&models.WalletTransaction{}).
		Select("COALESCE(SUM(amount), 0)").
		Where("type = 'debit' AND status = 'approved'").
		Scan(&totalRevenue)

	var pendingResults, pendingAddMoney, pendingWithdrawals int64
	h.DB.Model(&models.MatchParticipant{}).Where("status = 'submitted'").Count(&pendingResults)
	h.DB.Model(&models.AddMoneyRequest{}).Where("status = 'pending'").Count(&pendingAddMoney)
	h.DB.Model(&models.WithdrawRequest{}).Where("status = 'pending'").Count(&pendingWithdrawals)

	c.JSON(http.StatusOK, gin.H{
		"total_users":          totalUsers,
		"total_matches":        totalMatches,
		"total_revenue":        totalRevenue,
		"pending_results":      pendingResults,
		"pending_add_money":    pendingAddMoney,
		"pending_withdrawals":  pendingWithdrawals,
	})
}

// CreateMatch creates a new match (admin only)
func (h *AdminHandler) CreateMatch(c *gin.Context) {
	admin := c.MustGet("user").(models.User)

	var req struct {
		Title         string  `json:"title" binding:"required"`
		Type          string  `json:"type" binding:"required"`
		EntryFee      float64 `json:"entry_fee" binding:"required"`
		PerKillReward float64 `json:"per_kill_reward" binding:"required"`
		MaxPlayers    int     `json:"max_players" binding:"required"`
		Map           string  `json:"map" binding:"required"`
		RoomID        string  `json:"room_id"`
		RoomPassword  string  `json:"room_password"`
		ScheduledAt   string  `json:"scheduled_at" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	scheduledAt, err := parseTime(req.ScheduledAt)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid scheduled_at format (use RFC3339)"})
		return
	}

	match := models.Match{
		CreatorID:     admin.ID,
		CreatorType:   "admin",
		Title:         req.Title,
		Type:          req.Type,
		EntryFee:      req.EntryFee,
		PerKillReward: req.PerKillReward,
		MaxPlayers:    req.MaxPlayers,
		Map:           req.Map,
		Status:        "upcoming",
		RoomID:        req.RoomID,
		RoomPassword:  req.RoomPassword,
		ScheduledAt:   scheduledAt,
	}

	if err := h.DB.Create(&match).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create match"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Match created", "match": match})
}

// UpdateMatch updates match details (admin only)
func (h *AdminHandler) UpdateMatch(c *gin.Context) {
	id := c.Param("id")

	var match models.Match
	if err := h.DB.First(&match, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Match not found"})
		return
	}

	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.DB.Model(&match).Updates(req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update match"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Match updated", "match": match})
}

// GetPendingResults returns all submitted results pending admin verification
func (h *AdminHandler) GetPendingResults(c *gin.Context) {
	var participants []models.MatchParticipant
	h.DB.Preload("User").Preload("Match").
		Where("status = 'submitted'").
		Order("created_at ASC").
		Find(&participants)

	c.JSON(http.StatusOK, gin.H{"results": participants})
}

// VerifyResult approves or rejects a result and credits kill rewards
func (h *AdminHandler) VerifyResult(c *gin.Context) {
	id := c.Param("id")
	admin := c.MustGet("user").(models.User)

	var req struct {
		Action  string `json:"action" binding:"required"` // approve / reject
		Kills   int    `json:"kills"`
		Rank    int    `json:"rank"`
		Bonus   float64 `json:"bonus"` // top killer extra bonus
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var participant models.MatchParticipant
	if err := h.DB.Preload("Match").Preload("User").First(&participant, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Result not found"})
		return
	}

	if participant.Status == "verified" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Result already verified"})
		return
	}

	if req.Action == "reject" {
		h.DB.Model(&participant).Updates(map[string]interface{}{
			"status":            "rejected",
			"verified_by_admin": true,
		})
		c.JSON(http.StatusOK, gin.H{"message": "Result rejected"})
		return
	}

	// Approve: calculate rewards
	killReward := float64(req.Kills) * participant.Match.PerKillReward
	totalReward := killReward + req.Bonus

	if err := h.DB.Model(&participant).Updates(map[string]interface{}{
		"kills":             req.Kills,
		"rank":              req.Rank,
		"reward_amount":     totalReward,
		"status":            "verified",
		"verified_by_admin": true,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update result"})
		return
	}

	// Credit reward to wallet
	if totalReward > 0 {
		h.DB.Model(&models.User{}).Where("id = ?", participant.UserID).
			Update("wallet_balance", gorm.Expr("wallet_balance + ?", totalReward))

		desc := fmt.Sprintf("Match #%d: %d kills × ₹%.0f = ₹%.0f",
			participant.MatchID, req.Kills, participant.Match.PerKillReward, killReward)
		if req.Bonus > 0 {
			desc += fmt.Sprintf(" + ₹%.0f bonus", req.Bonus)
		}

		h.DB.Create(&models.WalletTransaction{
			UserID:      participant.UserID,
			Type:        "credit",
			Amount:      totalReward,
			Description: desc,
			Status:      "approved",
			ApprovedBy:  &admin.ID,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "Result verified and reward credited",
		"reward":       totalReward,
		"kill_reward":  killReward,
		"bonus":        req.Bonus,
		"participant":  participant,
	})
}

// GetAllUsers returns all users (admin only)
func (h *AdminHandler) GetAllUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit := 20
	offset := (page - 1) * limit

	var users []models.User
	var total int64

	h.DB.Model(&models.User{}).Count(&total)
	h.DB.Offset(offset).Limit(limit).Order("created_at DESC").Find(&users)

	c.JSON(http.StatusOK, gin.H{
		"users": users,
		"total": total,
		"page":  page,
	})
}

// AdminChangeUID allows admin to change a user's Free Fire UID (one time only per admin action)
func (h *AdminHandler) AdminChangeUID(c *gin.Context) {
	userID := c.Param("id")

	var req struct {
		FFUID  string `json:"ff_uid" binding:"required"`
		FFName string `json:"ff_name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := h.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Check for duplicate UID
	var existing models.User
	if err := h.DB.Where("ff_uid = ? AND id != ?", req.FFUID, user.ID).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "This UID is already bound to another account"})
		return
	}

	if err := h.DB.Model(&user).Updates(map[string]interface{}{
		"ff_uid":  req.FFUID,
		"ff_name": req.FFName,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update UID"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "UID updated successfully", "user": user})
}

// ApproveAddMoney approves or rejects an add money request
func (h *AdminHandler) ApproveAddMoney(c *gin.Context) {
	id := c.Param("id")
	admin := c.MustGet("user").(models.User)

	var req struct {
		Action string `json:"action" binding:"required"` // approve / reject
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var addReq models.AddMoneyRequest
	if err := h.DB.First(&addReq, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request not found"})
		return
	}

	if addReq.Status != "pending" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Request already processed"})
		return
	}

	if req.Action == "approve" {
		h.DB.Model(&models.User{}).Where("id = ?", addReq.UserID).
			Update("wallet_balance", gorm.Expr("wallet_balance + ?", addReq.Amount))

		h.DB.Create(&models.WalletTransaction{
			UserID:      addReq.UserID,
			Type:        "credit",
			Amount:      addReq.Amount,
			Description: "Add money approved by admin",
			Status:      "approved",
			ApprovedBy:  &admin.ID,
		})
	}

	h.DB.Model(&addReq).Updates(map[string]interface{}{
		"status":      req.Action + "d",
		"approved_by": admin.ID,
	})

	c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("Request %sd", req.Action)})
}

// ApproveWithdrawal approves or rejects a withdrawal request
func (h *AdminHandler) ApproveWithdrawal(c *gin.Context) {
	id := c.Param("id")
	admin := c.MustGet("user").(models.User)

	var req struct {
		Action string `json:"action" binding:"required"` // approve / reject
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var withdrawReq models.WithdrawRequest
	if err := h.DB.First(&withdrawReq, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request not found"})
		return
	}

	if withdrawReq.Status != "pending" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Request already processed"})
		return
	}

	status := req.Action + "d"

	if req.Action == "reject" {
		// Refund reserved amount
		h.DB.Model(&models.User{}).Where("id = ?", withdrawReq.UserID).
			Update("wallet_balance", gorm.Expr("wallet_balance + ?", withdrawReq.Amount))

		// Update pending transaction
		h.DB.Model(&models.WalletTransaction{}).
			Where("user_id = ? AND type = 'debit' AND status = 'pending' AND amount = ?",
				withdrawReq.UserID, withdrawReq.Amount).
			Updates(map[string]interface{}{"status": "rejected"})
	} else {
		// Mark transaction as approved
		h.DB.Model(&models.WalletTransaction{}).
			Where("user_id = ? AND type = 'debit' AND status = 'pending' AND amount = ?",
				withdrawReq.UserID, withdrawReq.Amount).
			Updates(map[string]interface{}{"status": "approved", "approved_by": admin.ID})
	}

	h.DB.Model(&withdrawReq).Updates(map[string]interface{}{
		"status":      status,
		"approved_by": admin.ID,
	})

	c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("Withdrawal request %s", status)})
}

// GetSettings returns all platform settings
func (h *AdminHandler) GetSettings(c *gin.Context) {
	var settings []models.PlatformSetting
	h.DB.Find(&settings)

	result := map[string]string{}
	for _, s := range settings {
		result[s.Key] = s.Value
	}

	c.JSON(http.StatusOK, gin.H{"settings": result})
}

// UpdateSettings updates platform settings
func (h *AdminHandler) UpdateSettings(c *gin.Context) {
	var req map[string]string
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	for key, value := range req {
		h.DB.Model(&models.PlatformSetting{}).
			Where("key = ?", key).
			Update("value", value)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Settings updated"})
}

// GetAddMoneyRequests returns all pending add money requests
func (h *AdminHandler) GetAddMoneyRequests(c *gin.Context) {
	var requests []models.AddMoneyRequest
	h.DB.Preload("User").Where("status = 'pending'").Order("created_at ASC").Find(&requests)
	c.JSON(http.StatusOK, gin.H{"requests": requests})
}

// GetWithdrawRequests returns all pending withdrawal requests
func (h *AdminHandler) GetWithdrawRequests(c *gin.Context) {
	var requests []models.WithdrawRequest
	h.DB.Preload("User").Where("status = 'pending'").Order("created_at ASC").Find(&requests)
	c.JSON(http.StatusOK, gin.H{"requests": requests})
}

// GetAllReferrals returns all referral records
func (h *AdminHandler) GetAllReferrals(c *gin.Context) {
	var referrals []models.Referral
	h.DB.Preload("Referrer").Preload("Referred").Order("created_at DESC").Find(&referrals)
	c.JSON(http.StatusOK, gin.H{"referrals": referrals})
}

// AwardTopKillerBonus manually awards bonus to top killer
func (h *AdminHandler) AwardTopKillerBonus(c *gin.Context) {
	admin := c.MustGet("user").(models.User)

	var req struct {
		UserID  uint    `json:"user_id" binding:"required"`
		Amount  float64 `json:"amount" binding:"required"`
		MatchID uint    `json:"match_id"`
		Reason  string  `json:"reason"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := h.DB.First(&user, req.UserID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	h.DB.Model(&user).Update("wallet_balance", gorm.Expr("wallet_balance + ?", req.Amount))

	desc := fmt.Sprintf("Top Killer Bonus")
	if req.MatchID > 0 {
		desc += fmt.Sprintf(" - Match #%d", req.MatchID)
	}
	if req.Reason != "" {
		desc += ": " + req.Reason
	}

	h.DB.Create(&models.WalletTransaction{
		UserID:      req.UserID,
		Type:        "credit",
		Amount:      req.Amount,
		Description: desc,
		Status:      "approved",
		ApprovedBy:  &admin.ID,
	})

	c.JSON(http.StatusOK, gin.H{
		"message": "Bonus awarded successfully",
		"amount":  req.Amount,
		"user_id": req.UserID,
	})
}

// GetAllMatches returns all matches (admin)
func (h *AdminHandler) GetAllMatches(c *gin.Context) {
	var matches []models.Match
	h.DB.Preload("Participants.User").Order("created_at DESC").Find(&matches)
	c.JSON(http.StatusOK, gin.H{"matches": matches})
}

func parseTime(s string) (time.Time, error) {
	formats := []string{
		time.RFC3339,
		"2006-01-02T15:04:05Z",
		"2006-01-02 15:04:05",
	}

	for _, format := range formats {
		if t, err := time.Parse(format, s); err == nil {
			return t, nil
		}
	}
	return time.Time{}, fmt.Errorf("unable to parse time: %s", s)
}
