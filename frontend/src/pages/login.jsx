import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/login.css';
import { loginUser, forgetPassword } from '../api/api'; // ← make sure this includes forgetPassword
import { toast } from 'react-hot-toast';
import Modal from '../components/Modal'; // ← your existing Modal component

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [forgetFormData, setForgetFormData] = useState({
    email: '',
    recovery_email: '',
    password: '',
  });
  const [isForgetModalOpen, setIsForgetModalOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log("Already logged in, redirecting to:", from);
      navigate(from || '/dashboard', { replace: true });
    }
  }, [navigate, from]);

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value });
  };

  const handleForgetChange = (e) => {
    setForgetFormData({...forgetFormData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await loginUser(formData);
      console.log('✅ Login successful:', data);
      localStorage.setItem('token', data.token);
      toast.success('Login successful!');
      navigate(from, { replace: true });
    } catch (error) {
      console.error('❌ Login error:', error);
      toast.error(error.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleForgetSubmit = async (e) => {
    e.preventDefault();
    try {
      await forgetPassword(
        forgetFormData.email,
        forgetFormData.password,
        forgetFormData.recovery_email
      );
      toast.success('Password reset successfully!');
      setIsForgetModalOpen(false);
      setForgetFormData({ email: '', recovery_email: '', password: '' });
    } catch (error) {
      toast.error(error.message || 'Failed to reset password.');
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

          <div className="forgot-password">
           <a className='forget' onClick={() => setIsForgetModalOpen(true)}>Forgot Password?</a>
          </div>

          <button type="submit" className="primary-btn">Log in</button>

          <div className="or-divider">or</div>

          <button type="button" className="apple-btn">Log in with Apple</button>
          <button type="button" className="google-btn">Log in with Google</button>
          <button type="button" className="facebook-btn">Log in with Facebook</button>

          <div className="signup-prompt">
            Need to create a free account? <a href="/signup">Sign Up</a>
          </div>
        </form>
      </div>

      {/* Forget Password Modal */}
      <Modal isOpen={isForgetModalOpen} onClose={() => setIsForgetModalOpen(false)} title="Reset Your Password">
        <form onSubmit={handleForgetSubmit} className="modal-form">
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            value={forgetFormData.email}
            onChange={handleForgetChange}
            required
          />
          <input
            type="email"
            name="recovery_email"
            placeholder="Recovery Email"
            value={forgetFormData.recovery_email}
            onChange={handleForgetChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="New Password"
            value={forgetFormData.password}
            onChange={handleForgetChange}
            required
          />
          <button type="submit" className="primary-btn">Reset Password</button>
        </form>
      </Modal>
    </div>
  );
};

export default Login;
