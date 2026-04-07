# 🔥 BattleZone Arena — Free Fire Tournament Platform

A complete, production-ready Free Fire tournament platform where players can join matches, compete, and earn real money per kill.

---

## ✨ Features

### User Features
- 📱 **Phone OTP Login** via 2Factor.in
- 🎮 **Free Fire UID Binding** (mandatory, one-time)
- 🏠 **Home Page** with live match listings and banner slider
- ⚔️ **Match Joining** with entry fee deduction
- 🔑 **Room ID and Password** shown only after joining
- 📸 **Result Screenshot Upload**
- 💰 **Wallet System** (add money, withdraw, transaction history)
- 🏆 **Leaderboard** (daily/weekly/monthly)
- 👤 **Profile Page** with stats
- 👥 **Referral Program** with code sharing
- 🎮 **Create Custom Matches** (user-created rooms)

### Admin Panel
- 📊 **Dashboard** with real-time stats
- ➕ **Create Matches** (type, entry fee, per kill, map, room details)
- ✅ **Verify Results** (view screenshots, enter kills/rank, auto-credit rewards)
- 🏆 **Award Top Killer Bonus** (from profit)
- 👥 **User Management** (view all users, change UID)
- 💰 **Wallet Management** (approve add money and withdrawals)
- 👥 **Referral Management** (view all referrals)
- ⚙️ **Platform Settings** (signup bonus, referral rewards, commission)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 + Tailwind CSS + ShadCN UI |
| Backend | Golang (Gin framework) |
| Database | PostgreSQL |
| ORM | GORM |
| Auth | 2Factor.in SMS OTP |
| Storage | AWS S3 (screenshots) |
| Cache | Redis |
| Containerization | Docker + Docker Compose |

---

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Or Go 1.22+, Node.js 20+, PostgreSQL, Redis

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/gitlokesh1/Free-Fire.git
cd Free-Fire

# Copy environment files
cp backend/.env.example backend/.env

# Edit backend/.env with your API keys
# Start all services
docker-compose up -d

# Frontend: http://localhost:3000
# Backend API: http://localhost:8080
```

### Option 2: Manual Setup

#### Backend

```bash
cd backend
go mod download
cp .env.example .env
# Edit .env
go run cmd/main.go
```

#### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local
npm run dev
```

---

## ⚙️ Environment Variables

### Backend `.env`

| Variable | Description |
|----------|-------------|
| `DB_HOST` | PostgreSQL host |
| `DB_PORT` | PostgreSQL port |
| `DB_USER` | Database user |
| `DB_PASSWORD` | Database password |
| `DB_NAME` | Database name |
| `REDIS_ADDR` | Redis address |
| `JWT_SECRET` | Secret key for JWT tokens |
| `TWOFACTOR_API_KEY` | API key from 2factor.in |
| `AWS_S3_BUCKET` | S3 bucket for screenshots |
| `AWS_REGION` | AWS region |
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `PORT` | Server port (default: 8080) |

### Frontend `.env.local`

```
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

---

## 📱 Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Banner slider, live matches |
| Login | `/login` | Phone OTP authentication |
| UID Bind | `/bind-uid` | Free Fire UID binding |
| Matches | `/matches` | All matches with filters |
| Match Detail | `/match/[id]` | Match info, join, room credentials |
| Result Upload | `/result/[id]` | Screenshot upload |
| Wallet | `/wallet` | Balance, transactions |
| Leaderboard | `/leaderboard` | Top players |
| Profile | `/profile` | User stats, settings |
| Referral | `/referral` | Referral code and earnings |
| Admin | `/admin` | Complete admin dashboard |

---

## 💰 Revenue Model

```
50 Players x Rs.15 entry = Rs.750 total
Per kill = Rs.5
~80 kills x Rs.5 = Rs.400 paid
Platform profit = Rs.350
Top killer bonus = Admin decides from profit
```

---

## 🔒 UID Binding Rules

- Mandatory to join any match
- One-time binding (admin can change once)
- No duplicate UIDs
- Screenshots must show bound UID

---

## 🔐 Make a User Admin

```sql
UPDATE users SET is_admin = true WHERE phone = '+91XXXXXXXXXX';
```

---

## 📊 Database Schema

- `users` — accounts, wallet, referral code
- `matches` — tournament matches
- `match_participants` — joins, results, rewards
- `wallet_transactions` — credits and debits
- `referrals` — referral tracking
- `platform_settings` — admin settings
- `add_money_requests` — add money approvals
- `withdraw_requests` — withdrawal approvals