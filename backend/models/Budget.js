const mongoose = require('mongoose');
const MonthlyBudget = require('./MonthlyBudget');

const budgetSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  month_year: String, // format: MM-YYYY
  limit_amount: Number,
  MonthlyBudget: { type: mongoose.Schema.Types.ObjectId, ref: 'MonthlyBudget' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  description: String,
});

module.exports = mongoose.model("Budget", budgetSchema);
