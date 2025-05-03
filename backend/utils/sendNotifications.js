const Notification = require('../models/Notifications');

/**
 * Generic function to create a notification
 * @param {Object} options
 * @param {String} options.recipient_user_id - The recipient's user ID
 * @param {String} options.type - Notification type (must match schema enum)
 * @param {String} options.message - Notification message text
 * @param {String} [options.actor_user_id] - (Optional) User ID who triggered the notification
 * @param {Object} [options.related_entity] - (Optional) Related entity reference { id, model_type }
 * @param {String} [options.link] - (Optional) Frontend link path for the notification
 */
const sendNotification = async ({
  recipient_user_id,
  type,
  message,
  actor_user_id = null,
  related_entity = null,
  link = null,
}) => {
  if (!recipient_user_id || !type || !message) {
    console.warn('⚠️ Missing required fields for notification.');
    return;
  }

  try {
    const notification = new Notification({
      recipient_user_id,
      type,
      message,
      actor_user_id,
      related_entity,
      link,
    });

    await notification.save();
    console.log(`✅ Notification sent to user ${recipient_user_id}`);
  } catch (error) {
    console.error('❌ Error creating notification:', error);
  }
};

module.exports = sendNotification;
