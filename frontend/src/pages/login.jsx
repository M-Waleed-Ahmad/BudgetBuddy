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

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        alert(data.message || 'Login failed');
        return;
      }
  
      console.log('✅ Login successful:', data);
      // Optionally store token in localStorage or context
      localStorage.setItem('token', data.token);
      alert('Login successful!');
      // Redirect to dashboard or homepage
    } catch (error) {
      console.error('❌ Login error:', error);
      alert('An error occurred while logging in');
    }
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
