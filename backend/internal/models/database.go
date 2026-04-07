package models

import (
	"fmt"
	"log"

	"battlezone/backend/config"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect() {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s TimeZone=Asia/Kolkata",
		config.AppConfig.DBHost,
		config.AppConfig.DBPort,
		config.AppConfig.DBUser,
		config.AppConfig.DBPassword,
		config.AppConfig.DBName,
		config.AppConfig.DBSSLMode,
	)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("Database connected successfully")
	Migrate()
}

func Migrate() {
	err := DB.AutoMigrate(
		&User{},
		&Match{},
		&MatchParticipant{},
		&WalletTransaction{},
		&Referral{},
		&PlatformSetting{},
		&AddMoneyRequest{},
		&WithdrawRequest{},
	)
	if err != nil {
		log.Fatalf("Migration failed: %v", err)
	}
	log.Println("Database migration completed")

	seedSettings()
}

func seedSettings() {
	defaults := map[string]string{
		"signup_bonus":        "50",
		"referrer_reward":     "20",
		"new_user_bonus":      "10",
		"max_referral_limit":  "100",
		"platform_commission": "10",
		"default_per_kill":    "5",
		"top_killer_bonus":    "0",
		"min_withdraw_amount": "100",
	}

	for key, value := range defaults {
		var setting PlatformSetting
		result := DB.Where("key = ?", key).First(&setting)
		if result.Error != nil {
			DB.Create(&PlatformSetting{Key: key, Value: value})
		}
	}
}

