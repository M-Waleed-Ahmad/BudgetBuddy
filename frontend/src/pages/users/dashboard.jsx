import React from "react";
import { motion } from "framer-motion";
import CategoryAnalyticsChart from "../../components/ExpenseChart-dash.jsx";
import Navbar from "../../components/navbar";
import '../../styles/dashboard.css';

const Dashboard = () => {
  // Test user
  const user = {
    fullName: "Waleed Ahmad"
  };

  // Sample recent expenses
  const recentExpenses = [
    {
      date: "March 12, 2025",
      title: "Food Store",
      amount: 2400
    },
    {
      date: "March 10, 2025",
      title: "Fuel",
      amount: 3500
    },
    {
      date: "March 05, 2025",
      title: "Groceries",
      amount: 1800
    }
  ];

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        <motion.h1
          className="dashboard-title"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          Welcome Back, Mr {user.fullName}
        </motion.h1>

        <motion.h2
          className="section-title"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Recent Expenses
        </motion.h2>

        <div className="dashboard-content">
          <motion.div
            className="expenses-list"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {recentExpenses.map((expense, index) => (
              <motion.div
                key={index}
                className="expense-card"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <p className="expense-date">{expense.date}</p>
                <p className="expense-title">{expense.title}</p>
                <p className="expense-amount">Rs.{expense.amount}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* ✅ FIXED: Class name updated to match CSS */}
          <motion.div
            className="chart-container"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <CategoryAnalyticsChart />
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
