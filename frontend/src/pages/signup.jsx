import React, { useState } from 'react';
import '../styles/signup.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    currency: '',
    referralCode: '',
    recoveryEmail: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("✅ Signing up with:", formData);
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <h2>Create an Account</h2>
        <p className="subheading">Signup to start managing</p>

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="input-container">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-container">
            <input
              type="email"
              name="email"
              placeholder="Your Email Address"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-container">
            <input
              type="password"
              name="password"
              placeholder="Enter your Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-container">
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm your Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-row">
            <div className="input-container half">
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                required
              >
                <option value="" disabled>Select Currency</option>
                <option value="USD">USD</option>
                <option value="PKR">PKR</option>
                <option value="EUR">EUR</option>
                <option value="INR">INR</option>
              </select>
            </div>

            <div className="input-container half">
              <input
                type="text"
                name="referralCode"
                placeholder="Referral Code"
                value={formData.referralCode}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="input-container">
            <input
              type="email"
              name="recoveryEmail"
              placeholder="Recovery Email"
              value={formData.recoveryEmail}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="primary-btn">Register</button>

          <div className="divider">
            <span>or</span>
          </div>

          <div className="login-prompt">
            Already have an account? <a href="#">Login</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
