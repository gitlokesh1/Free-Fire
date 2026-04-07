package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID            uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	Phone         string         `gorm:"uniqueIndex;not null" json:"phone"`
	Name          string         `json:"name"`
	FFUID         string         `gorm:"uniqueIndex" json:"ff_uid"`
	FFName        string         `json:"ff_name"`
	WalletBalance float64        `gorm:"default:0" json:"wallet_balance"`
	ReferralCode  string         `gorm:"uniqueIndex" json:"referral_code"`
	ReferredBy    *uint          `json:"referred_by"`
	SignupBonus   float64        `gorm:"default:0" json:"signup_bonus"`
	IsAdmin       bool           `gorm:"default:false" json:"is_admin"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
}

type Match struct {
	ID                        uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	CreatorID                 uint           `json:"creator_id"`
	CreatorType               string         `gorm:"default:'admin'" json:"creator_type"` // admin / user
	Title                     string         `json:"title"`
	Type                      string         `json:"type"` // solo / duo / squad / custom
	EntryFee                  float64        `json:"entry_fee"`
	PerKillReward             float64        `json:"per_kill_reward"`
	MaxPlayers                int            `json:"max_players"`
	Map                       string         `json:"map"`
	Status                    string         `gorm:"default:'upcoming'" json:"status"` // upcoming / live / completed / cancelled
	RoomID                    string         `json:"room_id"`
	RoomPassword              string         `json:"room_password"`
	PlatformCommissionPercent float64        `gorm:"default:0" json:"platform_commission_percent"`
	ScheduledAt               time.Time      `json:"scheduled_at"`
	CreatedAt                 time.Time      `json:"created_at"`
	UpdatedAt                 time.Time      `json:"updated_at"`
	DeletedAt                 gorm.DeletedAt `gorm:"index" json:"-"`

	Participants []MatchParticipant `gorm:"foreignKey:MatchID" json:"participants,omitempty"`
}

type MatchParticipant struct {
	ID              uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	MatchID         uint           `gorm:"index" json:"match_id"`
	UserID          uint           `gorm:"index" json:"user_id"`
	Status          string         `gorm:"default:'joined'" json:"status"` // joined / submitted / verified / rejected
	Kills           int            `gorm:"default:0" json:"kills"`
	Rank            int            `gorm:"default:0" json:"rank"`
	RewardAmount    float64        `gorm:"default:0" json:"reward_amount"`
	ScreenshotURL   string         `json:"screenshot_url"`
	VerifiedByAdmin bool           `gorm:"default:false" json:"verified_by_admin"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`

	User  *User  `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Match *Match `gorm:"foreignKey:MatchID" json:"match,omitempty"`
}

type WalletTransaction struct {
	ID          uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID      uint           `gorm:"index" json:"user_id"`
	Type        string         `json:"type"`        // credit / debit
	Amount      float64        `json:"amount"`
	Description string         `json:"description"`
	Status      string         `gorm:"default:'pending'" json:"status"` // pending / approved / rejected
	ApprovedBy  *uint          `json:"approved_by"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

type Referral struct {
	ID           uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	ReferrerID   uint           `gorm:"index" json:"referrer_id"`
	ReferredID   uint           `gorm:"uniqueIndex" json:"referred_id"`
	RewardAmount float64        `json:"reward_amount"`
	Status       string         `gorm:"default:'pending'" json:"status"` // pending / credited
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	Referrer *User `gorm:"foreignKey:ReferrerID" json:"referrer,omitempty"`
	Referred *User `gorm:"foreignKey:ReferredID" json:"referred,omitempty"`
}

type PlatformSetting struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Key       string    `gorm:"uniqueIndex;not null" json:"key"`
	Value     string    `json:"value"`
	UpdatedAt time.Time `json:"updated_at"`
}

type AddMoneyRequest struct {
	ID         uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID     uint           `gorm:"index" json:"user_id"`
	Amount     float64        `json:"amount"`
	Status     string         `gorm:"default:'pending'" json:"status"` // pending / approved / rejected
	ApprovedBy *uint          `json:"approved_by"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`

	User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

type WithdrawRequest struct {
	ID         uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID     uint           `gorm:"index" json:"user_id"`
	Amount     float64        `json:"amount"`
	UPIID      string         `json:"upi_id"`
	Status     string         `gorm:"default:'pending'" json:"status"` // pending / approved / rejected
	ApprovedBy *uint          `json:"approved_by"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`

	User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}
