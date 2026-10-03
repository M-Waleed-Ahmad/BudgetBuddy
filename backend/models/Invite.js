const mongoose = require('mongoose');

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const inviteSchema = new mongoose.Schema({
  plan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FamilyPlan', required: true, index: true },
  invitee_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  inviter_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  invitee_email: { type: String, required: true, trim: true, lowercase: true },
  role_assigned: { type: String, enum: ['admin', 'editor', 'viewer'], required: true, default: 'viewer' },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired'],
    required: true,
    default: 'pending',
  },
  created_at: { type: Date, default: Date.now },
  expires_at: {
    type: Date,
    default: () => new Date(Date.now() + INVITE_TTL_MS),
    // MongoDB purges invites 7 days after they expire.
    index: { expires: '7d' },
  },
  responded_at: { type: Date, default: null },
});

// Only one pending invite per plan and email.
inviteSchema.index(
  { plan_id: 1, invitee_email: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);

inviteSchema.methods.isExpired = function isExpired() {
  return Boolean(this.expires_at) && this.expires_at.getTime() <= Date.now();
};

module.exports = mongoose.model('Invite', inviteSchema);
