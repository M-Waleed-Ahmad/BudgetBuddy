import React, { useEffect, useState } from 'react';

const LogicPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // Sample dummy data
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

  // Logic to calculate totals and check budget limits
  useEffect(() => {
    const totals = {};
    const newAlerts = [];

    // Calculate total per category
    expenses.forEach(exp => {
      totals[exp.category] = (totals[exp.category] || 0) + exp.amount;
    });

    // Compare against budgets
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
    <div className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow-md space-y-4">
      <h2 className="text-xl font-bold">Logic Page: Budget Analysis</h2>

      <div>
        <h3 className="font-semibold">Expenses:</h3>
        {expenses.map((exp, index) => (
          <p key={index}>💸 {exp.category}: ${exp.amount}</p>
        ))}
      </div>

      <div>
        <h3 className="font-semibold">Alerts:</h3>
        {alerts.length > 0 ? (
          alerts.map((alert, index) => <p key={index}>{alert}</p>)
        ) : (
          <p>✅ All categories are within budget.</p>
        )}
      </div>
    </div>
  );
};

export default LogicPage;
