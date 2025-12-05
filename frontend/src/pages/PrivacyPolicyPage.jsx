import React from 'react';
import Navbar1 from '../components/navbar1';
import Footer1 from '../components/footer1';
import '../styles/dashboard.css';

const PrivacyPolicyPage = () => (
  <div className="page-container">
    <Navbar1 />
    <main className="dashboard-content" aria-label="Privacy policy">
      <header className="page-header">
        <div>
          <h1>Privacy Policy</h1>
          <p className="muted-text">How we handle your data across BudgetBuddy.</p>
        </div>
      </header>

      <section className="budget-section-dash">
        <h2>Introduction</h2>
        <p className="muted-text">This placeholder summarizes how we collect, use, and protect information. Replace with your finalized policy.</p>
      </section>
      <section className="budget-section-dash">
        <h2>Data We Collect</h2>
        <p className="muted-text">Account details, expenses, budgets, and interaction data used to improve insights and collaboration.</p>
      </section>
      <section className="budget-section-dash">
        <h2>How We Use Your Data</h2>
        <p className="muted-text">To provide budgeting features, analytics, notifications, and to support customer success.</p>
      </section>
      <section className="budget-section-dash">
        <h2>Security</h2>
        <p className="muted-text">We apply secure authentication, role-based access, and encrypted connections. Add your full security stance here.</p>
      </section>
    </main>
    <Footer1 />
  </div>
);

export default PrivacyPolicyPage;
