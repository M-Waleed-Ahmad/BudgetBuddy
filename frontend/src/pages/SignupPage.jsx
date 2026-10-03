import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { signupUser } from '../api';
import { useAuth } from '../context/AuthContext';
import { CURRENCIES } from '../utils/format';
import logo from '../assets/logo.png';
import '../styles/auth.css';

const MIN_PASSWORD_LENGTH = 8;

const initialForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  currency: 'USD',
  recoveryEmail: '',
};

const SignupPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!formData.name.trim()) next.name = 'Please enter your name.';
    if (formData.password.length < MIN_PASSWORD_LENGTH) {
      next.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (formData.confirmPassword !== formData.password) next.confirmPassword = 'Passwords do not match.';
    if (
      formData.recoveryEmail.trim() &&
      formData.recoveryEmail.trim().toLowerCase() === formData.email.trim().toLowerCase()
    ) {
      next.recoveryEmail = 'Use a different address from your login email.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const { token, user } = await signupUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        currency_preference: formData.currency,
        recovery_email: formData.recoveryEmail.trim() || undefined,
      });
      login(token, user);
      toast.success('Account created – welcome to BudgetBuddy!');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      if (error.errors) {
        const { name, email, password, recovery_email: recoveryEmail } = error.errors;
        setErrors((prev) => ({ ...prev, name, email, password, recoveryEmail }));
      }
      toast.error(error.message || 'Signup failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  const fieldProps = (name, describedBy) => ({
    name,
    value: formData[name],
    onChange: handleChange,
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? `signup-${name}-error` : describedBy,
  });

  const fieldError = (name) =>
    errors[name] ? (
      <span id={`signup-${name}-error`} className="field-error">
        {errors[name]}
      </span>
    ) : null;

  return (
    <div className="auth-page">
      <main className="auth-card">
        <Link to="/" className="auth-card__brand">
          <img src={logo} alt="" width="32" height="32" />
          BudgetBuddy
        </Link>
        <h1>Create an account</h1>
        <p className="auth-card__subtitle">Sign up to start managing your finances</p>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="signup-name">Full name</label>
            <input id="signup-name" type="text" className="input-field" autoComplete="name" required {...fieldProps('name')} />
            {fieldError('name')}
          </div>

          <div className="form-group">
            <label htmlFor="signup-email">Email address</label>
            <input id="signup-email" type="email" className="input-field" autoComplete="email" required {...fieldProps('email')} />
            {fieldError('email')}
          </div>

          <div className="auth-form__row">
            <div className="form-group">
              <label htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                type="password"
                className="input-field"
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                required
                {...fieldProps('password', 'signup-password-hint')}
              />
              {fieldError('password') || (
                <span id="signup-password-hint" className="field-hint">
                  At least {MIN_PASSWORD_LENGTH} characters.
                </span>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="signup-confirmPassword">Confirm password</label>
              <input
                id="signup-confirmPassword"
                type="password"
                className="input-field"
                autoComplete="new-password"
                required
                {...fieldProps('confirmPassword')}
              />
              {fieldError('confirmPassword')}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="signup-currency">Currency</label>
            <select id="signup-currency" className="select-field" {...fieldProps('currency')}>
              {CURRENCIES.map(({ code, label }) => (
                <option key={code} value={code}>
                  {code} – {label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="signup-recoveryEmail">Recovery email (optional)</label>
            <input
              id="signup-recoveryEmail"
              type="email"
              className="input-field"
              autoComplete="off"
              {...fieldProps('recoveryEmail')}
            />
            {fieldError('recoveryEmail')}
          </div>

          <button type="submit" className="primary-button auth-form__submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-card__footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </main>
    </div>
  );
};

export default SignupPage;
