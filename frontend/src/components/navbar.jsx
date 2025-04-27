import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; // Import AnimatePresence
import '../styles/navbar.css';
import logo from '../assets/logo.png';
import userAvatar from '../assets/avatar.png';

// --- SVG Icons ---
const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 16.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 6 16.5V18h12v-1.5zM12 22a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 22zm6-11.8V6.5C18 4.02 15.98 2 13.5 2h-3C8.02 2 6 4.02 6 6.5v3.7a6.47 6.47 0 0 0-3 5.8V18a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-2.5a6.47 6.47 0 0 0-3-5.8z"/>
  </svg>
);

const MenuIcon = () => ( // Hamburger Icon
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
);

const CloseIcon = () => ( // X Icon
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

// --- Navbar Component ---
const Navbar = () => {
  const location = useLocation();
  const [activeLink, setActiveLink] = useState(location.pathname);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State for mobile menu

  // Update active link if the route changes (e.g., browser back/forward)
  useEffect(() => {
    setActiveLink(location.pathname);
     // Close mobile menu on route change
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Budget Management', path: '/budget-management' },
    { name: 'Expense Management', path: '/expense-management' },
    { name: 'Shared Budgeting', path: '/shared-budgeting' },
  ];

  const underlineSpring = {
    type: "spring",
    stiffness: 500,
    damping: 30
  };

  // Animation variants for the mobile menu
  const mobileMenuVariants = {
    closed: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.2, ease: "easeOut" }
    },
    open: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeIn" }
    }
  };

  const handleLinkClick = (path) => {
    setActiveLink(path);
    setIsMobileMenuOpen(false); // Close menu when a link is clicked
  };

  return (
    <nav className="navbar-container">
      {/* --- Left Side --- */}
      <div className="navbar-left">
        <Link to="/" onClick={() => handleLinkClick('/')} className="navbar-logo-link">
            <img src={logo} alt="Company Logo" className="navbar-logo" />
        </Link>
        {/* Desktop Links */}
        <ul className="navbar-links desktop-links">
          {navLinks.map((link) => (
            <li key={link.path} className="nav-item">
              <Link
                to={link.path}
                onClick={() => setActiveLink(link.path)} // Keep setActiveLink here for immediate visual feedback
                className={`nav-link ${activeLink === link.path ? 'active' : ''}`}
              >
                {link.name}
                {activeLink === link.path && (
                  <motion.div
                    className="active-underline"
                    layoutId="active-underline" // Unique ID for the animated element
                    initial={false}
                    transition={underlineSpring}
                  />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* --- Right Side --- */}
      <div className="navbar-right">
        <button className="notification-button icon-button"> {/* Added icon-button class */}
          <Link to="/notifications" onClick={() => handleLinkClick('/notifications')} className="notification-link"> {/* Optional: Make notification a link */}
          <BellIcon />
          <span className="notification-dot"></span>
          </Link>
        </button>
        <Link to="/settings" onClick={() => handleLinkClick('/profile')} className="user-avatar-link"> {/* Optional: Make avatar a link */}
            <img src={userAvatar} alt="User Avatar" className="user-avatar" />
        </Link>

        {/* Mobile Menu Button */}
        <button
            className="mobile-menu-button icon-button" // Added icon-button class
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"} // Accessibility
            aria-expanded={isMobileMenuOpen}
        >
            {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* --- Mobile Menu (Animated) --- */}
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
                    onClick={() => handleLinkClick(link.path)} // Use handler to close menu
                    className={`nav-link mobile-nav-link ${activeLink === link.path ? 'active' : ''}`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;