// models/Invite.js
const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema({
  // --- Core Relationship ---
  plan_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyPlan', // Link to the specific plan being invited to
    required: true,
    index: true, // Index for faster lookups by plan
  },
  invitee_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',       // Link to the User being invited
    required: true,
    index: true, // Index for faster lookups by invitee
  },
  inviter_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',       // Link to the User who sent the invitation
    required: true,
  },

  // --- Invitation Details ---
  invitee_email: {
    type: String,      // Store the email the invite was sent to (useful if invitee needs to sign up)
    required: true,
    trim: true,
    lowercase: true,
  },
  role_assigned: {
    type: String,
    enum: ['admin', 'editor', 'viewer'], // Role the invitee will get upon accepting
    required: true,
    default: 'viewer', // Default role if not specified
  },

  // --- Status and Tracking ---
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired'], // Track the invitation lifecycle
    required: true,
    default: 'pending',
    index: true, // Index for finding pending invites efficiently
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  expires_at: {
    type: Date,
    // Optional: Set an expiry date for the invitation
    // default: () => new Date(+new Date() + 7*24*60*60*1000) // Example: Expires in 7 days
    index: { expires: '7d' } // Alternative: MongoDB TTL index to auto-delete expired invites after 7 days (if status is still pending) - configure cleanup strategy carefully.
  },
  responded_at: {
    type: Date, // Timestamp when the user accepted or rejected
    default: null,
  }
});

// --- Compound Index ---
// Ensure a user cannot be invited to the same plan multiple times while pending
inviteSchema.index({ plan_id: 1, invitee_email: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'pending' } });
// Or by invitee_user_id if they must be registered first:
// inviteSchema.index({ plan_id: 1, invitee_user_id: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'pending' } });


// --- Methods or Statics (Optional) ---
// You could add methods here, e.g., to check if an invite is expired

module.exports = mongoose.model("Invite", inviteSchema);