import { useEffect, useId, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiGrid, FiLogIn, FiMenu, FiUserPlus, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import '../styles/PublicNavbar.css';

const NAV_LINKS = [
  { name: 'Home', path: '/' },
  { name: 'Contact Us', path: '/contact-us' },
];

const underlineSpring = { type: 'spring', stiffness: 500, damping: 30 };

const mobileMenuVariants = {
  closed: { opacity: 0, y: -12, transition: { duration: 0.15, ease: 'easeOut' } },
  open: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeIn' } },
};

/** Navbar for the public marketing pages (landing, contact). */
const PublicNavbar = () => {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuId = useId();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isMobileMenuOpen]);

  const actionLinks = isAuthenticated
    ? [{ name: 'Dashboard', path: '/dashboard', icon: FiGrid, className: 'landing-navbar__cta' }]
    : [
        { name: 'Sign up', path: '/signup', icon: FiUserPlus, className: 'landing-navbar__secondary' },
        { name: 'Log in', path: '/login', icon: FiLogIn, className: 'landing-navbar__cta' },
      ];

  const renderActions = () =>
    actionLinks.map((link) => (
      <Link key={link.path} to={link.path} className={link.className}>
        <link.icon aria-hidden="true" />
        {link.name}
      </Link>
    ));

  return (
    <header className="landing-navbar">
      <div className="landing-navbar__left">
        <Link to="/" className="landing-navbar__brand">
          <img src={logo} alt="" className="landing-navbar__logo" width="40" height="40" />
          <span className="landing-navbar__brand-name">BudgetBuddy</span>
        </Link>
        <nav aria-label="Main">
          <ul className="landing-navbar__links">
            {NAV_LINKS.map((link) => (
              <li key={link.path}>
                <NavLink
                  to={link.path}
                  end
                  className={({ isActive }) => `landing-navbar__link${isActive ? ' is-active' : ''}`}
                >
                  {({ isActive }) => (
                    <>
                      {link.name}
                      {isActive && (
                        <motion.span
                          className="landing-navbar__underline"
                          layoutId="landing-navbar-underline"
                          initial={false}
                          transition={underlineSpring}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="landing-navbar__right">
        <div className="landing-navbar__actions">{renderActions()}</div>
        <button
          type="button"
          className="landing-navbar__menu-toggle"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMobileMenuOpen}
          aria-controls={mobileMenuId}
        >
          {isMobileMenuOpen ? <FiX size={26} aria-hidden="true" /> : <FiMenu size={26} aria-hidden="true" />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.nav
            id={mobileMenuId}
            className="landing-navbar__mobile"
            aria-label="Main"
            initial="closed"
            animate="open"
            exit="closed"
            variants={mobileMenuVariants}
          >
            <ul>
              {NAV_LINKS.map((link) => (
                <li key={link.path}>
                  <NavLink
                    to={link.path}
                    end
                    className={({ isActive }) => `landing-navbar__mobile-link${isActive ? ' is-active' : ''}`}
                  >
                    {link.name}
                  </NavLink>
                </li>
              ))}
            </ul>
            <div className="landing-navbar__mobile-actions">{renderActions()}</div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};

export default PublicNavbar;
