import React, { useEffect, useState } from 'react';
import '../styles/login.css';

const Login = () => {
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("❌ Passwords do not match!");
      return;
    }

    console.log("✅ Form Submitted:", formData);
  };

  useEffect(() => {
    const dummyExpenses = [
      { amount: 150, category: 'Food' },
      { amount: 200, category: 'Transport' },
      { amount: 100, category: 'Food' },
    ];

    const dummyBudgets = [
      { category: 'Food', limit: 200 },
      { category: 'Transport', limit: 250 },
    ];

    setExpenses(dummyExpenses);
    setBudgets(dummyBudgets);
  }, []);

  useEffect(() => {
    const totals = {};
    const newAlerts = [];

    expenses.forEach(exp => {
      totals[exp.category] = (totals[exp.category] || 0) + exp.amount;
    });

    budgets.forEach(budget => {
      const spent = totals[budget.category] || 0;
      if (spent > budget.limit) {
        newAlerts.push(
          `⚠️ Over budget in ${budget.category}: Spent $${spent} / Limit $${budget.limit}`
        );
      }
    });

    setAlerts(newAlerts);
  }, [expenses, budgets]);

  return (
    <div className="login-page">
      <div className="register-container">
        <h2>Create an Account</h2>
        <p className="subheading">Signup to start managing</p>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="input-container">
            <label>Full Name:</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-container">
            <label>Email Address:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-container">
            <label>Password:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-container">
            <label>Confirm Password:</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit">Register</button>
        </form>

        <div className="alerts-section">
          <h3>Budget Alerts</h3>
          {alerts.length > 0 ? (
            alerts.map((alert, index) => <p key={index}>{alert}</p>)
          ) : (
            <p className="success">✅ All categories are within budget.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
