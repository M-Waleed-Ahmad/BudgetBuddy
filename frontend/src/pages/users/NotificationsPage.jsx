import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import '../../styles/NotificationsPage.css';
import { toast } from 'react-hot-toast';
import { fetchNotifications, markAsRead, deleteNote } from '../../features/notifications/notificationsSlice.js';

const DeleteIcon = ({ size = 16 }) => <span title="Delete" style={{ fontSize: `${size}px`, cursor: 'pointer' }}>🗑️</span>;
const MarkReadIcon = ({ size = 16 }) => <span title="Mark as Read" style={{ fontSize: `${size}px`, cursor: 'pointer' }}>✓</span>;

const NotificationsPage = () => {
  const dispatch = useDispatch();
  const { items: notifications, status, error } = useSelector((state) => state.notifications);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteNote(id)).unwrap();
      toast.success('Notification deleted successfully!');
    } catch (err) {
      toast.error(err || 'Failed to delete notification.');
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await dispatch(markAsRead(id)).unwrap();
      toast.success('Marked as read!');
    } catch (err) {
      toast.error(err || 'Failed to mark as read.');
    }
  };

  const pageVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 120 } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.2 } }
  };

  const loading = status === 'loading';

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
