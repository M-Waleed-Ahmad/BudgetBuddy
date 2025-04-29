// models/FamilyExpense.js
const mongoose = require('mongoose');

const familyExpenseSchema = new mongoose.Schema({
  plan_id: { // Link to the specific family plan
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyPlan',
    required: true,
    index: true,
  },
  added_by_user_id: { // Which user added this expense
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  category_id: { // Link to the category
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  amount: { // The expense amount
    type: Number,
    required: true,
    min: 0.01 // Amount must be positive
  },
  description: { // Description of the expense
    type: String,
    required: true,
    trim: true,
  },
  notes: { // Optional additional notes
    type: String,
    trim: true,
  },
  expense_date: { // When the expense occurred
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  },
  // Optional: Approval workflow for family expenses
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved', // Or 'pending' if approval is usually needed
    index: true,
  },
  approved_by_user_id: { // Who approved/rejected it (if applicable)
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // Note: Decide if you need a 'type' field ('family' vs 'personal within plan')
  // If ALL expenses in this collection are considered 'family', no type field needed.
  // type: { type: String, enum: ['family', 'personal'], default: 'family' },

  created_at: { type: Date, default: Date.now }
  // No 'updated_at' needed unless expenses themselves are frequently edited beyond correction
});

module.exports = mongoose.model("FamilyExpense", familyExpenseSchema);