const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  recovery_email: String,
  password_hash: String,
  currency_preference: { type: String, default: "USD" },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
