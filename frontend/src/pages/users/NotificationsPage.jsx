import React, { useState } from 'react'; // Import useState
import { motion, AnimatePresence } from 'framer-motion'; // Import AnimatePresence
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';
import '../../styles/NotificationsPage.css';

// --- Icons (Using simple text/emoji placeholders) ---
// Replace with actual SVGs or an icon library for better styling/consistency
const DeleteIcon = ({ size = 16 }) => <span title="Delete" style={{ fontSize: `${size}px`, cursor: 'pointer' }}>🗑️</span>;
const MarkReadIcon = ({ size = 16 }) => <span title="Mark as Read" style={{ fontSize: `${size}px`, cursor: 'pointer' }}>✔️</span>; // Checkmark


// --- Initial Dummy Data (Now includes isRead state) ---
const initialNotificationsData = Array(6).fill(null).map((_, index) => ({ // Use index for variation
    id: `notif-${index}-${Date.now()}`, // More unique key
    date: "March 12, 2025",
    text: `Notification ${index + 1}: This is the notification section. Here the text will be shown. jasdasodjasofkjafklasdkgkadgjas;lgjasg;lasjdg`,
    timeAgo: `${5 + index} mins ago`, // Vary time slightly
    isRead: index % 3 === 0 // Mark every 3rd one as read initially for demo
}));


const NotificationsPage = () => {

    // --- State for Notifications ---
    const [notifications, setNotifications] = useState(initialNotificationsData);

    // --- Handlers ---
    const handleDelete = (idToDelete) => {
        setNotifications(prevNotifications =>
            prevNotifications.filter(n => n.id !== idToDelete)
        );
        // TODO: Add API call to delete notification on the server
    };

    const handleMarkAsRead = (idToMark) => {
        setNotifications(prevNotifications =>
            prevNotifications.map(n =>
                n.id === idToMark ? { ...n, isRead: true } : n
            )
        );
        // TODO: Add API call to mark notification as read on the server
    };

    // --- Animation Variants ---
    const pageVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10, scale: 0.98 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 120 } },
        exit: { opacity: 0, x: -50, transition: { duration: 0.2 } } // Exit animation for delete
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

                <div className="notifications-list"> {/* Removed motion variant from here */}
                    {notifications.length === 0 ? (
                        <motion.p variants={itemVariants} className="no-notifications-message">
                            You have no new notifications.
                        </motion.p>
                    ) : (
                        // Use AnimatePresence to handle exit animations
                        <AnimatePresence initial={false}>
                            {notifications.map((notification) => (
                                <motion.div
                                    className={`notification-item ${notification.isRead ? 'read' : ''}`}
                                    key={notification.id} // Key must be on the motion component directly inside AnimatePresence
                                    variants={itemVariants}
                                    initial="hidden" // Apply variants to each item
                                    animate="visible"
                                    exit="exit"
                                    layout // Animate layout changes smoothly
                                >
                                    <div className="notification-main-content">
                                        <h4 className="notification-date">{notification.date}</h4>
                                        <p className="notification-text">{notification.text}</p>
                                        <small className="notification-time">{notification.timeAgo}</small>
                                    </div>
                                    <div className="notification-actions">
                                        {/* Only show "Mark as Read" if not already read */}
                                        {!notification.isRead && (
                                            <motion.button
                                                className="action-button mark-read-button"
                                                onClick={() => handleMarkAsRead(notification.id)}
                                                whileTap={{ scale: 0.9 }}
                                                aria-label="Mark as Read"
                                            >
                                                <MarkReadIcon />
                                            </motion.button>
                                        )}
                                        <motion.button
                                            className="action-button delete-button"
                                            onClick={() => handleDelete(notification.id)}
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