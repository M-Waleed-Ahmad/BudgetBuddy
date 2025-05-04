import React from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiLogIn } from 'react-icons/fi';
import '../styles/navbar1.css'; 
import logo from '../assets/logo.png'; 

const Navbar = () => {
  return (
    <div className="navbar">
      <div className="navbar-left">
        <img src={logo} alt="BudgetBuddy Logo" className="logo" />
        <h1 className="brand-name">BudgetBuddy</h1>

        <div className="navbar-links">
          <motion.a href="#" className="nav-link active" whileHover={{ scale: 1.05 }}>
            Home
          </motion.a>
          <a href="#" className="nav-link">About Us</a>
        </div>
      </div>

      <div className="navbar-actions">
        <button className="signup-btn">
          <FiMail className="icon" />
          Signup
        </button>
        <button className="login-btn">
          <FiLogIn className="icon" />
          Login
        </button>
      </div>
    </div>
  );
};

export default Navbar;
