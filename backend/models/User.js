const mongoose = require('mongoose');
const { CURRENCIES } = require('../utils/validation');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  recovery_email: { type: String, trim: true, lowercase: true },
  password_hash: { type: String, required: true, select: false },
  // Embedded in every JWT; incrementing it (on password change/reset) revokes all existing sessions.
  token_version: { type: Number, default: 0 },
  reset_password_token_hash: { type: String, select: false },
  reset_password_expires: { type: Date, select: false },
  profileImage: { type: String, trim: true },
  currency_preference: { type: String, enum: CURRENCIES, default: 'USD' },
  created_at: { type: Date, default: Date.now },
});

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password_hash;
    delete ret.token_version;
    delete ret.reset_password_token_hash;
    delete ret.reset_password_expires;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
