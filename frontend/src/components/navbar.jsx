// src/components/Navbar.jsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveMenuItem, setSidebarOpen, setTheme } from '../features/ui/uiSlice.js';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/navbar.css';
import logo from '../assets/logo.png';
import userAvatar from '../assets/avatar.png';

// Icons
const BellIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M18 16.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 6 16.5V18h12v-1.5zM12 22a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 22zm6-11.8V6.5C18 4.02 15.98 2 13.5 2h-3C8.02 2 6 4.02 6 6.5v3.7a6.47 6.47 0 0 0-3 5.8V18a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-2.5a6.47 6.47 0 0 0-3-5.8z" />
  </svg>
);

const MenuIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="26"
    height="26"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="26"
    height="26"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const Navbar = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const { activeMenuItem, isSidebarOpen, theme } = useSelector((state) => state.ui);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 960 : false);

  useEffect(() => {
    dispatch(setActiveMenuItem(location.pathname));
    dispatch(setSidebarOpen(false));
  }, [location.pathname, dispatch]);

  // Close mobile menu when switching to desktop viewport
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 960;
      setIsMobile(mobile);
      if (!mobile && isSidebarOpen) {
        dispatch(setSidebarOpen(false));
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch, isSidebarOpen]);

  useEffect(() => {
    const root = document.documentElement;
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const effective = theme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : theme;
    if (effective === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Budget Management', path: '/budget-management' },
    { name: 'Expense Management', path: '/expense-management' },
    { name: 'Shared Budgeting', path: '/shared-budgeting' },
    { name: 'My Blogs', path: '/my-blogs' },
  ];

  const underlineSpring = {
    type: 'spring',
    stiffness: 500,
    damping: 30,
  };

  const mobileMenuVariants = {
    closed: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.2, ease: 'easeOut' },
    },
    open: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: 'easeIn' },
    },
  };

  const toggleLang = () => {
    const next = i18n.language === 'en' ? 'ur' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem('lang', next);
  };

  const cycleTheme = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    dispatch(setTheme(next));
  };

  const handleLinkClick = (path) => {
    dispatch(setActiveMenuItem(path));
    dispatch(setSidebarOpen(false));
  };

  return (
    <nav className="navbar-container" role="navigation" aria-label="Main navigation">
      {/* Left */}
      <div className="navbar-left">
        <Link
          to="/"
          onClick={() => handleLinkClick('/')}
          className="navbar-logo-link"
        >
          <img src={logo} alt="BudgetBuddy logo" className="navbar-logo" />
        </Link>

        {/* Desktop links */}
        <ul className="navbar-links desktop-links">
          {navLinks.map((link) => (
            <li key={link.path} className="nav-item">
              <Link
                to={link.path}
                onClick={() => handleLinkClick(link.path)}
                className={`nav-link ${activeMenuItem === link.path ? 'active' : ''}`}
              >
                {link.name}
                {activeMenuItem === link.path && (
                  <motion.div
                    className="active-underline"
                    layoutId="active-underline"
                    initial={false}
                    transition={underlineSpring}
                  />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Right */}
      <div className="navbar-right">
        {/* Language + Theme toggles (desktop) */}
        <div className="navbar-utilities desktop-utilities">
          <button
            type="button"
            className="icon-button pill-button"
            onClick={toggleLang}
          >
            {i18n.language === 'en' ? 'EN' : 'UR'}
          </button>

          <button
            type="button"
            className="icon-button pill-button"
            onClick={cycleTheme}
          >
            {theme === 'light' && '🌞'}
            {theme === 'dark' && '🌙'}
            {theme === 'system' && '🖥️'}
          </button>
        </div>

        {/* Notifications */}
        <Link
          to="/notifications"
          onClick={() => handleLinkClick('/notifications')}
          className="icon-button notification-button"
          aria-label="Notifications"
        >
          <BellIcon />
          <span className="notification-dot" />
        </Link>

        {/* Avatar */}
        <Link
          to="/settings"
          onClick={() => handleLinkClick('/settings')}
          className="user-avatar-link"
          aria-label="Account settings"
        >
          <img src={userAvatar} alt="User avatar" className="user-avatar" />
        </Link>

        {/* Mobile menu toggle */}
        {isMobile && (
          <button
            type="button"
            className="mobile-menu-button icon-button"
            onClick={() => dispatch(setSidebarOpen(!isSidebarOpen))}
            aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isSidebarOpen}
          >
            {isSidebarOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        )}
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div
            className="mobile-menu-container"
            initial="closed"
            animate="open"
            exit="closed"
            variants={mobileMenuVariants}
          >
            <ul className="navbar-links mobile-links">
              {navLinks.map((link) => (
                <li key={link.path} className="nav-item mobile-nav-item">
                  <Link
                    to={link.path}
                    onClick={() => handleLinkClick(link.path)}
                    className={`nav-link mobile-nav-link ${
                      activeMenuItem === link.path ? 'active' : ''
                    }`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mobile-utilities">
              <button
                type="button"
                className="icon-button pill-button"
                onClick={toggleLang}
              >
                {i18n.language === 'en' ? 'Switch to Urdu' : 'Switch to English'}
              </button>
              <button
                type="button"
                className="icon-button pill-button"
                onClick={cycleTheme}
              >
                Theme: {theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
