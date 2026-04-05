// routes/auth.js  —  Registration, Login, OTP verification
'use strict';

const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { queries }    = require('../config/db');

const router = express.Router();

// ─── HELPERS ──────────────────────────────────
function generateOTP()  { return String(Math.floor(100000 + Math.random() * 900000)); }
function otpExpiry(sec) {
  const d = new Date();
  d.setSeconds(d.getSeconds() + (sec || 120));
  return d.toISOString().replace('T', ' ').slice(0, 19);
}
function makeToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}
function normalizePhone(phone) {
  // Store as 03XXXXXXXXX (11 digits, no dashes)
  return phone.replace(/\D/g, '').replace(/^92/, '0');
}
function safeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

// ─── POST /api/auth/register ──────────────────
// Body: { name, phone, cnic, password }
router.post('/register', async (req, res) => {
  try {
    let { name, phone, cnic, password } = req.body;

    // Validation
    if (!name || !phone || !cnic || !password)
      return res.status(400).json({ success: false, message: 'All fields are required.' });

    phone = normalizePhone(phone);
    cnic  = cnic.replace(/\D/g, '');

    if (phone.length !== 11)
      return res.status(400).json({ success: false, message: 'Enter a valid 11-digit mobile number.' });
    if (cnic.length !== 13)
      return res.status(400).json({ success: false, message: 'Enter a valid 13-digit CNIC.' });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });

    // Duplicate check
    const existing = queries.findUserByPhone.get(phone);
    if (existing)
      return res.status(409).json({ success: false, message: 'This phone number is already registered.' });

    // Hash password
    const hashed = await bcrypt.hash(password, 12);
    const id     = uuidv4();
    const initialBalance = parseFloat(process.env.DEMO_BONUS || 500);

    queries.createUser.run({ id, name, phone, cnic, password: hashed, balance: initialBalance });

    // Generate & store OTP
    const code = generateOTP();
    queries.createOTP.run({ phone, code, purpose: 'signup', expires_at: otpExpiry(parseInt(process.env.OTP_EXPIRY) || 120) });

    // In production: send via SMS API (Jazz/Telenor USSD gateway)
    console.log(`[OTP] Phone: ${phone}  Code: ${code}  (Demo — not sending SMS)`);

    res.status(201).json({
      success: true,
      message: 'Account created. OTP sent to your number.',
      phone,
      // Expose OTP in dev mode only
      ...(process.env.NODE_ENV !== 'production' && { dev_otp: code }),
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// ─── POST /api/auth/login ─────────────────────
// Body: { phone, password }
router.post('/login', async (req, res) => {
  try {
    let { phone, password } = req.body;

    if (!phone || !password)
      return res.status(400).json({ success: false, message: 'Phone and password are required.' });

    phone = normalizePhone(phone);

    const user = queries.findUserByPhone.get(phone);
    if (!user)
      return res.status(401).json({ success: false, message: 'Phone number not registered.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ success: false, message: 'Incorrect password.' });

    // Generate & store OTP
    const code = generateOTP();
    queries.createOTP.run({ phone, code, purpose: 'login', expires_at: otpExpiry(parseInt(process.env.OTP_EXPIRY) || 120) });
    queries.clearOldOTPs.run();

    console.log(`[OTP] Phone: ${phone}  Code: ${code}  (Demo — not sending SMS)`);

    res.json({
      success: true,
      message: 'OTP sent to your number.',
      phone,
      ...(process.env.NODE_ENV !== 'production' && { dev_otp: code }),
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// ─── POST /api/auth/verify-otp ────────────────
// Body: { phone, otp, purpose }
router.post('/verify-otp', (req, res) => {
  try {
    let { phone, otp, purpose = 'login' } = req.body;

    if (!phone || !otp)
      return res.status(400).json({ success: false, message: 'Phone and OTP are required.' });

    phone = normalizePhone(phone);

    const record = queries.findValidOTP.get(phone, otp, purpose);
    if (!record)
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });

    // Mark OTP used
    queries.markOTPUsed.run(record.id);
    queries.verifyUser.run(phone);

    const user  = queries.findUserByPhone.get(phone);
    const token = makeToken(user.id);

    // Welcome notification for new users
    if (purpose === 'signup') {
      queries.createNotification.run({
        user_id: user.id,
        title:   'Welcome to SwiftPay! 🎉',
        body:    `Your account is active. You've received PKR ${process.env.DEMO_BONUS || 500} welcome bonus.`,
        icon:    'fa-gift',
        color:   'green',
      });
    }

    res.json({
      success: true,
      message: 'OTP verified successfully.',
      token,
      user: safeUser(user),
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// ─── POST /api/auth/resend-otp ────────────────
// Body: { phone, purpose }
router.post('/resend-otp', (req, res) => {
  try {
    let { phone, purpose = 'login' } = req.body;

    if (!phone)
      return res.status(400).json({ success: false, message: 'Phone is required.' });

    phone = normalizePhone(phone);

    const user = queries.findUserByPhone.get(phone);
    if (!user)
      return res.status(404).json({ success: false, message: 'Phone number not registered.' });

    const code = generateOTP();
    queries.createOTP.run({ phone, code, purpose, expires_at: otpExpiry(120) });

    console.log(`[OTP RESEND] Phone: ${phone}  Code: ${code}`);

    res.json({
      success: true,
      message: 'New OTP sent.',
      ...(process.env.NODE_ENV !== 'production' && { dev_otp: code }),
    });
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
