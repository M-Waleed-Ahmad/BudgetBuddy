import React from 'react';
import Navbar1 from '../components/navbar1';
import Footer1 from '../components/footer1';
import '../styles/dashboard.css';

const faqs = [
  { q: 'Can I use BudgetBuddy with my family?', a: 'Yes. Invite members, set roles, and track shared expenses in a single view.' },
  { q: 'Do you support CSV/PDF exports?', a: 'You can export expenses as CSV or PDF for monthly statements or reimbursements.' },
  { q: 'Is my data secure?', a: 'We use secure authentication, role-based controls, and encrypted connections for all traffic.' },
  { q: 'Can I switch plans anytime?', a: 'You can upgrade or downgrade from the pricing page; entitlements update after checkout.' },
];

const FaqsPage = () => (
  <div className="page-container">
    <Navbar1 />
    <main className="dashboard-content" aria-label="FAQs">
      <header className="page-header">
        <div>
          <h1>FAQs</h1>
          <p className="muted-text">Answers to common questions about BudgetBuddy.</p>
        </div>
      </header>

      <div className="budget-section-dash">
        {faqs.map((item) => (
          <div key={item.q} className="card" style={{ marginBottom: '12px' }}>
            <h3>{item.q}</h3>
            <p className="muted-text">{item.a}</p>
          </div>
        ))}
      </div>
    </main>
    <Footer1 />
  </div>
);

export default FaqsPage;
