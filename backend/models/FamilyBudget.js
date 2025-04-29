// models/FamilyBudget.js
const mongoose = require('mongoose');

const familyBudgetSchema = new mongoose.Schema({
  plan_id: { // Link to the specific family plan
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyPlan',
    required: true,
    index: true,
  },
  category_id: { // Link to the category this limit applies to
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true,
  },
  month_year: { // The month/year this limit is for (e.g., '2024-08')
    type: String,
    required: true,
    match: /^\d{4}-\d{2}$/, // Validate YYYY-MM format
    index: true,
  },
  limit_amount: { // The budget limit amount for this category/plan/month
    type: Number,
    required: true,
    min: 0, // Limit cannot be negative
  },
  description: { // Optional description for the limit
    type: String,
    trim: true,
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Ensure uniqueness: One limit per category per plan per month
familyBudgetSchema.index({ plan_id: 1, category_id: 1, month_year: 1 }, { unique: true });

// Middleware to update the 'updated_at' field
familyBudgetSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});
familyBudgetSchema.pre('findOneAndUpdate', function(next) {
    this.set({ updated_at: Date.now() });
    next();
});

module.exports = mongoose.model("FamilyBudget", familyBudgetSchema);