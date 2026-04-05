/* =============================================
   SwiftPay — app.js  (API-connected version)
   ============================================= */
'use strict';

// ─── CONFIG ───────────────────────────────────
const API_BASE = 'http://localhost:5000/api';

// ─── STATE ────────────────────────────────────
const state = {
  token:          null,
  user:           null,
  balance:        0,
  balanceVisible: true,
  onboardSlide:   0,
  otpTimer:       null,
  pendingPhone:   null,
  pendingPurpose: 'login',
  selectedNetwork: 'jazz',
  activeTab:      'home',
};

// ─── API HELPER ───────────────────────────────
async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`;

  try {
    const res  = await fetch(API_BASE + path, { ...options, headers });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    console.error('API Error:', err);
    return { ok: false, data: { message: 'Cannot connect to server. Check if backend is running.' } };
  }
}

// ─── LOCAL STORAGE ────────────────────────────
function saveSession() {
  localStorage.setItem('swiftpay_token', state.token || '');
  localStorage.setItem('swiftpay_user',  JSON.stringify(state.user || {}));
}

function loadSession() {
  state.token = localStorage.getItem('swiftpay_token') || null;
  const u     = localStorage.getItem('swiftpay_user');
  state.user  = u ? JSON.parse(u) : null;
}

// ─── HELPERS ──────────────────────────────────
function formatCurrency(amount) {
  return Number(amount).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now  = new Date();
  const diff = now - date;
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)   return 'Just now';
  if (mins  < 60)  return `${mins} min ago`;
  if (hours < 24)  return `${hours} hr ago`;
  if (days  === 1) return 'Yesterday';
  return date.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });
}

function getInitials(name) {
  if (!name) return 'U';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning,';
  if (h < 17) return 'Good Afternoon,';
  return 'Good Evening,';
}

function normalizePhone(phone) {
  return phone.replace(/\D/g, '').replace(/^92/, '0');
}

// ─── SCREEN NAVIGATION ────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function goBack(target) { showScreen(target + '-screen'); }

// ─── SPLASH ───────────────────────────────────
function initSplash() {
  setTimeout(async () => {
    const onboarded = localStorage.getItem('swiftpay_onboarded');
    if (!onboarded) { showScreen('onboarding-screen'); return; }

    if (state.token) {
      // Verify token is still valid
      const { ok, data } = await api('/profile');
      if (ok) {
        state.user    = data.user;
        state.balance = data.user.balance;
        saveSession();
        showScreen('app-screen');
        refreshApp();
        return;
      }
      // Token expired — clear it
      state.token = null;
      localStorage.removeItem('swiftpay_token');
    }
    showScreen('auth-screen');
  }, 2600);
}

// ─── ONBOARDING ───────────────────────────────
function initOnboarding() {
  document.getElementById('onboard-next-btn').addEventListener('click', () => {
    state.onboardSlide < 2 ? goToSlide(state.onboardSlide + 1) : finishOnboarding();
  });
  document.getElementById('onboard-skip-btn').addEventListener('click', finishOnboarding);
}

function goToSlide(index) {
  document.querySelectorAll('.onboard-slide').forEach((s, i) => s.classList.toggle('active', i === index));
  document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === index));
  state.onboardSlide = index;
  document.getElementById('onboard-next-btn').textContent = index === 2 ? 'Get Started' : 'Next';
}

function finishOnboarding() {
  localStorage.setItem('swiftpay_onboarded', 'true');
  showScreen('auth-screen');
}

// ─── AUTH ─────────────────────────────────────
function initAuth() {
  // Tab switching
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab + '-form').classList.add('active');
    });
  });

  // Password toggles
  document.getElementById('toggle-login-pass').addEventListener('click',  () => togglePass('login-pass',  'toggle-login-pass'));
  document.getElementById('toggle-signup-pass').addEventListener('click', () => togglePass('signup-pass', 'toggle-signup-pass'));

  // Auto-format
  document.getElementById('signup-cnic').addEventListener('input',  formatCNIC);
  document.getElementById('login-phone').addEventListener('input',  formatPhoneInput);
  document.getElementById('signup-phone').addEventListener('input', formatPhoneInput);

  document.getElementById('login-btn').addEventListener('click',  handleLogin);
  document.getElementById('signup-btn').addEventListener('click', handleSignup);
}

function togglePass(inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon  = document.getElementById(iconId);
  input.type  = input.type === 'password' ? 'text' : 'password';
  icon.classList.toggle('fa-eye', input.type === 'password');
  icon.classList.toggle('fa-eye-slash', input.type === 'text');
}

function formatCNIC(e) {
  let v = e.target.value.replace(/\D/g, '');
  if (v.length > 5  && v.length <= 12) v = v.slice(0,5)  + '-' + v.slice(5);
  if (v.length > 13)                   v = v.slice(0,13) + '-' + v.slice(13,14);
  e.target.value = v;
}

function formatPhoneInput(e) {
  let v = e.target.value.replace(/\D/g, '');
  if (v.length > 4) v = v.slice(0,4) + '-' + v.slice(4,11);
  e.target.value = v;
}

// ─── LOGIN ────────────────────────────────────
async function handleLogin() {
  const phone    = document.getElementById('login-phone').value.trim();
  const password = document.getElementById('login-pass').value;
  if (!phone || !password) { showToast('Please fill in all fields'); return; }

  setBtnLoading('login-btn', true);
  const { ok, data } = await api('/auth/login', {
    method: 'POST',
    body:   JSON.stringify({ phone: normalizePhone(phone), password }),
  });
  setBtnLoading('login-btn', false);

  if (!ok) { showToast(data.message || 'Login failed'); return; }

  state.pendingPhone   = normalizePhone(phone);
  state.pendingPurpose = 'login';

  // Show dev OTP in toast during development
  if (data.dev_otp) showToast(`Dev OTP: ${data.dev_otp}`, 6000);

  document.getElementById('otp-phone-display').textContent = '+92 ' + state.pendingPhone.slice(1);
  showScreen('otp-screen');
  startOTPTimer();
}

// ─── SIGNUP ───────────────────────────────────
async function handleSignup() {
  const name     = document.getElementById('signup-name').value.trim();
  const phone    = document.getElementById('signup-phone').value.trim();
  const cnic     = document.getElementById('signup-cnic').value.trim();
  const password = document.getElementById('signup-pass').value;
  const confirm  = document.getElementById('signup-confirm').value;
  const terms    = document.getElementById('terms-check').checked;

  if (!name || !phone || !cnic || !password || !confirm) { showToast('Please fill in all fields'); return; }
  if (password !== confirm) { showToast('Passwords do not match'); return; }
  if (!terms)               { showToast('Accept Terms & Conditions'); return; }

  setBtnLoading('signup-btn', true);
  const { ok, data } = await api('/auth/register', {
    method: 'POST',
    body:   JSON.stringify({ name, phone: normalizePhone(phone), cnic, password }),
  });
  setBtnLoading('signup-btn', false);

  if (!ok) { showToast(data.message || 'Registration failed'); return; }

  state.pendingPhone   = normalizePhone(phone);
  state.pendingPurpose = 'signup';

  if (data.dev_otp) showToast(`Dev OTP: ${data.dev_otp}`, 6000);

  document.getElementById('otp-phone-display').textContent = '+92 ' + state.pendingPhone.slice(1);
  showScreen('otp-screen');
  startOTPTimer();
}

// ─── OTP ──────────────────────────────────────
function initOTP() {
  const boxes = document.querySelectorAll('.otp-box');

  boxes.forEach((box, i) => {
    box.addEventListener('input', e => {
      const val = e.target.value.replace(/\D/g,'');
      e.target.value = val;
      if (val && i < boxes.length - 1) boxes[i+1].focus();
    });
    box.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !box.value && i > 0) boxes[i-1].focus();
    });
    box.addEventListener('paste', e => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g,'').slice(0,6);
      [...text].forEach((ch, idx) => { if (boxes[idx]) boxes[idx].value = ch; });
      if (boxes[text.length - 1]) boxes[text.length - 1].focus();
    });
  });

  document.getElementById('verify-otp-btn').addEventListener('click', verifyOTP);
  document.getElementById('resend-otp').addEventListener('click', e => { e.preventDefault(); resendOTP(); });
}

function startOTPTimer(seconds = 30) {
  clearInterval(state.otpTimer);
  const timerEl   = document.getElementById('otp-timer');
  const resendBtn = document.getElementById('resend-otp');
  resendBtn.style.pointerEvents = 'none';
  resendBtn.style.opacity       = '0.4';
  let remaining = seconds;
  state.otpTimer = setInterval(() => {
    remaining--;
    timerEl.textContent = remaining > 0 ? `(${remaining}s)` : '';
    if (remaining <= 0) {
      clearInterval(state.otpTimer);
      resendBtn.style.pointerEvents = '';
      resendBtn.style.opacity       = '';
    }
  }, 1000);
}

async function resendOTP() {
  if (!state.pendingPhone) return;
  const { ok, data } = await api('/auth/resend-otp', {
    method: 'POST',
    body:   JSON.stringify({ phone: state.pendingPhone, purpose: state.pendingPurpose }),
  });
  if (!ok) { showToast(data.message || 'Could not resend OTP'); return; }
  document.querySelectorAll('.otp-box').forEach(b => b.value = '');
  document.querySelectorAll('.otp-box')[0].focus();
  startOTPTimer();
  if (data.dev_otp) showToast(`Dev OTP: ${data.dev_otp}`, 6000);
  else              showToast('New OTP sent!');
}

async function verifyOTP() {
  const otp = [...document.querySelectorAll('.otp-box')].map(b => b.value).join('');
  if (otp.length < 6) { showToast('Enter the 6-digit OTP'); return; }

  setBtnLoading('verify-otp-btn', true);
  const { ok, data } = await api('/auth/verify-otp', {
    method: 'POST',
    body:   JSON.stringify({ phone: state.pendingPhone, otp, purpose: state.pendingPurpose }),
  });
  setBtnLoading('verify-otp-btn', false);

  if (!ok) { showToast(data.message || 'Invalid OTP'); return; }

  state.token   = data.token;
  state.user    = data.user;
  state.balance = data.user.balance;
  saveSession();

  showScreen('app-screen');
  refreshApp();
  showToast(`Welcome to SwiftPay, ${data.user.name.split(' ')[0]}! 👋`);
}

// ─── APP BOOTSTRAP ────────────────────────────
async function refreshApp() {
  if (!state.user) return;
  const name      = state.user.name;
  const firstName = name.split(' ')[0];
  const initials  = getInitials(name);
  const phone     = '+92 ' + state.user.phone.slice(1);

  // DOM updates
  document.getElementById('greeting-text').textContent      = getGreeting();
  document.getElementById('display-name').textContent       = firstName;
  document.getElementById('profile-name').textContent       = name;
  document.getElementById('profile-phone').textContent      = phone;
  document.getElementById('user-avatar').textContent        = initials;
  document.getElementById('profile-avatar-big').textContent = initials;

  const wcardEl = document.getElementById('wcard-phone');
  const recvEl  = document.getElementById('receive-phone-num');
  if (wcardEl) wcardEl.textContent = phone;
  if (recvEl)  recvEl.textContent  = phone;

  // Fetch wallet summary
  await loadWalletSummary();

  // Fetch & render recent transactions
  await loadRecentTransactions();

  // Fetch notifications
  await loadNotifications();

  // UI init
  generateQRGrid();
  initBalanceToggle();
  initNotifyBtn();
  initQRBtn();
  initBiometricToggle();
  initLogout();
  initTransactionFilters();
  initTransactionSearch();
  initNetworkSelector();
  initSettingsItems();
  switchTab('home');
}

// ─── WALLET ───────────────────────────────────
async function loadWalletSummary() {
  const { ok, data } = await api('/wallet/summary');
  if (!ok) return;

  state.balance = data.balance;

  // Home balance card
  const balEl = document.getElementById('balance-value');
  if (balEl) balEl.textContent = state.balanceVisible ? formatCurrency(data.balance) : '••••••';

  // Wallet tab big card
  const wbCard = document.querySelector('.wcard-balance h2');
  if (wbCard) wbCard.textContent = `PKR ${formatCurrency(data.balance)}`;
}

function updateBalanceDisplay() {
  const el = document.getElementById('balance-value');
  if (el) el.textContent = state.balanceVisible ? formatCurrency(state.balance) : '••••••';
  const wbCard = document.querySelector('.wcard-balance h2');
  if (wbCard) wbCard.textContent = `PKR ${formatCurrency(state.balance)}`;
}

function initBalanceToggle() {
  const btn     = document.getElementById('toggle-balance');
  const eyeIcon = document.getElementById('eye-icon');
  if (!btn) return;
  btn.addEventListener('click', () => {
    state.balanceVisible = !state.balanceVisible;
    eyeIcon.className    = state.balanceVisible ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
    updateBalanceDisplay();
  });
}

// ─── TRANSACTIONS ─────────────────────────────
function buildTxnItem(tx) {
  const sign = ['received','topup'].includes(tx.type) ? '+' : '-';
  const cls  = ['received','topup'].includes(tx.type) ? 'amount-in' : 'amount-out';
  return `
    <div class="txn-item">
      <div class="txn-icon ${tx.color}"><i class="fa-solid ${tx.icon}"></i></div>
      <div class="txn-info">
        <p class="txn-name">${tx.recipient_name || tx.type}</p>
        <span class="txn-date">${formatDate(tx.created_at)}${tx.note ? ' · ' + tx.note : ''}</span>
      </div>
      <span class="txn-amount ${cls}">${sign}PKR ${formatCurrency(tx.amount)}</span>
    </div>`;
}

async function loadRecentTransactions() {
  const { ok, data } = await api('/transactions/recent');
  const list = document.getElementById('recent-txn-list');
  if (!list) return;
  if (!ok || !data.transactions.length) {
    list.innerHTML = '<p class="empty-state">No transactions yet.</p>';
    return;
  }
  list.innerHTML = data.transactions.map(buildTxnItem).join('');
}

async function loadAllTransactions(filter = 'all', search = '') {
  const params  = new URLSearchParams({ filter, limit: 50, ...(search && { search }) });
  const { ok, data } = await api(`/transactions?${params}`);
  const list    = document.getElementById('full-txn-list');
  if (!list) return;
  if (!ok || !data.transactions.length) {
    list.innerHTML = '<p class="empty-state">No transactions found.</p>';
    return;
  }
  list.innerHTML = data.transactions.map(buildTxnItem).join('');
}

function initTransactionFilters() {
  document.querySelectorAll('.filter-chips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chips .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const search = document.getElementById('txn-search-input')?.value || '';
      loadAllTransactions(chip.dataset.filter, search);
    });
  });
}

function initTransactionSearch() {
  const input = document.getElementById('txn-search-input');
  if (!input) return;
  let debounce;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      const filter = document.querySelector('.filter-chips .chip.active')?.dataset.filter || 'all';
      loadAllTransactions(filter, input.value);
    }, 300);
  });
}

// ─── TAB NAVIGATION ───────────────────────────
function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-btn[data-tab]').forEach(b => b.classList.remove('active'));
  const tabEl  = document.getElementById('tab-' + tabName);
  const navBtn = document.querySelector(`.nav-btn[data-tab="${tabName}"]`);
  if (tabEl)  tabEl.classList.add('active');
  if (navBtn) navBtn.classList.add('active');
  state.activeTab = tabName;
  if (tabName === 'transactions') loadAllTransactions();
}

// ─── MODALS ───────────────────────────────────
function openModal(id) {
  closeAllModals();
  document.getElementById(id)?.classList.add('active');
  document.getElementById('modal-overlay')?.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeAllModals() {
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
  document.getElementById('modal-overlay')?.classList.remove('active');
  document.body.style.overflow = '';
}

// ─── SEND MONEY ───────────────────────────────
async function processSend() {
  const phone  = document.getElementById('send-phone').value.trim();
  const amount = document.getElementById('send-amount').value;
  const note   = document.getElementById('send-note').value.trim();

  if (!phone || !amount) { showToast('Fill in all required fields'); return; }

  setBtnLoading(null, true, 'send-modal');
  const { ok, data } = await api('/transactions/send', {
    method: 'POST',
    body:   JSON.stringify({ recipient_phone: normalizePhone(phone), amount: parseFloat(amount), note }),
  });
  setBtnLoading(null, false, 'send-modal');

  if (!ok) { showToast(data.message || 'Transfer failed'); return; }

  state.balance = data.balance;
  updateBalanceDisplay();
  loadRecentTransactions();
  document.getElementById('send-phone').value  = '';
  document.getElementById('send-amount').value = '';
  document.getElementById('send-note').value   = '';
  closeAllModals();
  showSuccess('Money Sent!', `PKR ${formatCurrency(amount)} sent successfully.`, `To: ${data.recipient.name}`);
}

function setAmount(val) { document.getElementById('send-amount').value = val; }

// ─── WITHDRAW ─────────────────────────────────
async function processWithdraw() {
  const amount = document.getElementById('withdraw-amount').value;
  const cnic   = document.getElementById('withdraw-cnic').value.trim();

  if (!amount || !cnic) { showToast('Fill in all fields'); return; }

  const { ok, data } = await api('/wallet/withdraw', {
    method: 'POST',
    body:   JSON.stringify({ amount: parseFloat(amount), cnic }),
  });

  if (!ok) { showToast(data.message || 'Withdrawal failed'); return; }

  state.balance = data.balance;
  updateBalanceDisplay();
  loadRecentTransactions();
  document.getElementById('withdraw-amount').value = '';
  document.getElementById('withdraw-cnic').value   = '';
  closeAllModals();
  showSuccess(
    'Withdrawal Code Generated!',
    `Your code: <strong style="font-size:1.4rem;letter-spacing:4px">${data.withdraw_code}</strong>`,
    `Visit nearest SwiftPay agent with your CNIC.`
  );
}

// ─── MOBILE RECHARGE ──────────────────────────
function setRecharge(val) {
  document.getElementById('recharge-amount').value = val;
  document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
  if (event?.target) event.target.classList.add('active');
}

async function processRecharge() {
  const phone  = document.getElementById('recharge-phone').value.trim();
  const amount = document.getElementById('recharge-amount').value;

  if (!phone || !amount) { showToast('Fill in all fields'); return; }

  const { ok, data } = await api('/services/recharge', {
    method: 'POST',
    body:   JSON.stringify({ network: state.selectedNetwork, phone: normalizePhone(phone), amount: parseFloat(amount) }),
  });

  if (!ok) { showToast(data.message || 'Recharge failed'); return; }

  state.balance = data.balance;
  updateBalanceDisplay();
  loadRecentTransactions();
  document.getElementById('recharge-phone').value  = '';
  document.getElementById('recharge-amount').value = '';
  closeAllModals();
  showSuccess('Recharge Successful! 📱', data.message, `Number: ${phone}`);
}

function initNetworkSelector() {
  document.querySelectorAll('.network-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.network-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedNetwork = btn.dataset.network;
    });
  });
}

// ─── RECEIVE ──────────────────────────────────
function copyNumber() {
  const num = document.getElementById('receive-phone-num').textContent;
  navigator.clipboard.writeText(num)
    .then(() => showToast('Number copied!'))
    .catch(() => showToast(`Your number: ${num}`));
}

function shareQR() {
  const num = document.getElementById('receive-phone-num').textContent;
  if (navigator.share) {
    navigator.share({ title: 'Pay me on SwiftPay', text: `My SwiftPay number: ${num}` });
  } else {
    showToast('Share not supported on this browser');
  }
}

// ─── NOTIFICATIONS ────────────────────────────
async function loadNotifications() {
  const { ok, data } = await api('/profile/notifications');
  if (!ok) return;

  const badge  = document.querySelector('#notify-btn .badge');
  if (badge) badge.textContent = data.unread > 0 ? data.unread : '';

  const list = document.querySelector('.notify-list');
  if (!list || !data.notifications.length) return;

  list.innerHTML = data.notifications.map(n => `
    <div class="notify-item ${n.is_read ? '' : 'unread'}">
      <div class="notify-icon ${n.color}"><i class="fa-solid ${n.icon}"></i></div>
      <div class="notify-body">
        <p class="notify-title">${n.title}</p>
        <p class="notify-text">${n.body}</p>
        <span class="notify-time">${formatDate(n.created_at)}</span>
      </div>
    </div>
  `).join('');
}

function initNotifyBtn() {
  document.getElementById('notify-btn')?.addEventListener('click', async () => {
    openModal('notify-modal');
    await api('/profile/notifications/read', { method: 'PUT' });
    const badge = document.querySelector('#notify-btn .badge');
    if (badge) badge.textContent = '';
  });
}

// ─── QR ───────────────────────────────────────
function initQRBtn() {
  document.getElementById('qr-btn')?.addEventListener('click', () => openModal('qr-modal'));
}

function generateQRGrid() {
  const grid = document.getElementById('qr-grid');
  if (!grid) return;
  const size = 10;
  grid.style.cssText = `display:grid;grid-template-columns:repeat(${size},1fr);gap:2px;padding:4px;`;
  let html = '';
  for (let i = 0; i < size * size; i++) {
    const row = Math.floor(i / size), col = i % size;
    const corner = (row < 3 && col < 3) || (row < 3 && col >= size-3) || (row >= size-3 && col < 3);
    const filled = corner || Math.random() > 0.5;
    html += `<div style="width:100%;padding-bottom:100%;background:${filled?'#1a1a2e':'transparent'};border-radius:1px;"></div>`;
  }
  grid.innerHTML = html;
}

// ─── SUCCESS MODAL ────────────────────────────
function showSuccess(title, msg, detail = '') {
  document.getElementById('success-title').textContent = title;
  document.getElementById('success-msg').innerHTML     = msg;
  document.getElementById('success-detail').innerHTML  = detail;
  openModal('success-modal');
}

// ─── TOAST ────────────────────────────────────
let toastTimeout;
function showToast(msg, duration = 3000) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), duration);
}

// ─── BIOMETRIC TOGGLE ─────────────────────────
function initBiometricToggle() {
  document.getElementById('biometric-toggle')?.addEventListener('click', function () {
    this.classList.toggle('active');
    showToast(this.classList.contains('active') ? 'Biometric login enabled' : 'Biometric login disabled');
  });
}

// ─── SETTINGS ─────────────────────────────────
function initSettingsItems() {
  document.querySelectorAll('.setting-item').forEach(item => {
    const label = item.querySelector('span')?.textContent;
    if (!item.querySelector('.toggle-switch')) {
      item.addEventListener('click', () => showToast(`${label} — coming soon`));
    }
  });
}

// ─── LOGOUT ───────────────────────────────────
function initLogout() {
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    if (!confirm('Are you sure you want to logout?')) return;
    state.token = null;
    state.user  = null;
    localStorage.removeItem('swiftpay_token');
    localStorage.removeItem('swiftpay_user');
    showScreen('auth-screen');
    document.getElementById('login-phone').value = '';
    document.getElementById('login-pass').value  = '';
    showToast('Logged out successfully');
  });
}

// ─── BUTTON LOADING STATE ────────────────────
function setBtnLoading(btnId, loading, modalId = null) {
  let btn = btnId ? document.getElementById(btnId) : null;
  if (!btn && modalId) btn = document.querySelector(`#${modalId} .btn-primary`);
  if (!btn) return;
  btn.disabled   = loading;
  btn.style.opacity = loading ? '0.7' : '';
}

// ─── KEYBOARD ────────────────────────────────
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAllModals(); });

// ─── INIT ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadSession();
  initSplash();
  initOnboarding();
  initAuth();
  initOTP();
});
