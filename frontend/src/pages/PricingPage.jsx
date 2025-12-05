import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { createCheckoutSession } from '../api/billing';
import { getMyProfile } from '../api/api';
import '../styles/dashboard.css';

const PricingPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let s = params.get('status');
    if (!s) {
      if (window.location.pathname.includes('/billing/success')) s = 'success';
      if (window.location.pathname.includes('/billing/cancel')) s = 'cancel';
    }
    if (s) {
      setStatus(s);
      if (s === 'success') {
        getMyProfile().catch(() => {});
      }
    }
  }, []);

  const handleUpgrade = async () => {
    setLoading(true); setError(null);
    try {
      const { url } = await createCheckoutSession('family');
      window.location.href = url;
    } catch (err) {
      setError(err.message || 'Failed to start checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Navbar />
      <main className="dashboard-content">
        <div className="pricing-hero">
          <h1>Unlock Family Budgeting</h1>
          <p>Collaborate with your household, share expenses, and stay in sync.</p>
        </div>
        {status === 'success' && <p className="success-message">Upgrade successful. Your account will reflect the new entitlement shortly.</p>}
        {status === 'cancel' && <p className="error-message">Checkout was cancelled. Try again anytime.</p>}
        <div className="pricing-cards">
          <div className="pricing-card">
            <h3>Free</h3>
            <p className="price">$0</p>
            <ul>
              <li>Personal budgets</li>
              <li>Expense tracking</li>
              <li>Smart insights</li>
            </ul>
          </div>
          <div className="pricing-card highlight">
            <h3>Family</h3>
            <p className="price">$9<span>/mo</span></p>
            <ul>
              <li>Everything in Free</li>
              <li>Family budgets & approvals</li>
              <li>Shared notifications</li>
            </ul>
            <button className="link-button" onClick={handleUpgrade} disabled={loading}>
              {loading ? 'Redirecting...' : 'Upgrade'}
            </button>
            {error && <p className="error-message small">{error}</p>}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PricingPage;
