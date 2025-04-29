// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // --- Recipient ---
  recipient_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, // Essential for fetching notifications for a specific user
  },

  // --- Notification Content ---
  type: {
    type: String,
    required: true,
    enum: [
      'invite_received',        // When a user receives a plan invitation
      'invite_accepted',        // When an invitee accepts a plan invitation
      'invite_rejected',        // When an invitee rejects a plan invitation
      'plan_joined',            // Confirmation to the user who accepted the invite
      'member_joined_plan',     // Notification to existing plan members (admins?) when someone joins
      'expense_added',          // When a new expense is added (potentially only notify admins/editors or approvers)
      'expense_needs_approval', // When an expense requires approval (based on User.expenseApproval)
      'expense_approved',       // When an expense is approved
      'expense_rejected',       // When an expense is rejected
      'budget_limit_approaching',// Notification when spending nears a budget limit
      'budget_limit_exceeded',  // Notification when spending exceeds a budget limit
      'role_changed',           // Notification when a user's role in a plan is changed
      'generic_message',        // For general system announcements or custom messages
      // Add other specific types as needed
    ],
    index: true,
  },
  message: {
    type: String, // The human-readable notification text
    required: true,
  },
  is_read: {
    type: Boolean,
    default: false,
    index: true, // Useful for filtering/counting unread notifications
  },

  // --- Context / Links ---
  // Optional fields to link the notification to the relevant entity
  related_entity: {
     id: { type: mongoose.Schema.Types.ObjectId },
     model_type: { type: String }, // e.g., 'Invite', 'Expense', 'FamilyPlan', 'User'
  },
  // Optional: A specific URL path the notification should link to in the frontend
  link: {
    type: String,
    default: null,
  },

  // --- Actor (Optional) ---
  // The user who triggered the event causing the notification (e.g., who sent the invite, who added the expense)
  actor_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  // --- Timestamps ---
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Optional: TTL index to automatically delete old, read notifications after a certain period (e.g., 90 days)
// Adjust the time ('7776000s' is 90 days) and condition (is_read: true) as needed.
// Be cautious with TTL indexes in production, ensure they fit your requirements.
// notificationSchema.index({ created_at: 1 }, { expireAfterSeconds: 7776000, partialFilterExpression: { is_read: true } });

module.exports = mongoose.model("Notification", notificationSchema);