import React, { useEffect, useState } from 'react';
import '../styles/login.css';


const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("✅ Logging in with:", formData);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>Access your Account</h2>
        <p className="subheading">Login to manage your Finances</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-container">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Your Email Address"
              required
            />
          </div>

          <div className="input-container">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your Password"
              required
            />
          </div>

          <div className="forgot-password">
            <a href="#">Forgot your password?</a>
          </div>

          <button type="submit" className="primary-btn">Log in</button>

          <div className="or-divider">or</div>

          <button type="button" className="apple-btn">Log in with Apple</button>
          <button type="button" className="google-btn">Log in with Google</button>
          <button type="button" className="facebook-btn">Log in with Facebook</button>

          <div className="signup-prompt">
            Need to create a free account? <a href="#">Sign Up</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
