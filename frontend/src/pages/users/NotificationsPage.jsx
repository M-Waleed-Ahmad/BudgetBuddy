import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  FiAlertTriangle,
  FiBell,
  FiCheck,
  FiCheckCircle,
  FiChevronRight,
  FiDollarSign,
  FiMail,
  FiShield,
  FiTrash2,
  FiUserCheck,
  FiUserMinus,
  FiUserPlus,
  FiUserX,
  FiXCircle,
  FiClock,
} from 'react-icons/fi';
import AppLayout from '../../components/AppLayout';
import SectionState from '../../components/SectionState';
import { useAsyncData } from '../../hooks/useAsyncData';
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../../api';
import { formatDateTime, formatRelativeTime } from '../../utils/format';
import { emitNotificationsChanged } from '../../utils/notifications';
import '../../styles/NotificationsPage.css';

const TYPE_META = {
  invite_received: { icon: FiMail, tone: 'info' },
  invite_accepted: { icon: FiUserCheck, tone: 'success' },
  invite_rejected: { icon: FiUserX, tone: 'muted' },
  member_joined_plan: { icon: FiUserPlus, tone: 'success' },
  member_removed: { icon: FiUserMinus, tone: 'warning' },
  expense_added: { icon: FiDollarSign, tone: 'info' },
  expense_needs_approval: { icon: FiClock, tone: 'warning' },
  expense_approved: { icon: FiCheckCircle, tone: 'success' },
  expense_rejected: { icon: FiXCircle, tone: 'danger' },
  budget_limit_approaching: { icon: FiAlertTriangle, tone: 'warning' },
  budget_limit_exceeded: { icon: FiAlertTriangle, tone: 'danger' },
  role_changed: { icon: FiShield, tone: 'info' },
  generic_message: { icon: FiBell, tone: 'muted' },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -40, transition: { duration: 0.2 } },
};

const loadNotifications = async () => (await getNotifications()) || [];

/** Only follow links that point at a route inside this app. */
const isInternalLink = (link) => typeof link === 'string' && link.startsWith('/') && !link.startsWith('//');

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { data, setData, loading, error, reload } = useAsyncData(loadNotifications, { initialData: [] });
  const notifications = data || [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const updateLocal = (id, changes) =>
    setData((prev) => (prev || []).map((n) => (n._id === id ? { ...n, ...changes } : n)));

  const markRead = async (notification) => {
    if (notification.is_read) return true;
    try {
      const updated = await markNotificationAsRead(notification._id);
      updateLocal(notification._id, updated || { is_read: true });
      emitNotificationsChanged();
      return true;
    } catch (err) {
      toast.error(err.message || 'Could not mark the notification as read.');
      return false;
    }
  };

  const handleOpen = async (notification) => {
    await markRead(notification);
    if (isInternalLink(notification.link)) navigate(notification.link);
  };

  const handleMarkAll = async () => {
    setIsMarkingAll(true);
    try {
      await markAllNotificationsAsRead();
      setData((prev) => (prev || []).map((n) => ({ ...n, is_read: true })));
      emitNotificationsChanged();
      toast.success('All notifications marked as read.');
    } catch (err) {
      toast.error(err.message || 'Could not mark notifications as read.');
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleDelete = async (notification) => {
    try {
      await deleteNotification(notification._id);
      setData((prev) => (prev || []).filter((n) => n._id !== notification._id));
      emitNotificationsChanged();
      toast.success('Notification deleted.');
    } catch (err) {
      toast.error(err.message || 'Could not delete the notification.');
    }
  };

  return (
    <AppLayout className="notifications-page">
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <p className="page-subtitle">
            {unreadCount > 0 ? `You have ${unreadCount} unread ${unreadCount === 1 ? 'notification' : 'notifications'}.` : "You're all caught up."}
          </p>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={handleMarkAll}
          disabled={unreadCount === 0 || isMarkingAll}
        >
          <FiCheck aria-hidden="true" /> {isMarkingAll ? 'Marking…' : 'Mark all as read'}
        </button>
      </div>

      <SectionState
        loading={loading}
        error={error}
        onRetry={reload}
        empty={notifications.length === 0}
        emptyMessage={
          <div className="notifications-page__empty">
            <FiBell size={36} aria-hidden="true" />
            <p>No notifications yet. Budget alerts and family plan updates will show up here.</p>
          </div>
        }
      >
        <ul className="notifications-page__list">
          <AnimatePresence initial={false}>
            {notifications.map((notification) => {
              const meta = TYPE_META[notification.type] || TYPE_META.generic_message;
              const Icon = meta.icon;
              const hasLink = isInternalLink(notification.link);
              return (
                <motion.li
                  key={notification._id}
                  layout
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className={`notifications-page__item${notification.is_read ? ' is-read' : ''}`}
                >
                  <span className={`notifications-page__icon tone-${meta.tone}`} aria-hidden="true">
                    <Icon />
                  </span>
                  <button
                    type="button"
                    className="notifications-page__body"
                    onClick={() => handleOpen(notification)}
                    aria-label={`${notification.is_read ? '' : 'Unread: '}${notification.message}${hasLink ? '. Open' : ''}`}
                  >
                    <span className="notifications-page__message">{notification.message}</span>
                    <time className="notifications-page__time" dateTime={notification.created_at} title={formatDateTime(notification.created_at)}>
                      {formatRelativeTime(notification.created_at)}
                      {notification.actor?.name ? ` · ${notification.actor.name}` : ''}
                    </time>
                    {hasLink && <FiChevronRight className="notifications-page__chevron" aria-hidden="true" />}
                  </button>
                  <div className="notifications-page__actions">
                    {!notification.is_read && (
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => markRead(notification)}
                        aria-label="Mark as read"
                        title="Mark as read"
                      >
                        <FiCheck aria-hidden="true" />
                      </button>
                    )}
                    <button
                      type="button"
                      className="icon-button danger"
                      onClick={() => handleDelete(notification)}
                      aria-label="Delete notification"
                      title="Delete"
                    >
                      <FiTrash2 aria-hidden="true" />
                    </button>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      </SectionState>
    </AppLayout>
  );
};

export default NotificationsPage;
