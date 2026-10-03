const Notification = require('../models/Notification');
const v = require('../utils/validation');
const { notFound } = require('../utils/httpError');

const MAX_NOTIFICATIONS = 100;

const toNotification = (notification) => ({
  _id: notification._id,
  type: notification.type,
  message: notification.message,
  is_read: notification.is_read,
  link: notification.link || null,
  created_at: notification.created_at,
  actor: notification.actor_user_id?._id
    ? { _id: notification.actor_user_id._id, name: notification.actor_user_id.name }
    : null,
});

async function findOwnNotification(req) {
  const id = v.assertObjectId(req.params.id, 'notification id');
  const notification = await Notification.findOne({ _id: id, recipient_user_id: req.user.userId });
  if (!notification) throw notFound('Notification not found.');
  return notification;
}

// GET /api/notifications
async function listNotifications(req, res) {
  const notifications = await Notification.find({ recipient_user_id: req.user.userId })
    .populate('actor_user_id', 'name')
    .sort({ created_at: -1 })
    .limit(MAX_NOTIFICATIONS);
  res.json(notifications.map(toNotification));
}

// GET /api/notifications/unread-count
async function getUnreadCount(req, res) {
  const count = await Notification.countDocuments({ recipient_user_id: req.user.userId, is_read: false });
  res.json({ count });
}

// PUT /api/notifications/read-all
async function markAllAsRead(req, res) {
  await Notification.updateMany({ recipient_user_id: req.user.userId, is_read: false }, { $set: { is_read: true } });
  res.json({ message: 'All notifications marked as read.' });
}

// PUT /api/notifications/:id/read
async function markAsRead(req, res) {
  const notification = await findOwnNotification(req);
  if (!notification.is_read) {
    notification.is_read = true;
    await notification.save();
  }
  await notification.populate('actor_user_id', 'name');
  res.json(toNotification(notification));
}

// DELETE /api/notifications/:id
async function deleteNotification(req, res) {
  const notification = await findOwnNotification(req);
  await notification.deleteOne();
  res.json({ message: 'Notification deleted.' });
}

module.exports = { listNotifications, getUnreadCount, markAllAsRead, markAsRead, deleteNotification };
