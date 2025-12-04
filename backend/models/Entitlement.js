const mongoose = require('mongoose');

const entitlementSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  feature: { type: String, required: true }, // e.g., 'family_budgeting'
  active: { type: Boolean, default: true },
  source: { type: String, default: 'stripe' },
  metadata: { type: Object },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

entitlementSchema.index({ user_id: 1, feature: 1 }, { unique: true });
entitlementSchema.pre('save', function(next) { this.updated_at = new Date(); next(); });

module.exports = mongoose.model('Entitlement', entitlementSchema);
