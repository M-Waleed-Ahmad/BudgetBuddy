const mongoose = require('mongoose');

// A spending limit for one category within a family plan.
const familyBudgetSchema = new mongoose.Schema({
  plan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FamilyPlan', required: true },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  limit_amount: { type: Number, required: true, min: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

familyBudgetSchema.index({ plan_id: 1, category_id: 1 }, { unique: true });
familyBudgetSchema.pre('save', function setUpdatedAt(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('FamilyBudget', familyBudgetSchema);
