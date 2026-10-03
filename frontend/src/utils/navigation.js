/** Returns where a user should land after signing in: the page they originally asked for, or the dashboard. */
export function getPostLoginPath(location) {
  const from = location?.state?.from;
  if (!from?.pathname || ['/login', '/signup', '/reset-password'].includes(from.pathname)) return '/dashboard';
  return `${from.pathname}${from.search || ''}${from.hash || ''}`;
}
