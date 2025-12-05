import React from 'react';
import Navbar1 from '../components/navbar1';
import Footer1 from '../components/footer1';
import '../styles/dashboard.css';

const TermsPage = () => (
  <div className="page-container">
    <Navbar1 />
    <main className="dashboard-content" aria-label="Terms and conditions">
      <header className="page-header">
        <div>
          <h1>Terms of Service</h1>
          <p className="muted-text">Your agreement for using BudgetBuddy.</p>
        </div>
      </header>

      <section className="budget-section-dash">
        <h2>Acceptance of Terms</h2>
        <p className="muted-text">By using BudgetBuddy you agree to these placeholder terms. Replace with your final legal copy.</p>
      </section>
      <section className="budget-section-dash">
        <h2>Use of Service</h2>
        <p className="muted-text">Use BudgetBuddy responsibly for personal or shared finance management. Do not misuse or attempt to break security.</p>
      </section>
      <section className="budget-section-dash">
        <h2>Limitations</h2>
        <p className="muted-text">We provide budgeting utilities as-is for coursework; add your liability and warranty terms here.</p>
      </section>
      <section className="budget-section-dash">
        <h2>Changes</h2>
        <p className="muted-text">We may update these terms; continued use indicates acceptance. Provide notice policy in production.</p>
      </section>
    </main>
    <Footer1 />
  </div>
);

export default TermsPage;
