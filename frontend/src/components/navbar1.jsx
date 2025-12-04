// src/components/navbar1.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLogIn } from 'react-icons/fi';
import '../styles/navbar1.css';
import logo from '../assets/logo.png';

// Icons
const MenuIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="28"
    height="28"
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
    width="28"
    height="28"
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

const Navbar1 = () => {
  const location = useLocation();
  const [activeLink, setActiveLink] = useState(location.pathname);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setActiveLink(location.pathname);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Contact Us', path: '/contact-us' },
  ];

  const actionLinks = [
    { name: 'Signup', path: '/signup', icon: FiMail, className: 'signup-btn' },
    { name: 'Login', path: '/login', icon: FiLogIn, className: 'login-btn' },
  ];

  const underlineSpring = {
    type: 'spring',
    stiffness: 500,
    damping: 32,
  };

  const mobileMenuVariants = {
    closed: { opacity: 0, y: -14, transition: { duration: 0.15 } },
    open: { opacity: 1, y: 0, transition: { duration: 0.22 } },
  };

  const handleLinkClick = (path) => {
    setActiveLink(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="BudgetBuddyNavbar navbar navbar1" role="navigation" aria-label="Public navigation">
      {/* Left */}
      <div className="navbar-left">
        <Link
          to="/"
          onClick={() => handleLinkClick('/')}
          className="brand-link"
        >
          <img src={logo} alt="BudgetBuddy logo" className="logo" />
          <h1 className="brand-name">BudgetBuddy</h1>
        </Link>

        <ul className="navbar-links desktop-links">
          {navLinks.map((link) => (
            <li key={link.path} className="nav-item">
              <Link
                to={link.path}
                onClick={() => handleLinkClick(link.path)}
                className={`nav-link ${activeLink === link.path ? 'active' : ''}`}
              >
                {link.name}
                {activeLink === link.path && (
                  <motion.div
                    className="active-underline"
                    layoutId="active-underline-navbar1"
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
        {/* Desktop call-to-actions */}
        <div className="navbar-actions desktop-actions">
          {actionLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => handleLinkClick(link.path)}
              className={`${link.className} ${
                activeLink === link.path ? 'action-active' : ''
              }`}
            >
              <link.icon className="icon" />
              {link.name}
            </Link>
          ))}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className="mobile-menu-button icon-button"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
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
                      activeLink === link.path ? 'active' : ''
                    }`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}

              <li className="nav-item mobile-nav-item mobile-actions">
                {actionLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => handleLinkClick(link.path)}
                    className={`${link.className} ${
                      activeLink === link.path ? 'action-active' : ''
                    }`}
                  >
                    <link.icon className="icon" />
                    {link.name}
                  </Link>
                ))}
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar1;
