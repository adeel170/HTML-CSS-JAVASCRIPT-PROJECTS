// routes/profile.js  —  Profile & Notifications
'use strict';

const express = require('express');
const bcrypt  = require('bcryptjs');
const { queries } = require('../config/db');
const auth        = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// ─── GET /api/profile ─────────────────────────
router.get('/', (req, res) => {
  const user = queries.findUserById.get(req.user.id);
  const { password: _, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

// ─── PUT /api/profile ─────────────────────────
// Body: { name, avatar }
router.put('/', (req, res) => {
  try {
    const { name, avatar } = req.body;
    if (!name || name.trim().length < 2)
      return res.status(400).json({ success: false, message: 'Enter a valid name.' });

    queries.updateProfile.run(name.trim(), avatar || null, req.user.id);
    const updated = queries.findUserById.get(req.user.id);
    const { password: _, ...safeUser } = updated;

    res.json({ success: true, message: 'Profile updated.', user: safeUser });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── PUT /api/profile/password ────────────────
// Body: { current_password, new_password }
router.put('/password', async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password)
      return res.status(400).json({ success: false, message: 'Both fields are required.' });
    if (new_password.length < 6)
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });

    const user  = queries.findUserById.get(req.user.id);
    const match = await bcrypt.compare(current_password, user.password);
    if (!match)
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });

    const hashed = await bcrypt.hash(new_password, 12);
    const db = require('../config/db').db;
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, req.user.id);

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /api/profile/notifications ──────────
router.get('/notifications', (req, res) => {
  try {
    const notifications = queries.getNotifications.all(req.user.id);
    const unread        = queries.unreadCount.get(req.user.id).cnt;
    res.json({ success: true, notifications, unread });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── PUT /api/profile/notifications/read ─────
router.put('/notifications/read', (req, res) => {
  queries.markNotifRead.run(req.user.id);
  res.json({ success: true, message: 'All notifications marked as read.' });
});

module.exports = router;
