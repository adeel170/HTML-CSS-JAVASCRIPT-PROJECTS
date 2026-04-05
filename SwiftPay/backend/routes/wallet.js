// routes/wallet.js  —  Balance, Top-Up, Withdraw
'use strict';

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { queries }    = require('../config/db');
const auth           = require('../middleware/auth');

const router = express.Router();
router.use(auth); // All wallet routes require authentication

function formatCurrency(n) { return Number(n).toFixed(2); }

// ─── GET /api/wallet/balance ──────────────────
router.get('/balance', (req, res) => {
  const user = queries.findUserById.get(req.user.id);
  res.json({
    success: true,
    balance: user.balance,
    balance_formatted: `PKR ${formatCurrency(user.balance)}`,
  });
});

// ─── GET /api/wallet/summary ──────────────────
// Returns balance + monthly income/expense stats
router.get('/summary', (req, res) => {
  const user = queries.findUserById.get(req.user.id);

  // Monthly totals from transactions
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const allTxns = queries.getTransactions.all(req.user.id, 200, 0);
  const recent  = allTxns.filter(t => new Date(t.created_at) >= monthStart);

  const income  = recent.filter(t => t.type === 'received' || t.type === 'topup')
                        .reduce((sum, t) => sum + t.amount, 0);
  const expense = recent.filter(t => t.type === 'sent' || t.type === 'bills' || t.type === 'withdraw')
                        .reduce((sum, t) => sum + t.amount, 0);

  res.json({
    success: true,
    balance:  user.balance,
    income,
    expense,
    phone:    user.phone,
  });
});

// ─── POST /api/wallet/topup ───────────────────
// Body: { method, amount }
// Methods: 'bank' | 'atm' | 'agent' | 'easyload'
router.post('/topup', (req, res) => {
  try {
    const { method, amount } = req.body;

    if (!method) return res.status(400).json({ success: false, message: 'Select a top-up method.' });
    if (!amount || isNaN(amount) || amount <= 0)
      return res.status(400).json({ success: false, message: 'Enter a valid amount.' });
    if (amount > 100000)
      return res.status(400).json({ success: false, message: 'Maximum top-up limit is PKR 100,000.' });

    const user       = queries.findUserById.get(req.user.id);
    const newBalance = user.balance + parseFloat(amount);

    queries.updateBalance.run(newBalance, user.id);

    const methodLabels = { bank: 'Bank Transfer', atm: 'ATM / Card', agent: 'Agent Shop', easyload: 'EasyLoad' };
    const txnId = uuidv4();

    queries.createTransaction.run({
      id:              txnId,
      user_id:         user.id,
      type:            'topup',
      amount:          parseFloat(amount),
      balance_after:   newBalance,
      recipient_phone: null,
      recipient_name:  methodLabels[method] || 'Top-Up',
      note:            `Top-up via ${methodLabels[method] || method}`,
      icon:            'fa-plus',
      color:           'purple',
      status:          'success',
    });

    queries.createNotification.run({
      user_id: user.id,
      title:   'Wallet Topped Up ✅',
      body:    `PKR ${formatCurrency(amount)} added via ${methodLabels[method] || method}`,
      icon:    'fa-plus',
      color:   'purple',
    });

    res.json({
      success:     true,
      message:     `PKR ${formatCurrency(amount)} added to your wallet.`,
      balance:     newBalance,
      transaction: txnId,
    });
  } catch (err) {
    console.error('Top-up error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── POST /api/wallet/withdraw ────────────────
// Body: { amount, cnic }
router.post('/withdraw', (req, res) => {
  try {
    const { amount, cnic } = req.body;

    if (!amount || isNaN(amount) || amount <= 0)
      return res.status(400).json({ success: false, message: 'Enter a valid withdrawal amount.' });
    if (!cnic)
      return res.status(400).json({ success: false, message: 'CNIC is required.' });
    if (amount < 100)
      return res.status(400).json({ success: false, message: 'Minimum withdrawal is PKR 100.' });
    if (amount > 25000)
      return res.status(400).json({ success: false, message: 'Maximum single withdrawal is PKR 25,000.' });

    const user = queries.findUserById.get(req.user.id);
    if (user.balance < parseFloat(amount))
      return res.status(400).json({ success: false, message: 'Insufficient balance.' });

    const newBalance    = user.balance - parseFloat(amount);
    const withdrawCode  = String(Math.floor(100000 + Math.random() * 900000));

    queries.updateBalance.run(newBalance, user.id);

    const txnId = uuidv4();
    queries.createTransaction.run({
      id:              txnId,
      user_id:         user.id,
      type:            'withdraw',
      amount:          parseFloat(amount),
      balance_after:   newBalance,
      recipient_phone: null,
      recipient_name:  'Cash Withdrawal',
      note:            `Agent withdrawal · Code: ${withdrawCode}`,
      icon:            'fa-money-bill-wave',
      color:           'pink',
      status:          'success',
    });

    queries.createNotification.run({
      user_id: user.id,
      title:   'Withdrawal Initiated 💸',
      body:    `PKR ${formatCurrency(amount)} withdrawal. Code: ${withdrawCode}`,
      icon:    'fa-money-bill-wave',
      color:   'pink',
    });

    res.json({
      success:       true,
      message:       'Withdrawal code generated. Visit nearest SwiftPay agent.',
      withdraw_code: withdrawCode,
      balance:       newBalance,
      amount:        parseFloat(amount),
      transaction:   txnId,
    });
  } catch (err) {
    console.error('Withdraw error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
