import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiMail } from 'react-icons/fi';
import { subscribeToNewsletter } from '../api';
import logo from '../assets/logo.png';
import '../styles/PublicFooter.css';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Footer for the public marketing pages, including the newsletter sign-up. */
const PublicFooter = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputId = useId();
  const errorId = useId();
  const year = new Date().getFullYear();

  const handleSubscribe = async (event) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const result = await subscribeToNewsletter(trimmed);
      toast.success(result?.message || 'Thanks for subscribing!');
      setEmail('');
    } catch (err) {
      if (err.status === 409) {
        toast.success("You're already subscribed – thanks for sticking with us!");
        setEmail('');
      } else {
        toast.error(err.message || 'Could not subscribe right now. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="landing-footer">
      <section className="landing-footer__newsletter" aria-labelledby={`${inputId}-title`}>
        <h2 id={`${inputId}-title`}>Subscribe to our newsletter</h2>
        <form className="landing-footer__form" onSubmit={handleSubscribe} noValidate>
          <label htmlFor={inputId} className="visually-hidden">
            Email address
          </label>
          <div className={`landing-footer__input${error ? ' has-error' : ''}`}>
            <FiMail className="landing-footer__mail-icon" aria-hidden="true" />
            <input
              id={inputId}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
            />
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Subscribing…' : 'Subscribe'}
            </button>
          </div>
          {error && (
            <p id={errorId} className="landing-footer__error" role="alert">
              {error}
            </p>
          )}
        </form>
      </section>

      <div className="landing-footer__main">
        <Link to="/" className="landing-footer__brand">
          <img src={logo} alt="" className="landing-footer__logo" width="40" height="40" />
          <span>BudgetBuddy</span>
        </Link>
        <nav aria-label="Footer">
          <ul className="landing-footer__links">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/contact-us">Contact us</Link>
            </li>
            <li>
              <Link to="/signup">Create an account</Link>
            </li>
            <li>
              <Link to="/login">Log in</Link>
            </li>
          </ul>
        </nav>
      </div>

      <p className="landing-footer__copyright">© {year} BudgetBuddy. All rights reserved.</p>
    </footer>
  );
};

export default PublicFooter;
