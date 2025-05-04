import React, { useState } from 'react';
import '../styles/footer1.css';
import { FaTwitter, FaFacebookF, FaLinkedinIn, FaYoutube } from 'react-icons/fa';
import { FiMail } from 'react-icons/fi';
import logo from '../assets/logo.png';
import { subscribeToNewsletter } from '../api/api'; // adjust path as needed
import { toast } from 'react-hot-toast'; // assuming you're using react-toastify

const Footer1 = () => {
  const [email, setEmail] = useState('');

  const handleSubscribe = async () => {
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      const result = await subscribeToNewsletter(email);
      console.log('Subscribed:', result);
      toast.success('Subscribed successfully!');
      setEmail('');
    } catch (error) {
      console.error('Subscription failed:', error);
      toast.error(error.message);
    }
  };

  return (
    <footer className="footer">
      <div className="newsletter">
        <h3>Subscribe to our newsletter</h3>
        <div className="newsletter-input">
          <FiMail className="mail-icon" />
          <input
            type="email"
            placeholder="Input your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="subscribe-btn" onClick={handleSubscribe}>
            Subscribe
          </button>
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

export default Footer1;
