import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiLogOut, FiMenu, FiSettings, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { getUnreadNotificationCount } from '../api';
import { NOTIFICATIONS_CHANGED_EVENT } from '../utils/notifications';
import Avatar from './Avatar';
import logo from '../assets/logo.png';
import '../styles/AppNavbar.css';

const NAV_LINKS = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Budget Management', path: '/budget-management' },
  { name: 'Expense Management', path: '/expense-management' },
  { name: 'Shared Budgeting', path: '/shared-budgeting' },
];

const UNREAD_POLL_MS = 60_000;

const mobileMenuVariants = {
  closed: { opacity: 0, y: -12, transition: { duration: 0.15 } },
  open: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

/** Keeps the unread-notification count fresh without tight polling. */
function useUnreadCount(pathname) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const data = await getUnreadNotificationCount();
      setCount(Number(data?.count) || 0);
    } catch {
      /* the indicator is non-critical; keep the last known value */
    }
  }, []);

  // On every navigation.
  useEffect(() => {
    refresh();
  }, [pathname, refresh]);

  // Every minute while the tab is visible, when it becomes visible again,
  // and whenever another component reports a change.
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, UNREAD_POLL_MS);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
    };
  }, [refresh]);

  return count;
}

const AppNavbar = () => {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const unreadCount = useUnreadCount(pathname);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const mobileMenuId = useId();
  const userMenuId = useId();

  // Close menus whenever the route changes.
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [pathname]);

  // Close the user menu on outside click or Escape.
  useEffect(() => {
    if (!isUserMenuOpen && !isMobileMenuOpen) return undefined;
    const onPointerDown = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setIsUserMenuOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isUserMenuOpen, isMobileMenuOpen]);

  const notificationsLabel =
    unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications';

  return (
    <header className="app-navbar">
      <a className="app-navbar__skip" href="#main-content">
        Skip to content
      </a>
      <div className="app-navbar__left">
        <Link to="/dashboard" className="app-navbar__brand" aria-label="BudgetBuddy dashboard">
          <img src={logo} alt="" className="app-navbar__logo" width="40" height="40" />
          <span className="app-navbar__brand-name">BudgetBuddy</span>
        </Link>
        <nav aria-label="Main">
          <ul className="app-navbar__links">
            {NAV_LINKS.map((link) => (
              <li key={link.path}>
                <NavLink
                  to={link.path}
                  className={({ isActive }) => `app-navbar__link${isActive ? ' is-active' : ''}`}
                >
                  {({ isActive }) => (
                    <>
                      {link.name}
                      {isActive && (
                        <motion.span
                          className="app-navbar__underline"
                          layoutId="app-navbar-underline"
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="app-navbar__right">
        <Link to="/notifications" className="app-navbar__icon-link" aria-label={notificationsLabel}>
          <FiBell size={22} aria-hidden="true" />
          {unreadCount > 0 && <span className="app-navbar__dot" aria-hidden="true" />}
        </Link>

        <div className="app-navbar__user" ref={userMenuRef}>
          <button
            type="button"
            className="app-navbar__avatar-button"
            aria-haspopup="menu"
            aria-expanded={isUserMenuOpen}
            aria-controls={userMenuId}
            aria-label={`Account menu for ${user?.name || 'your account'}`}
            onClick={() => setIsUserMenuOpen((open) => !open)}
          >
            <Avatar src={user?.profileImage} name={user?.name} size={34} decorative />
          </button>
          {isUserMenuOpen && (
            <div className="app-navbar__menu" id={userMenuId} role="menu">
              <div className="app-navbar__menu-header">
                <strong>{user?.name || 'Signed in'}</strong>
                {user?.email && <span>{user.email}</span>}
              </div>
              <Link to="/settings" role="menuitem" className="app-navbar__menu-item">
                <FiSettings aria-hidden="true" /> Settings
              </Link>
              <button type="button" role="menuitem" className="app-navbar__menu-item" onClick={logout}>
                <FiLogOut aria-hidden="true" /> Log out
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          className="app-navbar__menu-toggle"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMobileMenuOpen}
          aria-controls={mobileMenuId}
        >
          {isMobileMenuOpen ? <FiX size={26} aria-hidden="true" /> : <FiMenu size={26} aria-hidden="true" />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.nav
            id={mobileMenuId}
            className="app-navbar__mobile"
            aria-label="Main"
            initial="closed"
            animate="open"
            exit="closed"
            variants={mobileMenuVariants}
          >
            <ul>
              {NAV_LINKS.map((link) => (
                <li key={link.path}>
                  <NavLink
                    to={link.path}
                    className={({ isActive }) => `app-navbar__mobile-link${isActive ? ' is-active' : ''}`}
                  >
                    {link.name}
                  </NavLink>
                </li>
              ))}
              <li>
                <NavLink
                  to="/settings"
                  className={({ isActive }) => `app-navbar__mobile-link${isActive ? ' is-active' : ''}`}
                >
                  Settings
                </NavLink>
              </li>
              <li>
                <button type="button" className="app-navbar__mobile-link" onClick={logout}>
                  Log out
                </button>
              </li>
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};

export default AppNavbar;
