const Notification = require('../models/Notifications');

// Controller for handling notifications
const NotificationsController = {
    // Get all notifications for the logged-in user
    async getAllNotifications(req, res) {
        try {
            const userId = req.user.userId;
            const notifications = await Notification.find({ recipient_user_id: userId }).sort({ created_at: -1 });
            res.status(200).json(notifications);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch notifications' });
        }
    },

    // Get a single notification by ID
    async getNotificationById(req, res) {
        try {
            const { id } = req.params;
            const notification = await Notification.findById(id);
            if (!notification) {
                return res.status(404).json({ error: 'Notification not found' });
            }
            res.status(200).json(notification);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch notification' });
        }
    },

    // Create a new notification
    async createNotification(req, res) {
        try {
            const { title, message, userId } = req.body;
            const newNotification = new Notification({ title, message, userId });
            await newNotification.save();
            res.status(201).json(newNotification);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create notification' });
        }
    },

    // Mark a notification as read
    async markAsRead(req, res) {
        try {
            const { id } = req.params;
            const updatedNotification = await Notification.findByIdAndUpdate(id, { is_read: true }, { new: true });
            if (!updatedNotification) {
                return res.status(404).json({ error: 'Notification not found' });
            }
            res.status(200).json(updatedNotification);
        } catch (error) {
            res.status(500).json({ error: 'Failed to mark notification as read' });
        }
    },
    // Delete a notification by ID
    async deleteNotification(req, res) {
        try {
            const { id } = req.params;
            const deletedNotification = await Notification.findByIdAndDelete(id);
            if (!deletedNotification) {
                return res.status(404).json({ error: 'Notification not found' });
            }
            res.status(200).json({ message: 'Notification deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete notification' });
        }
    }
};

module.exports = NotificationsController;