const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stripe_customer_id: { type: String, index: true },
  stripe_subscription_id: { type: String, index: true },
  status: { type: String, enum: ['active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired'], default: 'active' },
  price_id: { type: String },
  current_period_end: { type: Date },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

subscriptionSchema.pre('save', function(next) { this.updated_at = new Date(); next(); });

module.exports = mongoose.model('Subscription', subscriptionSchema);
