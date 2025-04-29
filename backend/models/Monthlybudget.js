// models/MonthlyBudget.js
const mongoose = require('mongoose');

const monthlyBudgetSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  month_year: { type: String, required: true, match: /^\d{4}-\d{2}$/, index: true }, // 'YYYY-MM'
  total_budget_amount: { type: Number, required: true, min: 0, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
});
monthlyBudgetSchema.index({ user_id: 1, month_year: 1 }, { unique: true });
monthlyBudgetSchema.pre('save', function(next) { this.updated_at = Date.now(); next(); });
// Add pre-findOneAndUpdate if needed
module.exports = mongoose.model("MonthlyBudget", monthlyBudgetSchema);