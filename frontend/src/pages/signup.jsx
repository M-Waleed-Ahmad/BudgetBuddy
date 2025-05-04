import React, { useState } from 'react';
import { signupUser } from '../api/api'; // assuming you placed it here
import { useNavigate } from 'react-router-dom'; // if you are using react-router for navigation 
import toast, { Toaster } from 'react-hot-toast';
import '../styles/signup.css';

const Signup = () => {
  const navigate = useNavigate(); // if you are using react-router for navigation
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        recovery_email: formData.recoveryEmail,
      };

      const response = await signupUser(payload);
      toast.success('Account created successfully 🎉');
      console.log('✅ Signup successful:', response);
      // Redirect to login or dashboard page after successful signup
      navigate('/login'); // if you are using react-router for navigation
    } catch (error) {
      toast.error(error.message || 'Signup failed!');
    }
  };

  return (
    <div className="signup-page">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="signup-container">
        <h2>Create an Account</h2>
        <p className="signup-subheading">Signup to manage your Finances</p>

        <form onSubmit={handleSubmit} className="signup-form">
          {/* Input Fields */}
          <div className="signup-input-container">
            <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
          </div>

          <div className="signup-input-container">
            <input type="email" name="email" placeholder="Your Email Address" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="signup-input-container">
            <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
          </div>

          <div className="signup-input-container">
            <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required />
          </div>

          <div className="signup-input-row">
            <div className="signup-input-container half">
              <select name="currency" value={formData.currency} onChange={handleChange} required>
                <option value="" disabled>Select Currency</option>
                <option value="USD">USD</option>
                <option value="PKR">PKR</option>
                <option value="EUR">EUR</option>
                <option value="INR">INR</option>
              </select>
            </div>

            <div className="signup-input-container half">
              <input type="text" name="referralCode" placeholder="Referral Code" value={formData.referralCode} onChange={handleChange} />
            </div>
          </div>

          <div className="signup-input-container">
            <input type="email" name="recoveryEmail" placeholder="Recovery Email" value={formData.recoveryEmail} onChange={handleChange} required />
          </div>

          <button type="submit" className="signup-primary-btn">Register</button>

          <div className="signup-divider">or</div>

          <div className="signup-login-prompt">
            Already have an account? <a href="/login">Login</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
