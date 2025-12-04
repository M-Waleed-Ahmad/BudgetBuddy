import React, { useState } from 'react';
import '../styles/footer1.css';
import { FaTwitter, FaFacebookF, FaLinkedinIn, FaYoutube } from 'react-icons/fa';
import { FiMail } from 'react-icons/fi';
import logo from '../assets/logo.png';
import { subscribeToNewsletter } from '../api/api';
import { toast } from 'react-hot-toast';

const Footer1 = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    // Very basic email sanity check
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await subscribeToNewsletter(email.trim());
      console.log('Subscribed:', result);
      toast.success('Subscribed successfully!');
      setEmail('');
    } catch (error) {
      console.error('Subscription failed:', error);
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Something went wrong. Please try again.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubscribe();
    }
  };

  return (
    <footer className="footer-root" aria-label="Site footer">
      {/* Newsletter strip */}
      <section className="footer-newsletter" aria-label="Newsletter subscription">
        <h3 className="footer-newsletter-title">Stay ahead of your finances</h3>
        <p className="footer-newsletter-subtitle">
          Get occasional tips, feature updates, and budgeting insights. No spam, ever.
        </p>

        <div className="footer-newsletter-form">
          <FiMail className="footer-mail-icon" aria-hidden="true" />
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            className="footer-input"
            aria-label="Email address"
          />
          <button
            type="button"
            className="footer-subscribe-btn"
            onClick={handleSubscribe}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Subscribing…' : 'Subscribe'}
          </button>
        </div>
      </section>

      {/* Main footer content */}
      <div className="footer-main">
        <div className="footer-brand-block">
          <div className="footer-brand">
            <img src={logo} alt="BudgetBuddy logo" className="footer-logo" />
            <div>
              <h2 className="footer-brand-name">BudgetBuddy</h2>
              <p className="footer-brand-tagline">
                Expense management and shared budgeting, all in one place.
              </p>
            </div>
          </div>
        </div>

        <nav className="footer-links-block" aria-label="Footer navigation">
          <div className="footer-links-column">
            <span className="footer-links-heading">Product</span>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#faqs">FAQs</a>
          </div>
          <div className="footer-links-column">
            <span className="footer-links-heading">Company</span>
            <a href="#about">About us</a>
            <a href="#careers">Careers</a>
            <a href="#contact">Contact us</a>
          </div>
          <div className="footer-links-column">
            <span className="footer-links-heading">Support</span>
            <a href="#help">Help Center</a>
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
          </div>
        </nav>
      </div>

      {/* Bottom row */}
      <div className="footer-bottom">
        <div className="footer-language">
          <select aria-label="Select language">
            <option value="en">English</option>
            <option value="es">Spanish</option>
          </select>
        </div>

        <p className="footer-meta-text">
          © {new Date().getFullYear()} BudgetBuddy. All rights reserved.
        </p>

        <div className="footer-social">
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Visit our Twitter"
          >
            <FaTwitter />
          </a>
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Visit our Facebook"
          >
            <FaFacebookF />
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Visit our LinkedIn"
          >
            <FaLinkedinIn />
          </a>
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Visit our YouTube"
          >
            <FaYoutube />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer1;
