import React from 'react';
import Navbar1 from '../components/navbar1';
import Footer1 from '../components/footer1';
import '../styles/dashboard.css';

const sections = [
  { title: 'Smart Expense Tracking', body: 'Log expenses in seconds, auto-categorize transactions, and keep shared budgets in sync for families or teams.' },
  { title: 'Budgets with Alerts', body: 'Set monthly limits, get proactive nudges before overruns, and review adherence trends across categories.' },
  { title: 'Analytics & Exports', body: 'Visualize cash flow, drill into categories, and export CSV/PDF reports for taxes or audits.' },
  { title: 'Collaboration Ready', body: 'Invite members, manage roles, and keep notifications flowing so everyone stays aligned.' },
];

const FeaturesPage = () => (
  <div className="page-container">
    <Navbar1 />
    <main className="dashboard-content" aria-label="Features">
      <header className="page-header">
        <div>
          <h1>Features</h1>
          <p className="muted-text">Everything you need to manage personal and shared finances confidently.</p>
        </div>
      </header>

      <div className="dashboard-grid">
        {sections.map((s) => (
          <div key={s.title} className="card">
            <h3>{s.title}</h3>
            <p className="muted-text">{s.body}</p>
          </div>
        ))}
      </div>
    </main>
    <Footer1 />
  </div>
);

export default FeaturesPage;
