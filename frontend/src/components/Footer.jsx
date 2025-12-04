// src/components/Footer.jsx
import React from 'react';
import '../styles/Footer.css';
import { FaTwitter, FaFacebookF, FaLinkedinIn, FaYoutube } from 'react-icons/fa';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer" aria-label="Application footer">
      <div className="footer-top">
        <div className="footer-logo">
          <div className="logo-circle" />
          <span>BudgetBuddy</span>
        </div>
        <div className="footer-socials">
          <a
            href="https://x.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Follow BudgetBuddy on X"
          >
            <FaTwitter />
          </a>
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Follow BudgetBuddy on Facebook"
          >
            <FaFacebookF />
          </a>
          <a
            href="https://www.linkedin.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Connect on LinkedIn"
          >
            <FaLinkedinIn />
          </a>
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Watch on YouTube"
          >
            <FaYoutube />
          </a>
        </div>
      </div>

      <hr className="footer-divider" />

      <div className="footer-bottom">
        <div className="footer-links">
          <span>© {year} BudgetBuddy</span>
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
          <a href="#contact">Contact</a>
        </div>
        <div className="footer-links footer-tagline">
          <span>Built for smarter finance.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
