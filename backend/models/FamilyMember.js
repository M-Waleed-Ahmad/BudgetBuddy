const mongoose = require('mongoose');

const familyMemberSchema = new mongoose.Schema({
  plan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FamilyPlan' },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role: {
    type: String,
    enum: ['admin', 'editor', 'viewer'],
    default: 'viewer'
  }
});

module.exports = mongoose.model("FamilyMember", familyMemberSchema);
