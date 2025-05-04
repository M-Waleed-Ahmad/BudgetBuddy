import React from 'react';
import '../styles/footer1.css';
import { FaTwitter, FaFacebookF, FaLinkedinIn, FaYoutube } from 'react-icons/fa';
import { FiMail } from 'react-icons/fi';
import logo from '../assets/logo.png'; 

const Footer = () => {
  return (
    <footer className="footer">
      <div className="newsletter">
        <h3>Subscribe to our newsletter</h3>
        <div className="newsletter-input">
          <FiMail className="mail-icon" />
          <input type="email" placeholder="Input your email" />
          <button className="subscribe-btn">Subscribe</button>
        </div>
      </div>

      <div className="footer-main">
        <div className="footer-left">
          <img src={logo} alt="logo" className="footer-logo" />
          <h2>BudgetBuddy</h2>
        </div>
        <div className="footer-links">
          <a href="#">Pricing</a>
          <a href="#">About us</a>
          <a href="#">Features</a>
          <a href="#">Help Center</a>
          <a href="#">Contact us</a>
          <a href="#">FAQs</a>
          <a href="#">Careers</a>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="language-selector">
          <select>
            <option>English</option>
            <option>Spanish</option>
          </select>
        </div>
        <p>© 2024 Brand, Inc. • Privacy • Terms • Sitemap</p>
        <div className="social-icons">
          <FaTwitter />
          <FaFacebookF />
          <FaLinkedinIn />
          <FaYoutube />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
