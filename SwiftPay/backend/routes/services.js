// routes/services.js  —  Mobile Recharge, Bill Payments
'use strict';

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { queries }    = require('../config/db');
const auth           = require('../middleware/auth');

const router = express.Router();
router.use(auth);

function formatCurrency(n) { return Number(n).toFixed(2); }

const NETWORKS = { jazz: 'Jazz', zong: 'Zong', telenor: 'Telenor', ufone: 'Ufone' };
const BILLS    = {
  electricity: 'Electricity',
  gas:         'Gas',
  internet:    'Internet',
  water:       'Water',
  cable:       'Cable TV',
  tax:         'Tax',
};

// ─── POST /api/services/recharge ─────────────
// Body: { network, phone, amount }
router.post('/recharge', (req, res) => {
  try {
    let { network, phone, amount } = req.body;

    if (!network || !NETWORKS[network])
      return res.status(400).json({ success: false, message: 'Select a valid network.' });
    if (!phone)
      return res.status(400).json({ success: false, message: 'Enter mobile number.' });
    if (!amount || isNaN(amount) || amount <= 0)
      return res.status(400).json({ success: false, message: 'Enter a valid amount.' });
    if (amount < 10)
      return res.status(400).json({ success: false, message: 'Minimum recharge is PKR 10.' });
    if (amount > 10000)
      return res.status(400).json({ success: false, message: 'Maximum recharge is PKR 10,000.' });

    amount = parseFloat(amount);

    const user = queries.findUserById.get(req.user.id);
    if (user.balance < amount)
      return res.status(400).json({ success: false, message: 'Insufficient balance.' });

    const newBalance  = user.balance - amount;
    const networkName = NETWORKS[network];

    queries.updateBalance.run(newBalance, user.id);

    const txnId = uuidv4();
    queries.createTransaction.run({
      id:              txnId,
      user_id:         user.id,
      type:            'bills',
      amount,
      balance_after:   newBalance,
      recipient_phone: phone,
      recipient_name:  `${networkName} Recharge`,
      note:            phone,
      icon:            'fa-mobile-screen',
      color:           'purple',
      status:          'success',
    });

    queries.createNotification.run({
      user_id: user.id,
      title:   `${networkName} Recharge Done 📱`,
      body:    `PKR ${formatCurrency(amount)} recharge to ${phone}`,
      icon:    'fa-mobile-screen',
      color:   'purple',
    });

    res.json({
      success:        true,
      message:        `PKR ${formatCurrency(amount)} ${networkName} recharge successful!`,
      balance:        newBalance,
      transaction_id: txnId,
    });
  } catch (err) {
    console.error('Recharge error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── POST /api/services/bill ──────────────────
// Body: { category, reference, amount }
router.post('/bill', (req, res) => {
  try {
    let { category, reference, amount } = req.body;

    if (!category || !BILLS[category])
      return res.status(400).json({ success: false, message: 'Select a valid bill category.' });
    if (!reference)
      return res.status(400).json({ success: false, message: 'Enter bill reference / consumer number.' });
    if (!amount || isNaN(amount) || amount <= 0)
      return res.status(400).json({ success: false, message: 'Enter a valid amount.' });

    amount = parseFloat(amount);

    const user = queries.findUserById.get(req.user.id);
    if (user.balance < amount)
      return res.status(400).json({ success: false, message: 'Insufficient balance.' });

    const newBalance = user.balance - amount;
    const billName   = BILLS[category];

    queries.updateBalance.run(newBalance, user.id);

    const txnId = uuidv4();
    queries.createTransaction.run({
      id:              txnId,
      user_id:         user.id,
      type:            'bills',
      amount,
      balance_after:   newBalance,
      recipient_phone: null,
      recipient_name:  `${billName} Bill`,
      note:            `Ref: ${reference}`,
      icon:            'fa-bolt',
      color:           'orange',
      status:          'success',
    });

    queries.createNotification.run({
      user_id: user.id,
      title:   `${billName} Bill Paid ✅`,
      body:    `PKR ${formatCurrency(amount)} paid. Ref: ${reference}`,
      icon:    'fa-bolt',
      color:   'orange',
    });

    res.json({
      success:        true,
      message:        `${billName} bill of PKR ${formatCurrency(amount)} paid successfully!`,
      balance:        newBalance,
      transaction_id: txnId,
      receipt: {
        category,
        reference,
        amount,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Bill error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
