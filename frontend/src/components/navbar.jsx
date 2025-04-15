import React, { useState } from 'react';
import '../styles/navbar.css';
import logo from '../assets/logo.png';
import userAvatar from '../assets/avatar.png';
import { FaBars, FaTimes } from 'react-icons/fa';
import { HiBell } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';

const linkVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      type: 'spring',
      stiffness: 250,
      damping: 20,
    },
  }),
};

const hoverVariant = {
  scale: 1.08,
  transition: { type: 'spring', stiffness: 300 },
};

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Dashboard', href: '#', active: true },
    { name: 'Budget Management', href: '#' },
    { name: 'Expense Management', href: '#' },
    { name: 'Shared Budgeting', href: '#' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <img src={logo} alt="App Logo" className="logo" />
          <ul className="nav-links desktop">
            {navLinks.map((link, i) => (
              <motion.li
                key={i}
                className={link.active ? 'active' : ''}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={linkVariants}
                whileHover={hoverVariant}
              >
                <a href={link.href}>{link.name}</a>
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="navbar-right">
          <motion.div
            className="notification-wrapper"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <HiBell className="notification-icon" />
            <span className="notification-badge" />
          </motion.div>

          <motion.img
            src={userAvatar}
            alt="User Avatar"
            className="avatar"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          />

          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {menuOpen && (
          <motion.ul
            className="nav-links mobile"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {navLinks.map((link, i) => (
              <motion.li
                key={i}
                custom={i}
                variants={linkVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                whileHover={hoverVariant}
                className={link.active ? 'active' : ''}
              >
                <a href={link.href}>{link.name}</a>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
