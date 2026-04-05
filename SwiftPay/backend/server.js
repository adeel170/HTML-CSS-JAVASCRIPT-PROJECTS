// server.js  —  SwiftPay REST API
'use strict';

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');
const path    = require('path');

const app = express();

// ─── MIDDLEWARE ───────────────────────────────
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000',
           'http://localhost:5500', 'http://127.0.0.1:5500',
           'null'],           // allow file:// origin during dev
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));       // request logging

// ─── SERVE FRONTEND (optional) ───────────────
// Uncomment this if you place your HTML/CSS/JS in a 'public' folder
// app.use(express.static(path.join(__dirname, 'public')));

// ─── HEALTH CHECK ─────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    app:     'SwiftPay API',
    version: '1.0.0',
    status:  'running',
    time:    new Date().toISOString(),
  });
});

// ─── ROUTES ───────────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/wallet',       require('./routes/wallet'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/services',     require('./routes/services'));
app.use('/api/profile',      require('./routes/profile'));

// ─── 404 HANDLER ─────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// ─── GLOBAL ERROR HANDLER ────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ─── START ────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀  SwiftPay API running on http://localhost:${PORT}`);
  console.log(`📋  Health check: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
