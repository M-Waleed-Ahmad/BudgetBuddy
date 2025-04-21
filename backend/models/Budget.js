const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  month_year: String, // format: MM-YYYY
  limit_amount: Number
});

module.exports = mongoose.model("Budget", budgetSchema);
