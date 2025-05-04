import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLogIn } from 'react-icons/fi';
// Correct the import path if your CSS file is named navbar1.css
import '../styles/navbar1.css';
import logo from '../assets/logo.png';

// --- SVG Icons ---
const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
// --- Updated Navbar Component ---
const Navbar1 = () => {
  const location = useLocation();
  const [activeLink, setActiveLink] = useState(location.pathname);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Set active link based on location, including signup/login
    setActiveLink(location.pathname);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Navigation links
  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Contact Us', path: '/contact-us' }, // Changed from About Us
  ];

  // Action links (will be styled as buttons)
  const actionLinks = [
      { name: 'Signup', path: '/signup', icon: FiMail, className: 'signup-btn' },
      { name: 'Login', path: '/login', icon: FiLogIn, className: 'login-btn' },
  ];

  const underlineSpring = { /* ... spring config ... */ };
  const mobileMenuVariants = { /* ... variants ... */ };

  const handleLinkClick = (path) => {
    setActiveLink(path);
    setIsMobileMenuOpen(false);
  };

  return (
    // Add the unique scoping class if you need it, or remove if not needed now
    <nav className="BudgetBuddyNavbar navbar">
      {/* --- Left Side --- */}
      <div className="navbar-left">
        <Link to="/" onClick={() => handleLinkClick('/')} className="brand-link">
          <img src={logo} alt="BudgetBuddy Logo" className="logo" />
          <h1 className="brand-name">BudgetBuddy</h1>
        </Link>
        <ul className="navbar-links desktop-links">
          {navLinks.map((link) => (
            <li key={link.path} className="nav-item">
              <Link to={link.path} onClick={() => handleLinkClick(link.path)} className={`nav-link ${activeLink === link.path ? 'active' : ''}`} >
                {link.name}
                {activeLink === link.path && ( <motion.div className="active-underline" layoutId="active-underline-navbar1" initial={false} transition={underlineSpring} /> )}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* --- Right Side --- */}
      <div className="navbar-right">
        {/* Desktop Action Links (Styled as Buttons) */}
        <div className="navbar-actions desktop-actions">
          {actionLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => handleLinkClick(link.path)} // Use handleLinkClick
              // Add active class if needed for styling button differently when on that page
              className={`${link.className} ${activeLink === link.path ? 'action-active' : ''}`}
            >
              <link.icon className="icon" />
              {link.name}
            </Link>
          ))}
        </div>
        <button className="mobile-menu-button icon-button" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"} aria-expanded={isMobileMenuOpen} >
          {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* --- Mobile Menu (Animated) --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div className="mobile-menu-container" initial="closed" animate="open" exit="closed" variants={mobileMenuVariants} >
            <ul className="navbar-links mobile-links">
              {/* Mobile Navigation Links */}
              {navLinks.map((link) => (
                <li key={link.path} className="nav-item mobile-nav-item">
                  <Link to={link.path} onClick={() => handleLinkClick(link.path)} className={`nav-link mobile-nav-link ${activeLink === link.path ? 'active' : ''}`} >
                    {link.name}
                  </Link>
                </li>
              ))}
              {/* Mobile Action Links (Styled as Buttons) */}
              <li className="nav-item mobile-nav-item mobile-actions">
                 {actionLinks.map((link) => (
                    <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => handleLinkClick(link.path)} // Use handleLinkClick
                        className={`${link.className} ${activeLink === link.path ? 'action-active' : ''}`}
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