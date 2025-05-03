// contactUs.jsx
import React from 'react';
import '../styles/contactUs.css';

const ContactUs = () => {
  return (
    <div className="contact-page">
      <div className="header">
        <div className="logo-container">
          <div className="logo-circle"></div>
          <span className="logo-text">BudgetBuddy</span>
        </div>
        <div className="header-links">
          <span className="active-link">Customer</span>
          <span>Contact Us</span>
        </div>
      </div>

      <div className="content-container">
        <h1 className="page-title">Contact Us</h1>

        <div className="mission-section">
          <h2>Our Mission</h2>
          <p>To design innovative solutions that empower individuals and organizations to achieve their goals.</p>
        </div>

        <div className="vision-section">
          <h2>Our Vision</h2>
          <p>To be a global leader in providing cutting-edge technology that is distributed to future experiences.</p>
        </div>

        <div className="connect-section">
          <h3>Connect with Us</h3>
          <div className="checkbox-group">
            <div className="checkbox-item">
              <input type="checkbox" id="team-assists" />
              <label htmlFor="team-assists">Your team assists</label>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" id="local-address" />
              <label htmlFor="local-address">Your local address</label>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" id="our-address1" />
              <label htmlFor="our-address1">Our local address</label>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" id="our-address2" />
              <label htmlFor="our-address2">Our local address</label>
            </div>
          </div>
        </div>

        <div className="input-section">
          <div className="input-group">
            <label>Submit the latest version:</label>
            <input type="text" />
          </div>
          <div className="input-group">
            <label>Save your name</label>
            <input type="text" />
          </div>
        </div>

        <div className="info-section">
          <div className="info-column">
            <h4>BudgetBuddy</h4>
            <p>Phone</p>
            <p>About us</p>
            <p>Fax (mail)</p>
          </div>
          <div className="info-column">
            <p>Instagram</p>
            <p>Contact us</p>
            <p>Mail</p>
            <p>Email</p>
          </div>
        </div>

        <div className="map-section">
          <button className="map-button">Subscribe to Google Maps online</button>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;