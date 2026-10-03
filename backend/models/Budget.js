const mongoose = require('mongoose');

// A spending limit for one category in one month.
const budgetSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  month_year: { type: String, required: true, match: /^\d{4}-\d{2}$/ }, // YYYY-MM
  limit_amount: { type: Number, required: true, min: 0 },
  description: { type: String, trim: true, maxlength: 200 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

budgetSchema.index({ user_id: 1, month_year: 1 });
budgetSchema.pre('save', function setUpdatedAt(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Budget', budgetSchema);
