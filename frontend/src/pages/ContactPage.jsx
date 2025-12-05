import React, { useState } from 'react';
import Navbar1 from '../components/navbar1';
import Footer1 from '../components/footer1';
import '../styles/dashboard.css';

const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (!form.email.trim() || !/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(form.email)) next.email = 'Valid email required';
    if (!form.subject.trim()) next.subject = 'Subject is required';
    if (!form.message.trim()) next.message = 'Message is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    console.log('TODO: send contact form to backend', form);
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="page-container">
      <Navbar1 />
      <main className="dashboard-content" aria-label="Contact BudgetBuddy">
        <header className="page-header">
          <div>
            <h1>Contact us</h1>
            <p className="muted-text">We’d love to hear from you. Fill out the form and we’ll respond soon.</p>
          </div>
        </header>

        <section className="budget-section-dash">
          <form className="card" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label>Name</label>
              <input name="name" value={form.name} onChange={onChange} className="form-control input" />
              {errors.name && <p className="error-message small">{errors.name}</p>}
            </div>
            <div className="form-group">
              <label>Email</label>
              <input name="email" value={form.email} onChange={onChange} className="form-control input" />
              {errors.email && <p className="error-message small">{errors.email}</p>}
            </div>
            <div className="form-group">
              <label>Subject</label>
              <input name="subject" value={form.subject} onChange={onChange} className="form-control input" />
              {errors.subject && <p className="error-message small">{errors.subject}</p>}
            </div>
            <div className="form-group">
              <label>Message</label>
              <textarea name="message" value={form.message} onChange={onChange} className="form-control input" rows="4" />
              {errors.message && <p className="error-message small">{errors.message}</p>}
            </div>
            <button type="submit" className="link-button">Send message</button>
          </form>
        </section>
      </main>
      <Footer1 />
    </div>
  );
};

export default ContactPage;
