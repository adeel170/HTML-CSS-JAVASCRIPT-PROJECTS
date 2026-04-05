# SwiftPay Backend — Setup Guide

## 📁 Project Structure

```
swiftpay-backend/
├── server.js               ← Entry point
├── package.json
├── .env.example            ← Copy to .env
├── swiftpay.db             ← Auto-created on first run (SQLite)
│
├── config/
│   └── db.js               ← Database schema & queries
│
├── middleware/
│   └── auth.js             ← JWT verification
│
├── routes/
│   ├── auth.js             ← Register, Login, OTP
│   ├── wallet.js           ← Balance, Top-Up, Withdraw
│   ├── transactions.js     ← Send money, History
│   ├── services.js         ← Recharge, Bills
│   └── profile.js          ← Profile, Notifications
│
└── public/
    └── app.js              ← Updated frontend (copy to your project)
```

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
cd swiftpay-backend
npm install
```

### 2. Create .env file
```bash
cp .env.example .env
```
Edit `.env` if needed (defaults work fine for development).

### 3. Start the server
```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

Server runs at: **http://localhost:5000**

### 4. Connect the frontend
- Copy `public/app.js` to your frontend folder (replaces the old `app.js`)
- Make sure `index.html` has `<script src="app.js"></script>` at the bottom
- Open `index.html` in VS Code with **Live Server** (port 5500)

---

## 📡 API Reference

### Base URL: `http://localhost:5000/api`

### Auth (No token required)
| Method | Endpoint | Body |
|--------|----------|------|
| POST | `/auth/register` | `{ name, phone, cnic, password }` |
| POST | `/auth/login` | `{ phone, password }` |
| POST | `/auth/verify-otp` | `{ phone, otp, purpose }` |
| POST | `/auth/resend-otp` | `{ phone, purpose }` |

> **Dev mode:** OTP is printed to terminal AND returned in the response as `dev_otp`. No SMS is sent.

### Wallet (Token required)
| Method | Endpoint | Body |
|--------|----------|------|
| GET | `/wallet/balance` | — |
| GET | `/wallet/summary` | — |
| POST | `/wallet/topup` | `{ method, amount }` |
| POST | `/wallet/withdraw` | `{ amount, cnic }` |

### Transactions (Token required)
| Method | Endpoint | Body / Query |
|--------|----------|------|
| POST | `/transactions/send` | `{ recipient_phone, amount, note }` |
| GET | `/transactions` | `?filter=all&page=1&limit=20&search=` |
| GET | `/transactions/recent` | — |

### Services (Token required)
| Method | Endpoint | Body |
|--------|----------|------|
| POST | `/services/recharge` | `{ network, phone, amount }` |
| POST | `/services/bill` | `{ category, reference, amount }` |

### Profile (Token required)
| Method | Endpoint | Body |
|--------|----------|------|
| GET | `/profile` | — |
| PUT | `/profile` | `{ name, avatar }` |
| PUT | `/profile/password` | `{ current_password, new_password }` |
| GET | `/profile/notifications` | — |
| PUT | `/profile/notifications/read` | — |

---

## 🔑 Auth Flow

```
Register → OTP (dev_otp in response) → Verify OTP → JWT Token
Login    → OTP (dev_otp in response) → Verify OTP → JWT Token
```

Token must be sent as: `Authorization: Bearer <token>`

---

## 🧪 Testing with curl

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Adeel Ahmad","phone":"03001234567","cnic":"3520112345671","password":"secret123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"03001234567","password":"secret123"}'

# Verify OTP (use dev_otp from above response)
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"03001234567","otp":"123456","purpose":"login"}'

# Get balance (use token from verify-otp response)
curl http://localhost:5000/api/wallet/balance \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | SQLite (better-sqlite3) |
| Auth | JWT (jsonwebtoken) |
| Passwords | bcryptjs |
| Dev server | nodemon |

---

## 🌐 Production Notes

- Set `NODE_ENV=production` in `.env` to hide `dev_otp` from responses
- Replace the OTP section in `routes/auth.js` with a real SMS API (Jazz USSD, Twilio, etc.)
- Use HTTPS (put Express behind Nginx)
- Change `JWT_SECRET` to a long random string
