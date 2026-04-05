// routes/transactions.js  —  Send money, History, Search
'use strict';

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { queries }    = require('../config/db');
const auth           = require('../middleware/auth');

const router = express.Router();
router.use(auth);

function formatCurrency(n) { return Number(n).toFixed(2); }
function normalizePhone(phone) { return phone.replace(/\D/g, '').replace(/^92/, '0'); }

// ─── POST /api/transactions/send ─────────────
// Body: { recipient_phone, amount, note }
router.post('/send', (req, res) => {
  try {
    let { recipient_phone, amount, note } = req.body;

    if (!recipient_phone)
      return res.status(400).json({ success: false, message: 'Recipient phone number is required.' });
    if (!amount || isNaN(amount) || amount <= 0)
      return res.status(400).json({ success: false, message: 'Enter a valid amount.' });

    recipient_phone = normalizePhone(recipient_phone);
    amount          = parseFloat(amount);

    if (amount < 1)
      return res.status(400).json({ success: false, message: 'Minimum transfer amount is PKR 1.' });
    if (amount > 50000)
      return res.status(400).json({ success: false, message: 'Maximum single transfer is PKR 50,000.' });

    const sender = queries.findUserById.get(req.user.id);
    if (sender.balance < amount)
      return res.status(400).json({ success: false, message: 'Insufficient balance.' });
    if (sender.phone === recipient_phone)
      return res.status(400).json({ success: false, message: 'Cannot send money to yourself.' });

    // Deduct from sender
    const senderNewBalance = sender.balance - amount;
    queries.updateBalance.run(senderNewBalance, sender.id);

    // Look up recipient (may or may not be registered)
    const recipient     = queries.findUserByPhone.get(recipient_phone);
    const recipientName = recipient ? recipient.name : 'SwiftPay User';

    // Credit recipient if registered
    if (recipient) {
      const recipientNewBalance = recipient.balance + amount;
      queries.updateBalance.run(recipientNewBalance, recipient.id);

      // Log received transaction for recipient
      queries.createTransaction.run({
        id:              uuidv4(),
        user_id:         recipient.id,
        type:            'received',
        amount,
        balance_after:   recipientNewBalance,
        recipient_phone: sender.phone,
        recipient_name:  sender.name,
        note:            note || 'Transfer',
        icon:            'fa-arrow-down',
        color:           'green',
        status:          'success',
      });

      // Notify recipient
      queries.createNotification.run({
        user_id: recipient.id,
        title:   'Money Received 💚',
        body:    `You received PKR ${formatCurrency(amount)} from ${sender.name}`,
        icon:    'fa-arrow-down',
        color:   'green',
      });
    }

    // Log sent transaction for sender
    const txnId = uuidv4();
    queries.createTransaction.run({
      id:              txnId,
      user_id:         sender.id,
      type:            'sent',
      amount,
      balance_after:   senderNewBalance,
      recipient_phone,
      recipient_name:  recipientName,
      note:            note || 'Transfer',
      icon:            'fa-paper-plane',
      color:           'teal',
      status:          'success',
    });

    queries.createNotification.run({
      user_id: sender.id,
      title:   'Money Sent ✅',
      body:    `PKR ${formatCurrency(amount)} sent to ${recipientName}`,
      icon:    'fa-paper-plane',
      color:   'teal',
    });

    res.json({
      success:        true,
      message:        `PKR ${formatCurrency(amount)} sent to ${recipientName} successfully.`,
      balance:        senderNewBalance,
      transaction_id: txnId,
      recipient: {
        phone:      recipient_phone,
        name:       recipientName,
        registered: !!recipient,
      },
    });
  } catch (err) {
    console.error('Send error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /api/transactions ────────────────────
// Query: ?filter=all|sent|received|bills|topup|withdraw  &page=1  &limit=20  &search=text
router.get('/', (req, res) => {
  try {
    const { filter = 'all', page = 1, limit = 20, search = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let txns;

    if (search) {
      const like = `%${search}%`;
      txns = queries.searchTransactions.all(req.user.id, like, like);
    } else if (filter === 'all') {
      txns = queries.getTransactions.all(req.user.id, parseInt(limit), offset);
    } else {
      txns = queries.getTransactionsByType.all(req.user.id, filter, parseInt(limit), offset);
    }

    const total = queries.countTransactions.get(req.user.id).cnt;

    res.json({
      success: true,
      transactions: txns,
      pagination: {
        total,
        page:  parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('Get transactions error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /api/transactions/recent ────────────
// Returns the 5 most recent transactions (for Home tab)
router.get('/recent', (req, res) => {
  try {
    const txns = queries.getTransactions.all(req.user.id, 5, 0);
    res.json({ success: true, transactions: txns });
  } catch (err) {
    console.error('Recent transactions error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
