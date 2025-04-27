import React from 'react';
import { motion } from 'framer-motion';
import Footer from '../../components/footer'; // Using provided import path
import Navbar from '../../components/navbar'; // Using provided import path
import '../../styles/ExpenseManagementPage.css'; // CSS file for this page

// Placeholder Icons
const EditIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }}>✎</span>;
const DeleteIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }}>🗑️</span>;
const RefreshIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }}>🔄</span>;
const LightbulbIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px` }}>💡</span>;
const WalletIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px` }}>💰</span>;
const CalendarIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px` }}>📅</span>;


const ExpenseManagementPage = () => {

  // Dummy Data
  const expenseItems = Array(7).fill({
    id: '001',
    date: '12-23-2024',
    category: 'Food',
    description: 'Grocery',
    amount: 'Rs.2000',
    notes: 'This section will be reserved for notes added at the time of creation of expenses.',
  });

  const categoryData = [
    { name: 'Food', used: 1000, total: 5000 },
    { name: 'Travel', used: 500, total: 5000 },
    { name: 'Study', used: 2000, total: 5000 },
  ];

  const budgetSpentPercentage = 40;

  // Animation Variants
  const pageVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
  };

  return (
    <div className="page-container">
      <Navbar />
      <motion.main
        className="expense-page-content"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        {/* --- Top Summary Section --- */}
        <motion.section className="expense-summary-section" variants={itemVariants}>
          {/* Budget Summary */}
          <div className="summary-card budget-summary-card">
            <h4>Budget Summary</h4>
            <p><WalletIcon size={14} /> Total Budget : Rs 5000</p>
            <p><WalletIcon size={14} /> Budget Remaining : Rs 5000</p>
            <p><CalendarIcon size={14} /> Days To Go : 15 Days</p>
            <div className="budget-progress-bar-container">
              <motion.div
                className="budget-progress-bar-filled"
                initial={{ width: 0 }}
                animate={{ width: `${budgetSpentPercentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                 <span className="progress-percentage">{budgetSpentPercentage}%</span>
              </motion.div>
            </div>
            <div className="progress-labels">
                <span>Spent</span>
                <span>Remaining</span>
            </div>
          </div>

          {/* Insight */}
          <div className="summary-card insight-card">
            <h4>Insight <LightbulbIcon /></h4>
            <p>Your budget health needs a check!</p>
            <a href="#analyze" className="analyze-link">Click to analyze <EditIcon size={12}/></a>
          </div>

          {/* Category Breakdown */}
          <div className="summary-card category-breakdown-card">
             <h4>Category Breakdown</h4>
             {categoryData.map((cat, index) => (
               <div className="category-item" key={index}>
                 <div className="category-info">
                   <span>{cat.name}:</span>
                   <span>{cat.used} / {cat.total}</span>
                 </div>
                 <div className="breakdown-progress-bar-container">
                   <motion.div
                     className="breakdown-progress-bar-filled"
                     initial={{ width: 0 }}
                     animate={{ width: `${(cat.used / cat.total) * 100}%` }}
                     transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 * index }}
                   ></motion.div>
                 </div>
               </div>
             ))}
          </div>
        </motion.section>

        {/* --- Add Expense Button --- */}
        <motion.button
          className="add-expense-button full-width-button"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          variants={itemVariants}
        >
          Add an Expense
        </motion.button>

        {/* --- Filter and Export Bar --- */}
        <motion.div className="filter-export-bar" variants={itemVariants}>
          <div className="filter-controls">
            <input type="text" placeholder="Search By Description" className="filter-input" />
            <div className="filter-group">
              <label htmlFor="filter-category-exp">Filter By Category:</label>
              <select id="filter-category-exp" className="filter-select">
                <option value="">Category</option>
                <option value="food">Food</option>
                <option value="travel">Travel</option>
                {/* Add categories */}
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="filter-amount-exp">Filter By Amount:</label>
              <select id="filter-amount-exp" className="filter-select">
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
            <button className="refresh-button icon-text-button">
              Refresh <RefreshIcon />
            </button>
          </div>
          <motion.button
            className="export-button secondary-button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Export
          </motion.button>
        </motion.div>

        {/* --- Expense Table --- */}
        <motion.div className="expense-table-container" variants={itemVariants}>
          <table className="expense-table data-table">
            <thead>
              <tr>
                <th>Expense ID</th>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th className="notes-column">Notes</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {expenseItems.map((item, index) => (
                <tr key={index}>
                  <td>{item.id}</td>
                  <td>{item.date}</td>
                  <td>{item.category}</td>
                  <td>{item.description}</td>
                  <td>{item.amount}</td>
                  <td className="notes-column">
                      {item.notes}
                      <a href="#readmore" className="read-more-link">Read More...</a>
                  </td>
                  <td className="action-cell">
                    <motion.button whileTap={{ scale: 0.9 }} className="icon-button">
                      <EditIcon size={16} />
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.9 }} className="icon-button">
                      <DeleteIcon size={16} />
                    </motion.button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </motion.main>
      <Footer />
    </div>
  );
};

export default ExpenseManagementPage;