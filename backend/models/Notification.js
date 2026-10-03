const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    required: true,
    enum: [
      'invite_received',
      'invite_accepted',
      'invite_rejected',
      'member_joined_plan',
      'member_removed',
      'expense_added',
      'expense_needs_approval',
      'expense_approved',
      'expense_rejected',
      'budget_limit_approaching',
      'budget_limit_exceeded',
      'role_changed',
      'generic_message',
    ],
  },
  message: { type: String, required: true },
  is_read: { type: Boolean, default: false },
  related_entity: {
    id: { type: mongoose.Schema.Types.ObjectId },
    model_type: { type: String },
  },
  // Frontend route to open when the notification is clicked.
  link: { type: String, default: null },
  actor_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  created_at: { type: Date, default: Date.now },
});

notificationSchema.index({ recipient_user_id: 1, created_at: -1 });
notificationSchema.index({ recipient_user_id: 1, is_read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
