const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  recovery_email: String,
  password_hash: String,
  profileImage: String,  // new field
  currency_preference: { type: String, default: "USD" },
  expenseApproval: { type: Boolean, default: false }, // new field
  created_at: { type: Date, default: Date.now },
  language: { type: String, default: "en" }, // new field
  darkMode: { type: Boolean, default: false }, // new field
  // Premium/subscription flags (set after Stripe confirmation/webhook)
  isPremium: { type: Boolean, default: false },
  premiumPlan: { type: String, default: null },
  stripeCustomerId: { type: String, default: null },
  stripeSubscriptionId: { type: String, default: null },
  premiumUntil: { type: Date, default: null },
});

module.exports = mongoose.model("User", userSchema);
