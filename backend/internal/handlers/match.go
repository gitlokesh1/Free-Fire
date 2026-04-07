package handlers

import (
	"context"
	"fmt"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strconv"
	"time"

	"battlezone/backend/config"
	"battlezone/backend/internal/models"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type MatchHandler struct {
	DB *gorm.DB
}

func NewMatchHandler(db *gorm.DB) *MatchHandler {
	return &MatchHandler{DB: db}
}

// ListMatches returns all available matches
func (h *MatchHandler) ListMatches(c *gin.Context) {
	status := c.DefaultQuery("status", "")

	var matches []models.Match
	query := h.DB.Preload("Participants.User")

	if status != "" {
		query = query.Where("status = ?", status)
	} else {
		query = query.Where("status IN ('upcoming', 'live')")
	}

	query.Order("scheduled_at ASC").Find(&matches)

	// Add participant count to each match
	type MatchWithCount struct {
		models.Match
		ParticipantCount int `json:"participant_count"`
	}

	var result []MatchWithCount
	for _, m := range matches {
		var count int64
		h.DB.Model(&models.MatchParticipant{}).Where("match_id = ?", m.ID).Count(&count)
		result = append(result, MatchWithCount{Match: m, ParticipantCount: int(count)})
	}

	c.JSON(http.StatusOK, gin.H{"matches": result})
}

// GetMatch returns a single match
func (h *MatchHandler) GetMatch(c *gin.Context) {
	id := c.Param("id")
	user := c.MustGet("user").(models.User)

	var match models.Match
	if err := h.DB.Preload("Participants.User").First(&match, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Match not found"})
		return
	}

	// Check if user has joined
	var participant models.MatchParticipant
	joined := h.DB.Where("match_id = ? AND user_id = ?", match.ID, user.ID).First(&participant).Error == nil

	response := gin.H{
		"match":  match,
		"joined": joined,
	}

	// Only show room credentials after joining
	if joined {
		response["room_id"] = match.RoomID
		response["room_password"] = match.RoomPassword
	} else {
		// Hide sensitive fields
		match.RoomID = ""
		match.RoomPassword = ""
		response["match"] = match
	}

	c.JSON(http.StatusOK, response)
}

// JoinMatch allows a user to join a match
func (h *MatchHandler) JoinMatch(c *gin.Context) {
	id := c.Param("id")
	user := c.MustGet("user").(models.User)

	if user.FFUID == "" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Please bind your Free Fire UID first"})
		return
	}

	var match models.Match
	if err := h.DB.First(&match, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Match not found"})
		return
	}

	if match.Status != "upcoming" && match.Status != "live" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Match is not open for joining"})
		return
	}

	// Check if already joined
	var existing models.MatchParticipant
	if h.DB.Where("match_id = ? AND user_id = ?", match.ID, user.ID).First(&existing).Error == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Already joined this match"})
		return
	}

	// Use a database transaction to atomically check balance, deduct fee, and add participant
	participant := models.MatchParticipant{}
	txErr := h.DB.Transaction(func(tx *gorm.DB) error {
		// Lock user row and check balance
		var freshUser models.User
		if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&freshUser, user.ID).Error; err != nil {
			return err
		}
		if freshUser.WalletBalance < match.EntryFee {
			return fmt.Errorf("insufficient balance")
		}

		// Check player limit inside transaction
		var count int64
		tx.Model(&models.MatchParticipant{}).Where("match_id = ?", match.ID).Count(&count)
		if int(count) >= match.MaxPlayers {
			return fmt.Errorf("match is full")
		}

		// Deduct entry fee
		if err := tx.Model(&freshUser).Update("wallet_balance", gorm.Expr("wallet_balance - ?", match.EntryFee)).Error; err != nil {
			return err
		}

		// Create transaction record
		if err := tx.Create(&models.WalletTransaction{
			UserID:      user.ID,
			Type:        "debit",
			Amount:      match.EntryFee,
			Description: fmt.Sprintf("Entry fee for match #%d: %s", match.ID, match.Title),
			Status:      "approved",
		}).Error; err != nil {
			return err
		}

		// Create participant record
		participant = models.MatchParticipant{
			MatchID: match.ID,
			UserID:  user.ID,
			Status:  "joined",
		}
		return tx.Create(&participant).Error
	})
	if txErr != nil {
		switch txErr.Error() {
		case "insufficient balance":
			c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient wallet balance"})
		case "match is full":
			c.JSON(http.StatusBadRequest, gin.H{"error": "Match is full"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to join match"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "Joined match successfully",
		"room_id":       match.RoomID,
		"room_password": match.RoomPassword,
		"match":         match,
	})
}

// UploadResult allows a user to upload their match result screenshot
func (h *MatchHandler) UploadResult(c *gin.Context) {
	id := c.Param("id")
	user := c.MustGet("user").(models.User)

	var participant models.MatchParticipant
	if err := h.DB.Where("match_id = ? AND user_id = ?", id, user.ID).First(&participant).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You have not joined this match"})
		return
	}

	if participant.Status == "verified" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Result already verified"})
		return
	}

	file, header, err := c.Request.FormFile("screenshot")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Screenshot file required"})
		return
	}
	defer file.Close()

	// Upload to S3
	screenshotURL, err := uploadToS3(file, header)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload screenshot"})
		return
	}

	if err := h.DB.Model(&participant).Updates(map[string]interface{}{
		"screenshot_url": screenshotURL,
		"status":         "submitted",
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save result"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":        "Result uploaded successfully",
		"screenshot_url": screenshotURL,
	})
}

func uploadToS3(file multipart.File, header *multipart.FileHeader) (string, error) {
	if config.AppConfig.AWSS3Bucket == "" {
		// Return placeholder URL if S3 not configured
		return fmt.Sprintf("/uploads/%d_%s", time.Now().Unix(), header.Filename), nil
	}

	cfg, err := awsconfig.LoadDefaultConfig(context.TODO(),
		awsconfig.WithRegion(config.AppConfig.AWSRegion),
		awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
			config.AppConfig.AWSAccessKeyID,
			config.AppConfig.AWSSecretKey,
			"",
		)),
	)
	if err != nil {
		return "", err
	}

	client := s3.NewFromConfig(cfg)

	key := fmt.Sprintf("screenshots/%d_%s", time.Now().Unix(), filepath.Base(header.Filename))

	_, err = client.PutObject(context.TODO(), &s3.PutObjectInput{
		Bucket: aws.String(config.AppConfig.AWSS3Bucket),
		Key:    aws.String(key),
		Body:   file,
	})
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("https://%s.s3.%s.amazonaws.com/%s",
		config.AppConfig.AWSS3Bucket,
		config.AppConfig.AWSRegion,
		key), nil
}

// GetMyMatches returns matches the user has joined
func (h *MatchHandler) GetMyMatches(c *gin.Context) {
	user := c.MustGet("user").(models.User)

	var participants []models.MatchParticipant
	h.DB.Preload("Match").Where("user_id = ?", user.ID).
		Order("created_at DESC").
		Find(&participants)

	c.JSON(http.StatusOK, gin.H{"matches": participants})
}

// CreateMatch allows users to create custom matches
func (h *MatchHandler) CreateMatch(c *gin.Context) {
	user := c.MustGet("user").(models.User)

	var req struct {
		Title         string    `json:"title" binding:"required"`
		Type          string    `json:"type" binding:"required"`
		EntryFee      float64   `json:"entry_fee" binding:"required"`
		PerKillReward float64   `json:"per_kill_reward" binding:"required"`
		MaxPlayers    int       `json:"max_players" binding:"required"`
		Map           string    `json:"map" binding:"required"`
		RoomID        string    `json:"room_id" binding:"required"`
		RoomPassword  string    `json:"room_password" binding:"required"`
		ScheduledAt   time.Time `json:"scheduled_at" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get platform commission
	var commissionSetting models.PlatformSetting
	var commission float64 = 10
	if err := h.DB.Where("key = ?", "platform_commission").First(&commissionSetting).Error; err == nil {
		fmt.Sscanf(commissionSetting.Value, "%f", &commission)
	}

	match := models.Match{
		CreatorID:                 user.ID,
		CreatorType:               "user",
		Title:                     req.Title,
		Type:                      req.Type,
		EntryFee:                  req.EntryFee,
		PerKillReward:             req.PerKillReward,
		MaxPlayers:                req.MaxPlayers,
		Map:                       req.Map,
		Status:                    "upcoming",
		RoomID:                    req.RoomID,
		RoomPassword:              req.RoomPassword,
		PlatformCommissionPercent: commission,
		ScheduledAt:               req.ScheduledAt,
	}

	if err := h.DB.Create(&match).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create match"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Match created successfully", "match": match})
}

// GetMatchParticipants returns all participants of a match (public, no room credentials)
func (h *MatchHandler) GetMatchParticipants(c *gin.Context) {
	id := c.Param("id")

	var participants []struct {
		UserID uint   `json:"user_id"`
		Name   string `json:"name"`
		FFUID  string `json:"ff_uid"`
		FFName string `json:"ff_name"`
		Status string `json:"status"`
	}

	h.DB.Table("match_participants mp").
		Select("mp.user_id, u.name, u.ff_uid, u.ff_name, mp.status").
		Joins("JOIN users u ON u.id = mp.user_id").
		Where("mp.match_id = ? AND mp.deleted_at IS NULL", id).
		Scan(&participants)

	c.JSON(http.StatusOK, gin.H{"participants": participants})
}

// GetResultDetails returns participant result for a match
func (h *MatchHandler) GetResultDetails(c *gin.Context) {
	matchID := c.Param("id")
	user := c.MustGet("user").(models.User)

	var participant models.MatchParticipant
	if err := h.DB.Preload("Match").Where("match_id = ? AND user_id = ?", matchID, user.ID).First(&participant).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Participation not found"})
		return
	}

	// Parse matchID to int
	mid, _ := strconv.Atoi(matchID)
	var match models.Match
	h.DB.First(&match, mid)

	c.JSON(http.StatusOK, gin.H{
		"participant": participant,
		"match":       match,
	})
}
