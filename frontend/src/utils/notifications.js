// Lightweight cross-component signal so the navbar's unread indicator refreshes
// immediately after the notifications page (or anything else) changes read state.

export const NOTIFICATIONS_CHANGED_EVENT = 'notifications:changed';

export function emitNotificationsChanged() {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
}
