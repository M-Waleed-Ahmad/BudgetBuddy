const Notification = require('../models/Notification');

/**
 * Creates an in-app notification. Failures are logged and swallowed so a notification
 * problem never breaks the request that triggered it.
 *
 * @param {Object} options
 * @param {String} options.recipient - Recipient user id
 * @param {String} options.type - One of the Notification `type` enum values
 * @param {String} options.message - Human-readable text
 * @param {String} [options.actor] - User id that triggered the notification
 * @param {{ id: String, model_type: String }} [options.related] - Related entity
 * @param {String} [options.link] - Frontend route to open, e.g. "/budget-management"
 */
async function notify({ recipient, type, message, actor = null, related = null, link = null }) {
  if (!recipient || !type || !message) return;
  try {
    await Notification.create({
      recipient_user_id: recipient,
      type,
      message,
      actor_user_id: actor,
      related_entity: related,
      link,
    });
  } catch (error) {
    console.error('Failed to create notification:', error.message);
  }
}

/** Sends the same notification to several users, skipping the actor and duplicates. */
async function notifyMany(recipients, options) {
  const actor = options.actor ? String(options.actor) : null;
  const unique = [...new Set(recipients.map(String))].filter((id) => id !== actor);
  await Promise.all(unique.map((recipient) => notify({ ...options, recipient })));
}

module.exports = { notify, notifyMany };
