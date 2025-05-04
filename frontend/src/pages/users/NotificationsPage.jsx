import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import '../../styles/NotificationsPage.css';
import {  toast } from 'react-hot-toast';
import {
    getNotifications,
    markNotificationAsRead,
    deleteNotification
} from '../../api/api';

// Simple emoji icons
const DeleteIcon = ({ size = 16 }) => <span title="Delete" style={{ fontSize: `${size}px`, cursor: 'pointer' }}>🗑️</span>;
const MarkReadIcon = ({ size = 16 }) => <span title="Mark as Read" style={{ fontSize: `${size}px`, cursor: 'pointer' }}>✔️</span>;

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch notifications on component mount
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const data = await getNotifications();
                console.log('Fetched notifications:', data);
                setNotifications(data);
            } catch (err) {
                setError(err.message || 'Failed to fetch notifications.');
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, []);

    // Handle delete notification
    const handleDelete = async (idToDelete) => {
        try {
            await deleteNotification(idToDelete);
            setNotifications(prev => prev.filter(n => n._id !== idToDelete));
            toast.success('Notification deleted successfully!');
        } catch (error) {
            console.error('Failed to delete notification:', error);
            toast.error('Failed to delete notification.');
        }
    };
    

    // Handle mark as read
    const handleMarkAsRead = async (idToMark) => {
        try {
            const updatedNotification = await markNotificationAsRead(idToMark);
            setNotifications(prev =>
                prev.map(n => n._id === idToMark ? updatedNotification : n)
            );
            toast.success('Marked as read!');
        } catch (error) {
            console.error('Failed to mark as read:', error);
            toast.error('Failed to mark as read.');
        }
    };
    
    // Animation variants
    const pageVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10, scale: 0.98 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 120 } },
        exit: { opacity: 0, x: -50, transition: { duration: 0.2 } }
    };

    return (
        <div className="page-container">
            <Navbar />
            <motion.main
                className="notifications-content"
                variants={pageVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.h1 className="page-title" variants={itemVariants}>
                    Notifications
                </motion.h1>

                <div className="notifications-list">
                    {loading ? (
                        <motion.p variants={itemVariants} className="loading-message">Loading notifications...</motion.p>
                    ) : error ? (
                        <motion.p variants={itemVariants} className="error-message">{error}</motion.p>
                    ) : notifications.length === 0 ? (
                        <motion.p variants={itemVariants} className="no-notifications-message">
                            You have no new notifications.
                        </motion.p>
                    ) : (
                        <AnimatePresence initial={false}>
                            {notifications.map((notification) => (
                                <motion.div
                                    className={`notification-item ${notification.is_read ? 'read' : ''}`}
                                    key={notification._id}
                                    variants={itemVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    layout
                                >
                                    <div className="notification-main-content">
                                        <h4 className="notification-date">
                                            {new Date(notification.created_at).toLocaleDateString()}
                                        </h4>
                                        <p className="notification-text">{notification.message}</p>
                                        <small className="notification-time">
                                            {new Date(notification.created_at).toLocaleTimeString()}
                                        </small>
                                    </div>

                                    <div className="notification-actions">
                                        {!notification.is_read && (
                                            <motion.button
                                                className="action-button mark-read-button"
                                                onClick={() => handleMarkAsRead(notification._id)}
                                                whileTap={{ scale: 0.9 }}
                                                aria-label="Mark as Read"
                                            >
                                                <MarkReadIcon />
                                            </motion.button>
                                        )}
                                        <motion.button
                                            className="action-button delete-button"
                                            onClick={() => handleDelete(notification._id)}
                                            whileTap={{ scale: 0.9 }}
                                            aria-label="Delete Notification"
                                        >
                                            <DeleteIcon />
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </motion.main>
            <Footer />
        </div>
    );
};

export default NotificationsPage;
