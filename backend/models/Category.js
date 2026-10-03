const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 50 },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
});

module.exports = mongoose.model('Category', categorySchema);
