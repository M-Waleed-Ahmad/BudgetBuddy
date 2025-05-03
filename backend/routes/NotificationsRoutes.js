const express = require('express');

const router = express.Router();

const NotificationsController = require('../controllers/NotificationsController');
const verifyToken = require('../middleware/authMiddleware');

// Route to get all notifications for a user
router.get('/', verifyToken, NotificationsController.getAllNotifications);

// Route to get a single notification by ID
router.get('/:id', verifyToken, NotificationsController.getNotificationById);

// Route to create a new notification
router.post('/', verifyToken, NotificationsController.createNotification);

// Route to mark a notification as read
router.put('/:id', verifyToken, NotificationsController.markAsRead);

// Route to delete a notification by ID
router.delete('/:id', verifyToken, NotificationsController.deleteNotification);

module.exports = router;
