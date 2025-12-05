import React, { useState } from 'react';
import Navbar1 from '../components/navbar1';
import Footer1 from '../components/footer1';
import '../styles/dashboard.css';

const qa = [
  { q: 'How do I invite family members?', a: 'Go to Shared Budgeting, click Invite, and send an email invite. Choose roles for each member.' },
  { q: 'Where can I export my expenses?', a: 'Use the export buttons on Expense Management or Reports to download CSV/PDF for the selected period.' },
  { q: 'How do I reset my password?', a: 'Use the Forgot Password option on the login screen and follow the email instructions.' },
  { q: 'Is Stripe test mode supported?', a: 'Yes, the integration runs in test mode for development and coursework; switch keys for production later.' },
];

const HelpCenterPage = () => {
  const [open, setOpen] = useState(null);

  return (
    <div className="page-container">
      <Navbar1 />
      <main className="dashboard-content" aria-label="Help Center">
        <header className="page-header">
          <div>
            <h1>Help Center</h1>
            <p className="muted-text">Quick answers and guidance for BudgetBuddy.</p>
          </div>
        </header>

        <section className="budget-section-dash">
          {qa.map((item, idx) => (
            <div key={item.q} className="card" style={{ marginBottom: '10px' }}>
              <button
                className="link-button"
                type="button"
                onClick={() => setOpen(open === idx ? null : idx)}
                aria-expanded={open === idx}
                style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>{item.q}</span>
                <span>{open === idx ? '–' : '+'}</span>
              </button>
              {open === idx && <p className="muted-text" style={{ marginTop: '8px' }}>{item.a}</p>}
            </div>
          ))}
        </section>
      </main>
      <Footer1 />
    </div>
  );
};

export default HelpCenterPage;
