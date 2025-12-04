const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  amount: Number,
  description: String,
  notes: String,
  expense_date: Date,
  type: { type: String, enum: ['debit', 'credit'], default: 'debit' },
  account: { type: String },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Expense", expenseSchema);
