import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { forgotPassword, loginUser } from '../api';
import { useAuth } from '../context/AuthContext';
import { getPostLoginPath } from '../utils/navigation';
import Modal from '../components/Modal';
import logo from '../assets/logo.png';
import '../styles/auth.css';

/** Only render dev reset links that are plain http(s) URLs. */
function safeHttpUrl(value) {
  try {
    const url = new URL(value, window.location.origin);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

const ForgotPasswordModal = ({ isOpen, onClose, initialEmail }) => {
  const [email, setEmail] = useState(initialEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await forgotPassword(email.trim());
      setResult({
        message:
          response?.message ||
          'If an account exists for that email, we have sent a link to reset your password.',
        devResetUrl: response?.devResetUrl ? safeHttpUrl(response.devResetUrl) : null,
      });
    } catch (error) {
      toast.error(error.message || 'Could not send the reset link. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reset your password">
      {result ? (
        <div>
          <p className="success-message" role="status">
            {result.message}
          </p>
          {result.devResetUrl && (
            <p className="info-message auth-dev-link">
              Development mode (no email server configured):{' '}
              <a href={result.devResetUrl}>open the password reset link</a>.
            </p>
          )}
          <div className="form-actions">
            <button type="button" className="primary-button" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="modal-form">
          <p className="confirmation-text">
            Enter the email address you signed up with and we&apos;ll send you a link to choose a new password.
          </p>
          <div className="form-group">
            <label htmlFor="forgot-email">Email address</label>
            <input
              id="forgot-email"
              type="email"
              className="input-field"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Sending…' : 'Send reset link'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const { token, user } = await loginUser({ email: formData.email.trim(), password: formData.password });
      login(token, user);
      toast.success(`Welcome back${user?.name ? `, ${user.name}` : ''}!`);
      navigate(getPostLoginPath(location), { replace: true });
    } catch (error) {
      toast.error(error.message || 'Login failed. Please check your credentials.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <main className="auth-card">
        <Link to="/" className="auth-card__brand">
          <img src={logo} alt="" width="32" height="32" />
          BudgetBuddy
        </Link>
        <h1>Access your account</h1>
        <p className="auth-card__subtitle">Log in to manage your finances</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              name="email"
              className="input-field"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              name="password"
              className="input-field"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-form__inline">
            <button type="button" className="link-button" onClick={() => setIsForgotOpen(true)}>
              Forgot password?
            </button>
          </div>

          <button type="submit" className="primary-button auth-form__submit" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="auth-card__footer">
          Need an account? <Link to="/signup">Sign up for free</Link>
        </p>
      </main>

      {isForgotOpen && (
        <ForgotPasswordModal isOpen onClose={() => setIsForgotOpen(false)} initialEmail={formData.email} />
      )}
    </div>
  );
};

export default LoginPage;
