import React from 'react';
import '../styles/Footer.css';
import { FaTwitter, FaFacebookF, FaLinkedinIn, FaYoutube } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-logo">
          <div className="logo-circle" />
          <span className="logo-text">BudgetBuddy</span>
        </div>
        <select className="language-selector">
          <option>English</option>
          <option>Español</option>
          <option>Français</option>
        </select>
      </div>
      <hr className="footer-divider" />
      <div className="footer-bottom">
        <div className="footer-links">
          © 2024 Brand, Inc. • <a href="#">Privacy</a> • <a href="#">Terms</a> • <a href="#">Sitemap</a>
        </div>
        <div className="footer-socials">
          <a  href="#"><FaTwitter className="test" /></a>
          <a  href="#"><FaFacebookF className="test" /></a>
          <a  href="#"><FaLinkedinIn className="test"/></a>
          <a  href="#"><FaYoutube className="test"/></a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
