import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import '../styles/AppFooter.css';

/** Compact footer for authenticated pages. */
const AppFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="app-footer__inner">
        <Link to="/dashboard" className="app-footer__brand">
          <img src={logo} alt="" width="28" height="28" />
          <span>BudgetBuddy</span>
        </Link>
        <nav aria-label="Footer">
          <ul className="app-footer__links">
            <li>
              <Link to="/dashboard">Dashboard</Link>
            </li>
            <li>
              <Link to="/notifications">Notifications</Link>
            </li>
            <li>
              <Link to="/settings">Settings</Link>
            </li>
            <li>
              <Link to="/contact-us">Contact us</Link>
            </li>
          </ul>
        </nav>
        <p className="app-footer__copyright">© {year} BudgetBuddy</p>
      </div>
    </footer>
  );
};

export default AppFooter;
