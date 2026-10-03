import { http } from './client';

export const getNotifications = () => http.get('/notifications');

/** Resolves with { count }. */
export const getUnreadNotificationCount = () => http.get('/notifications/unread-count');

export const markNotificationAsRead = (id) => http.put(`/notifications/${id}/read`);

export const markAllNotificationsAsRead = () => http.put('/notifications/read-all');

export const deleteNotification = (id) => http.delete(`/notifications/${id}`);
