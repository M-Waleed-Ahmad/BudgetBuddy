import React from 'react';
import Navbar1 from '../components/navbar1';
import Footer1 from '../components/footer1';
import '../styles/dashboard.css';

const AboutPage = () => (
  <div className="page-container">
    <Navbar1 />
    <main className="dashboard-content" aria-label="About BudgetBuddy">
      <header className="page-header">
        <div>
          <h1>About BudgetBuddy</h1>
          <p className="muted-text">We’re building a collaborative, insight-driven platform for everyday finance.</p>
        </div>
      </header>

      <div className="dashboard-grid">
        <div className="card">
          <h3>Our Mission</h3>
          <p className="muted-text">Empower individuals and families to make confident financial decisions with clarity and collaboration.</p>
        </div>
        <div className="card">
          <h3>What We Value</h3>
          <p className="muted-text">Transparency, security, and ease of use. We keep your data safe and your workflows simple.</p>
        </div>
        <div className="card">
          <h3>Our Team</h3>
          <p className="muted-text">A small group of engineers and designers focused on budgeting, UX, and reliability.</p>
        </div>
      </div>
    </main>
    <Footer1 />
  </div>
);

export default AboutPage;
