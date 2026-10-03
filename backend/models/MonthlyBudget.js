const mongoose = require('mongoose');

// The overall spending target for a budgeting period (usually a calendar month).
const monthlyBudgetSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  month_year: { type: String, required: true, match: /^\d{4}-\d{2}$/ }, // YYYY-MM, derived from start_date
  total_budget_amount: { type: Number, required: true, min: 0, default: 0 },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

monthlyBudgetSchema.index({ user_id: 1, month_year: 1 }, { unique: true });
monthlyBudgetSchema.pre('save', function setUpdatedAt(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('MonthlyBudget', monthlyBudgetSchema);
