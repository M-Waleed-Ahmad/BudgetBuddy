const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  amount: Number,
  description: String,
  expense_date: Date,
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Expense", expenseSchema);
