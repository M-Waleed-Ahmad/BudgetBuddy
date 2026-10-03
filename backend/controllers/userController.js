const bcrypt = require('bcryptjs');
const User = require('../models/User');
const v = require('../utils/validation');
const { badRequest, notFound } = require('../utils/httpError');
const { hashPassword, signToken } = require('./authController');

const toProfile = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  recovery_email: user.recovery_email || '',
  profileImage: user.profileImage || null,
  currency_preference: user.currency_preference,
  created_at: user.created_at,
});

// GET /api/user/profile
async function getProfile(req, res) {
  const user = await User.findById(req.user.userId);
  if (!user) throw notFound('User not found.');
  res.json(toProfile(user));
}

// PUT /api/user/profile
async function updateProfile(req, res) {
  const user = await User.findById(req.user.userId).select('+password_hash');
  if (!user) throw notFound('User not found.');

  const { body } = req;
  if (body.name !== undefined) user.name = v.string(body.name, 'name', { required: true, max: 100 });
  if (body.recovery_email !== undefined) {
    user.recovery_email = v.email(body.recovery_email, 'recovery_email', { required: false });
  }
  if (body.currency_preference !== undefined) {
    user.currency_preference = v.currency(body.currency_preference, 'currency_preference') || user.currency_preference;
  }
  if (body.profileImage !== undefined) {
    const image = v.string(body.profileImage, 'profileImage', { max: 500 });
    if (image && !/^https:\/\//i.test(image)) throw badRequest('profileImage must be an https URL.');
    user.profileImage = image;
  }

  let passwordChanged = false;
  if (body.newPassword !== undefined) {
    const newPassword = v.password(body.newPassword, 'newPassword');
    const currentOk =
      typeof body.currentPassword === 'string' && (await bcrypt.compare(body.currentPassword, user.password_hash));
    if (!currentOk) throw badRequest('Your current password is incorrect.', { currentPassword: 'Incorrect password' });
    user.password_hash = await hashPassword(newPassword);
    user.token_version = (user.token_version || 0) + 1; // signs out every existing session
    passwordChanged = true;
  }

  await user.save();

  // Changing the password invalidates every existing token, so hand back a fresh one.
  res.json(passwordChanged ? { ...toProfile(user), token: signToken(user) } : toProfile(user));
}

module.exports = { getProfile, updateProfile };
