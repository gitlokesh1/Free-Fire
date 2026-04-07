package main

import (
	"log"

	"battlezone/backend/config"
	"battlezone/backend/internal/handlers"
	"battlezone/backend/internal/middleware"
	"battlezone/backend/internal/models"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	config.Load()

	// Connect to database
	models.Connect()

	// Connect to Redis
	models.ConnectRedis()

	// Setup router
	r := gin.Default()

	// CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "https://*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	db := models.DB

	// Handlers
	authHandler := handlers.NewAuthHandler(db)
	userHandler := handlers.NewUserHandler(db)
	matchHandler := handlers.NewMatchHandler(db)
	walletHandler := handlers.NewWalletHandler(db)
	adminHandler := handlers.NewAdminHandler(db)

	// Public routes
	api := r.Group("/api")
	{
		// Auth
		api.POST("/auth/send-otp", authHandler.SendOTP)
		api.POST("/auth/verify-otp", authHandler.VerifyOTP)

		// Public match listing
		api.GET("/matches", func(c *gin.Context) {
			middleware.AuthMiddleware(db)(c)
			if c.IsAborted() {
				return
			}
			matchHandler.ListMatches(c)
		})
		api.GET("/leaderboard", func(c *gin.Context) {
			userHandler.GetLeaderboard(c)
		})
	}

	// Authenticated routes
	auth := api.Group("/")
	auth.Use(middleware.AuthMiddleware(db))
	{
		// User
		auth.GET("/profile", userHandler.GetProfile)
		auth.POST("/bind-uid", userHandler.BindUID)
		auth.GET("/referrals", userHandler.GetReferrals)
		auth.GET("/leaderboard", userHandler.GetLeaderboard)

		// Matches
		auth.GET("/matches", matchHandler.ListMatches)
		auth.GET("/matches/:id", matchHandler.GetMatch)
		auth.GET("/matches/:id/participants", matchHandler.GetMatchParticipants)
		auth.POST("/matches/:id/join", matchHandler.JoinMatch)
		auth.POST("/matches/:id/upload-result", matchHandler.UploadResult)
		auth.GET("/matches/:id/result", matchHandler.GetResultDetails)
		auth.GET("/my-matches", matchHandler.GetMyMatches)
		auth.POST("/matches/create", matchHandler.CreateMatch)

		// Wallet
		auth.GET("/wallet", walletHandler.GetWallet)
		auth.POST("/wallet/add-money", walletHandler.RequestAddMoney)
		auth.POST("/wallet/withdraw", walletHandler.RequestWithdraw)
		auth.GET("/wallet/add-requests", walletHandler.GetAddMoneyRequests)
		auth.GET("/wallet/withdraw-requests", walletHandler.GetWithdrawRequests)
	}

	// Admin routes
	admin := api.Group("/admin")
	admin.Use(middleware.AuthMiddleware(db), middleware.AdminMiddleware())
	{
		admin.GET("/dashboard", adminHandler.GetDashboardStats)

		// Matches
		admin.POST("/matches", adminHandler.CreateMatch)
		admin.PUT("/matches/:id", adminHandler.UpdateMatch)
		admin.GET("/matches", adminHandler.GetAllMatches)

		// Results
		admin.GET("/results/pending", adminHandler.GetPendingResults)
		admin.POST("/results/:id/verify", adminHandler.VerifyResult)

		// Users
		admin.GET("/users", adminHandler.GetAllUsers)
		admin.PUT("/users/:id/change-uid", adminHandler.AdminChangeUID)

		// Wallet management
		admin.GET("/add-money-requests", adminHandler.GetAddMoneyRequests)
		admin.POST("/add-money-requests/:id/approve", adminHandler.ApproveAddMoney)
		admin.GET("/withdraw-requests", adminHandler.GetWithdrawRequests)
		admin.POST("/withdraw-requests/:id/approve", adminHandler.ApproveWithdrawal)

		// Bonus
		admin.POST("/award-bonus", adminHandler.AwardTopKillerBonus)

		// Settings
		admin.GET("/settings", adminHandler.GetSettings)
		admin.PUT("/settings", adminHandler.UpdateSettings)

		// Referrals
		admin.GET("/referrals", adminHandler.GetAllReferrals)
	}

	port := config.AppConfig.Port
	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
