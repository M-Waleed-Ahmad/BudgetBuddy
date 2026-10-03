const mongoose = require('mongoose');

const familyMemberSchema = new mongoose.Schema({
  plan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FamilyPlan', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  role: { type: String, enum: ['admin', 'editor', 'viewer'], default: 'viewer' },
  joined_at: { type: Date, default: Date.now },
});

familyMemberSchema.index({ plan_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('FamilyMember', familyMemberSchema);
