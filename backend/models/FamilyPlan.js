// models/FamilyPlan.js
const mongoose = require('mongoose');

const familyPlanSchema = new mongoose.Schema({
  plan_name: { type: String, required: true, trim: true },
  owner_user_id: { // Who created/owns the plan
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Optional: Overall budget target and timeframe for the plan itself
  total_budget_amount: {
    type: Number,
    min: 0,
    default: null // Use null or 0 if an overall target isn't always set
  },
  start_date: {
    type: Date,
    default: null
  },
  end_date: {
    type: Date,
    default: null
  },
  currency: { // Plan's default currency
    type: String,
    default: 'USD', // Or fetch from owner's preference on creation
    uppercase: true,
    trim: true,
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Middleware to update the 'updated_at' field on save/update
familyPlanSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});
familyPlanSchema.pre('findOneAndUpdate', function(next) {
    this.set({ updated_at: Date.now() });
    next();
});


module.exports = mongoose.model("FamilyPlan", familyPlanSchema);