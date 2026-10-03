const mongoose = require('mongoose');

const familyExpenseSchema = new mongoose.Schema({
  plan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FamilyPlan', required: true },
  added_by_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  amount: { type: Number, required: true, min: 0.01 },
  description: { type: String, required: true, trim: true, maxlength: 200 },
  notes: { type: String, trim: true, maxlength: 1000, default: '' },
  expense_date: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  approved_by_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  created_at: { type: Date, default: Date.now },
});

familyExpenseSchema.index({ plan_id: 1, expense_date: -1 });

module.exports = mongoose.model('FamilyExpense', familyExpenseSchema);
