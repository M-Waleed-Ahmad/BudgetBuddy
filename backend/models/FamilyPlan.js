const mongoose = require('mongoose');

const familyPlanSchema = new mongoose.Schema({
  plan_name: String,
  expense_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense', default: null },
  budget_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Budget', default: null },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("FamilyPlan", familyPlanSchema);
