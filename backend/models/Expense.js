const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  amount: { type: Number, required: true, min: 0.01 },
  description: { type: String, trim: true, maxlength: 200, default: '' },
  notes: { type: String, trim: true, maxlength: 1000, default: '' },
  expense_date: { type: Date, required: true },
  created_at: { type: Date, default: Date.now },
});

expenseSchema.index({ user_id: 1, expense_date: -1 });

module.exports = mongoose.model('Expense', expenseSchema);
