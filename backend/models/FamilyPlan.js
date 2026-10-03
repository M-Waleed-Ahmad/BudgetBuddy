const mongoose = require('mongoose');
const { CURRENCIES } = require('../utils/validation');

const familyPlanSchema = new mongoose.Schema({
  plan_name: { type: String, required: true, trim: true, maxlength: 100 },
  owner_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  total_budget_amount: { type: Number, min: 0, default: null },
  start_date: { type: Date, default: null },
  end_date: { type: Date, default: null },
  currency: { type: String, enum: CURRENCIES, default: 'USD' },
  // When true, expenses added by non-admin members start as "pending" until an admin approves them.
  require_approval: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

familyPlanSchema.pre('save', function setUpdatedAt(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('FamilyPlan', familyPlanSchema);
