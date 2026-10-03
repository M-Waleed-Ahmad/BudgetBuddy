const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const v = require('../utils/validation');
const { badRequest, conflict, unauthorized } = require('../utils/httpError');
const { sendMail, isMailConfigured } = require('../utils/mailer');
const { notify } = require('../utils/notify');

const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
// Compared against when the email is unknown, so response times don't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (str) => String(str).replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const signToken = (user) =>
  jwt.sign({ userId: String(user._id), tv: user.token_version || 0 }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

const toSessionUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  currency_preference: user.currency_preference,
  profileImage: user.profileImage || null,
});

const hashPassword = (password) => bcrypt.hash(password, BCRYPT_ROUNDS);

// POST /api/auth/signup
async function signup(req, res) {
  const name = v.string(req.body.name, 'name', { required: true, max: 100 });
  const email = v.email(req.body.email);
  const password = v.password(req.body.password);
  const recoveryEmail = v.email(req.body.recovery_email, 'recovery_email', { required: false });
  const currency = v.currency(req.body.currency_preference, 'currency_preference');

  if (await User.exists({ email })) throw conflict('An account with this email already exists.');

  const user = await User.create({
    name,
    email,
    recovery_email: recoveryEmail,
    currency_preference: currency,
    password_hash: await hashPassword(password),
  });

  await notify({
    recipient: user._id,
    type: 'generic_message',
    message: `Welcome to BudgetBuddy, ${user.name}! Start by setting a monthly budget and adding your categories.`,
    link: '/budget-management',
  });

  res.status(201).json({ message: 'Account created successfully.', token: signToken(user), user: toSessionUser(user) });
}

// POST /api/auth/login
async function login(req, res) {
  const email = v.email(req.body.email);
  if (typeof req.body.password !== 'string' || !req.body.password) throw badRequest('Password is required.');

  const user = await User.findOne({ email }).select('+password_hash');
  const matches = await bcrypt.compare(req.body.password, user ? user.password_hash : DUMMY_HASH);
  if (!user || !matches) throw unauthorized('Invalid email or password.');

  res.json({ message: 'Login successful.', token: signToken(user), user: toSessionUser(user) });
}

// POST /api/auth/logout — tokens are stateless; the client discards its copy.
async function logout(req, res) {
  res.json({ message: 'Logged out successfully.' });
}

// POST /api/auth/forgot-password
async function forgotPassword(req, res) {
  const email = v.email(req.body.email);
  const response = { message: 'If an account exists for that email, a password reset link has been sent.' };

  const user = await User.findOne({ email });
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    user.reset_password_token_hash = hashToken(token);
    user.reset_password_expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await user.save();

    const resetUrl = `${config.clientUrl}/reset-password?token=${token}`;
    const sent = await sendMail({
      to: [user.email, user.recovery_email].filter(Boolean).join(', '),
      subject: 'Reset your BudgetBuddy password',
      text: `Hi ${user.name},\n\nUse the link below to choose a new password. It expires in 30 minutes.\n\n${resetUrl}\n\nIf you didn't request this, you can ignore this email.`,
      html: `<p>Hi ${escapeHtml(user.name)},</p><p>Use the link below to choose a new password. It expires in 30 minutes.</p><p><a href="${resetUrl}">Reset my password</a></p><p>If you didn't request this, you can ignore this email.</p>`,
    });

    if (!sent && !config.isProduction) {
      // Local development without SMTP: surface the link so the flow can still be tested.
      if (!config.isTest) console.info(`Password reset link for ${user.email}: ${resetUrl}`);
      if (!isMailConfigured) response.devResetUrl = resetUrl;
    }
  }

  res.json(response);
}

// POST /api/auth/reset-password
async function resetPassword(req, res) {
  const token = v.string(req.body.token, 'token', { required: true, max: 200 });
  const password = v.password(req.body.password);

  const user = await User.findOne({
    reset_password_token_hash: hashToken(token),
    reset_password_expires: { $gt: new Date() },
  });
  if (!user) throw badRequest('This reset link is invalid or has expired. Please request a new one.');

  user.password_hash = await hashPassword(password);
  user.token_version = (user.token_version || 0) + 1; // signs out every existing session
  user.reset_password_token_hash = undefined;
  user.reset_password_expires = undefined;
  await user.save();

  res.json({ message: 'Your password has been reset. You can now log in.' });
}

module.exports = { signup, login, logout, forgotPassword, resetPassword, signToken, hashPassword, toSessionUser };
