import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { resetPassword } from '../api';
import logo from '../assets/logo.png';
import '../styles/auth.css';

const MIN_PASSWORD_LENGTH = 8;

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [tokenError, setTokenError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const next = {};
    if (password.length < MIN_PASSWORD_LENGTH) next.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    if (confirmPassword !== password) next.confirmPassword = 'Passwords do not match.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await resetPassword(token, password);
      toast.success('Your password has been reset. You can now log in.');
      navigate('/login', { replace: true });
    } catch (error) {
      if (error.status === 400 || error.status === 404) {
        setTokenError(error.message || 'This reset link is invalid or has expired.');
      } else {
        toast.error(error.message || 'Could not reset your password. Please try again.');
      }
      setIsSubmitting(false);
    }
  };

  const invalidLink = !token || tokenError;

  return (
    <div className="auth-page">
      <main className="auth-card">
        <Link to="/" className="auth-card__brand">
          <img src={logo} alt="" width="32" height="32" />
          BudgetBuddy
        </Link>
        <h1>Choose a new password</h1>

        {invalidLink ? (
          <>
            <p className="error-message" role="alert">
              {tokenError || 'This password reset link is missing its token.'} Please request a new link from the
              login page.
            </p>
            <Link to="/login" className="primary-button auth-form__submit">
              Back to login
            </Link>
          </>
        ) : (
          <>
            <p className="auth-card__subtitle">Reset links are valid for 30 minutes.</p>
            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <div className="form-group">
                <label htmlFor="reset-password">New password</label>
                <input
                  id="reset-password"
                  type="password"
                  className="input-field"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={MIN_PASSWORD_LENGTH}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby="reset-password-help"
                  required
                />
                <span id="reset-password-help" className={errors.password ? 'field-error' : 'field-hint'}>
                  {errors.password || `At least ${MIN_PASSWORD_LENGTH} characters.`}
                </span>
              </div>
              <div className="form-group">
                <label htmlFor="reset-confirm">Confirm new password</label>
                <input
                  id="reset-confirm"
                  type="password"
                  className="input-field"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-describedby={errors.confirmPassword ? 'reset-confirm-error' : undefined}
                  required
                />
                {errors.confirmPassword && (
                  <span id="reset-confirm-error" className="field-error">
                    {errors.confirmPassword}
                  </span>
                )}
              </div>
              <button type="submit" className="primary-button auth-form__submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Reset password'}
              </button>
            </form>
          </>
        )}

        <p className="auth-card__footer">
          Remembered it? <Link to="/login">Back to login</Link>
        </p>
      </main>
    </div>
  );
};

export default ResetPasswordPage;
