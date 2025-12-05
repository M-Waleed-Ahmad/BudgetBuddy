import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { confirmCheckoutSession } from '../api/billing';
import { getMyProfile } from '../api/api';

const BillingSuccess = () => {
  const [status, setStatus] = useState('pending');
  const [message, setMessage] = useState('Activating your subscription...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id') || params.get('sessionId');
    if (!sessionId) {
      setStatus('error');
      setMessage('Missing session information. Please contact support.');
      return;
    }

    const confirm = async () => {
      try {
        await confirmCheckoutSession(sessionId);
        await getMyProfile().catch(() => {});
        setStatus('success');
        setMessage('Subscription activated. You now have premium access.');
      } catch (err) {
        console.error(err);
        setStatus('error');
        setMessage(err?.message || 'Unable to activate subscription. Please try again or contact support.');
      }
    };

    confirm();
  }, []);

  return (
    <div className="page-container">
      <Navbar />
      <main className="dashboard-content">
        <h1>Checkout Success</h1>
        <p className={status === 'error' ? 'error-message' : 'success-message'}>
          {message}
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default BillingSuccess;
