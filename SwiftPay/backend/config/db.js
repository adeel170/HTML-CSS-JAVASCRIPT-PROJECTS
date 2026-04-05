// config/db.js  —  SQLite database setup & schema
'use strict';

const Database = require('better-sqlite3');
const path     = require('path');

const DB_PATH = path.join(__dirname, '..', 'swiftpay.db');
const db      = new Database(DB_PATH);

// Performance pragmas
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── SCHEMA ───────────────────────────────────────────────────────────────────

db.exec(`
  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    phone        TEXT UNIQUE NOT NULL,
    cnic         TEXT UNIQUE NOT NULL,
    password     TEXT NOT NULL,
    balance      REAL NOT NULL DEFAULT 0,
    is_verified  INTEGER NOT NULL DEFAULT 0,
    avatar       TEXT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- OTP table (short-lived)
  CREATE TABLE IF NOT EXISTS otps (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    phone       TEXT NOT NULL,
    code        TEXT NOT NULL,
    purpose     TEXT NOT NULL DEFAULT 'login',   -- 'login' | 'signup' | 'withdraw'
    expires_at  TEXT NOT NULL,
    used        INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Transactions table
  CREATE TABLE IF NOT EXISTS transactions (
    id           TEXT PRIMARY KEY,
    user_id      TEXT NOT NULL,
    type         TEXT NOT NULL,   -- 'sent' | 'received' | 'topup' | 'bills' | 'withdraw'
    amount       REAL NOT NULL,
    balance_after REAL NOT NULL,
    recipient_phone TEXT,
    recipient_name  TEXT,
    note         TEXT,
    icon         TEXT,
    color        TEXT,
    status       TEXT NOT NULL DEFAULT 'success',  -- 'success' | 'pending' | 'failed'
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- Notifications table
  CREATE TABLE IF NOT EXISTS notifications (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     TEXT NOT NULL,
    title       TEXT NOT NULL,
    body        TEXT NOT NULL,
    icon        TEXT,
    color       TEXT,
    is_read     INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// ─── HELPER QUERY BUILDERS ─────────────────────────────────────────────────

const queries = {
  // Users
  findUserByPhone:  db.prepare('SELECT * FROM users WHERE phone = ?'),
  findUserById:     db.prepare('SELECT * FROM users WHERE id = ?'),
  createUser:       db.prepare(`
    INSERT INTO users (id, name, phone, cnic, password, balance)
    VALUES (@id, @name, @phone, @cnic, @password, @balance)
  `),
  updateBalance:    db.prepare('UPDATE users SET balance = ? WHERE id = ?'),
  updateProfile:    db.prepare('UPDATE users SET name = ?, avatar = ? WHERE id = ?'),
  verifyUser:       db.prepare('UPDATE users SET is_verified = 1 WHERE phone = ?'),

  // OTPs
  createOTP:        db.prepare(`
    INSERT INTO otps (phone, code, purpose, expires_at)
    VALUES (@phone, @code, @purpose, @expires_at)
  `),
  findValidOTP:     db.prepare(`
    SELECT * FROM otps
    WHERE phone = ? AND code = ? AND purpose = ?
      AND used = 0 AND expires_at > datetime('now')
    ORDER BY created_at DESC LIMIT 1
  `),
  markOTPUsed:      db.prepare('UPDATE otps SET used = 1 WHERE id = ?'),
  clearOldOTPs:     db.prepare(`DELETE FROM otps WHERE expires_at < datetime('now', '-1 day')`),

  // Transactions
  createTransaction: db.prepare(`
    INSERT INTO transactions
      (id, user_id, type, amount, balance_after, recipient_phone, recipient_name, note, icon, color, status)
    VALUES
      (@id, @user_id, @type, @amount, @balance_after, @recipient_phone, @recipient_name, @note, @icon, @color, @status)
  `),
  getTransactions: db.prepare(`
    SELECT * FROM transactions WHERE user_id = ?
    ORDER BY created_at DESC LIMIT ? OFFSET ?
  `),
  getTransactionsByType: db.prepare(`
    SELECT * FROM transactions WHERE user_id = ? AND type = ?
    ORDER BY created_at DESC LIMIT ? OFFSET ?
  `),
  searchTransactions: db.prepare(`
    SELECT * FROM transactions
    WHERE user_id = ?
      AND (recipient_name LIKE ? OR note LIKE ?)
    ORDER BY created_at DESC LIMIT 50
  `),
  countTransactions: db.prepare('SELECT COUNT(*) as cnt FROM transactions WHERE user_id = ?'),

  // Notifications
  createNotification: db.prepare(`
    INSERT INTO notifications (user_id, title, body, icon, color)
    VALUES (@user_id, @title, @body, @icon, @color)
  `),
  getNotifications: db.prepare(`
    SELECT * FROM notifications WHERE user_id = ?
    ORDER BY created_at DESC LIMIT 20
  `),
  markNotifRead: db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?'),
  unreadCount:   db.prepare('SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ? AND is_read = 0'),
};

module.exports = { db, queries };
