import React from 'react';
import Navbar1 from '../components/navbar1';
import Footer1 from '../components/footer1';
import '../styles/dashboard.css';

const roles = [
  { title: 'Full-Stack Engineer', location: 'Remote', note: 'Build features across React + Node, including billing and insights.' },
  { title: 'Product Designer', location: 'Hybrid - Lahore', note: 'Craft intuitive flows for budgeting, collaboration, and exports.' },
  { title: 'QA Engineer', location: 'Remote', note: 'Own automated and manual testing for payments, reports, and shared plans.' },
];

const CareersPage = () => (
  <div className="page-container">
    <Navbar1 />
    <main className="dashboard-content" aria-label="Careers">
      <header className="page-header">
        <div>
          <h1>Careers</h1>
          <p className="muted-text">Join us in building the simplest way to manage shared finances.</p>
        </div>
      </header>

      <section className="budget-section-dash">
        <h2>Open Roles</h2>
        <div className="dashboard-grid">
          {roles.map((role) => (
            <div key={role.title} className="card">
              <h3>{role.title}</h3>
              <p className="muted-text">{role.location}</p>
              <p>{role.note}</p>
              <button className="link-button" type="button">Apply now</button>
            </div>
          ))}
        </div>
      </section>

      <section className="budget-section-dash">
        <h2>Life at BudgetBuddy</h2>
        <p className="muted-text">We’re remote-first, async-friendly, and focused on outcomes. Expect collaborative planning, thoughtful reviews, and space to ship.</p>
      </section>
    </main>
    <Footer1 />
  </div>
);

export default CareersPage;
