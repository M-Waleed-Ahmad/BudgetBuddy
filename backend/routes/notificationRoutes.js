const express = require('express');
const notifications = require('../controllers/notificationController');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.get('/', notifications.listNotifications);
router.get('/unread-count', notifications.getUnreadCount);
router.put('/read-all', notifications.markAllAsRead);
router.put('/:id/read', notifications.markAsRead);
router.delete('/:id', notifications.deleteNotification);

module.exports = router;
