import React, { useState, useEffect } from 'react'; // Added useEffect
import { useNavigate, useLocation } from 'react-router-dom'; // Import hooks
import '../styles/login.css';
import { loginUser } from '../api/api'; // Adjust the import path as necessary

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // --- React Router Hooks ---
  const navigate = useNavigate();
  const location = useLocation();

  // Determine where to redirect after login
  // Defaults to '/dashboard' if no previous location was passed in state
  const from = location.state?.from?.pathname || "/dashboard";

  // --- Redirect if already logged in ---
   useEffect(() => {
       const token = localStorage.getItem('token');
       if (token) {
           // Already logged in, redirect away from login page
           console.log("Already logged in, redirecting to:", from); // Log for debugging
           navigate(from || '/dashboard', { replace: true });
       }
       // Add navigate and from to dependency array if your linter suggests it,
       // though often not strictly necessary for this redirect logic.
   }, [navigate, from]); // Rerun if navigation function or target changes

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Assuming loginUser handles the API call and returns { token: "..." } on success
      const data = await loginUser(formData);

      console.log('✅ Login successful:', data);
      localStorage.setItem('token', data.token); // Store the token
      // alert('Login successful!'); // Optional: Remove alert for smoother UX

      // --- Redirect using navigate ---
      // Navigate to the intended page ('from') or default to '/dashboard'
      // 'replace: true' prevents the login page from being in the browser history
      navigate(from, { replace: true });

    } catch (error) {
      console.error('❌ Login error:', error);
      // Provide more specific feedback if possible from the error object
      alert(error.message || 'Login failed. Please check your credentials.');
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
              aria-label="Email Address"
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
              aria-label="Password"
            />
          </div>

          {/* Implement Forgot Password functionality separately */}
          <div className="forgot-password">
            <a href="#">Forgot your password?</a>
          </div>

          <button type="submit" className="primary-btn">Log in</button>

          <div className="or-divider">or</div>

          {/* Implement Social Logins separately */}
          <button type="button" className="apple-btn">Log in with Apple</button>
          <button type="button" className="google-btn">Log in with Google</button>
          <button type="button" className="facebook-btn">Log in with Facebook</button>

          {/* Link to your Sign Up page */}
          <div className="signup-prompt">
            Need to create a free account? <a href="#">Sign Up</a> {/* Update link if using React Router */}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;