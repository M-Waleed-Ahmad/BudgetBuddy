import React from 'react';
import { motion } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import '../../styles/BudgetManagementPage.css'; // We'll create this CSS file
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';

// Placeholder Icons (Replace with actual SVGs or an icon library)
const EditIcon = ({ size = 18 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }}>✎</span>; // Pencil emoji
const DeleteIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }}>🗑️</span>;
const RefreshIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }}>🔄</span>;


const BudgetManagementPage = () => {

  // --- ECharts Donut Chart Options ---
  const budgetChartOptions = {
    tooltip: { // Basic tooltip on hover
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: { // Hide the default legend
      show: false
    },
    series: [
      {
        name: 'Budget Usage',
        type: 'pie',
        radius: ['65%', '85%'], // Make it a donut chart
        avoidLabelOverlap: false,
        label: { // Hide connector lines and labels on slices
            show: false,
            position: 'center' // We won't show the center label from echarts, but keep the setting
        },
        emphasis: { // Style on hover
          label: {
            show: false, // Keep label hidden on hover too
          },
           itemStyle: {
             shadowBlur: 10,
             shadowOffsetX: 0,
             shadowColor: 'rgba(0, 0, 0, 0.2)'
           }
        },
        labelLine: { // Hide connector lines
          show: false
        },
        data: [
          { value: 5000, name: 'Used', itemStyle: { color: '#34c759' } }, // Green for used
          { value: 5000, name: 'Remaining', itemStyle: { color: '#ff3b30' } } // Red for remaining part (opposite of image, adjust if needed)
         ],
        silent: false, // Allow hover events
        animationType: 'scale',
        animationEasing: 'elasticOut',
        animationDelay: function (idx) {
           return Math.random() * 200;
        }
      }
    ]
  };

  // --- Dummy Data ---
  const budgetItems = Array(8).fill({ // Repeat data 8 times as per image
    id: '001',
    category: 'Food',
    amount: 'Rs.2000',
    description: 'Grocery'
  });

  const categoryData = [
    { name: 'Food', used: 1000, total: 5000 },
    { name: 'Travel', used: 500, total: 5000 },
    { name: 'Study', used: 2000, total: 5000 },
  ];

  // --- Animation Variants ---
  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } },
  };

  const itemVariants = {
      hidden: { opacity: 0, y: 10 },
      visible: { opacity: 1, y: 0 }
  };


  return (
    <>
        <Navbar /> {/* Include Navbar component */}
        <motion.div
        className="budget-page-container"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        >
        {/* --- Top Summary Section --- */}
        <motion.section className="budget-summary-section" variants={itemVariants}>
            <div className="budget-details">
            <h3>
                Budget For This Month <EditIcon size={16} />
            </h3>
            <p>Total Budget : Rs 5000</p>
            <p>Today: March 1, 2025</p>
            <p>Start Date: March 5, 2025</p>
            <p>End Date: April 5, 2025</p>
            </div>
            <div className="budget-chart-container">
            <div className="chart-text">
                <h4>Monthly Budget</h4>
                <p>Budget Usage (5000 / 10000)</p>
            </div>
            <ReactECharts
                option={budgetChartOptions}
                style={{ height: '150px', width: '100%' }} // Adjust height as needed
                notMerge={true}
                lazyUpdate={true}
                theme={"light"} // Optional: specify theme
            />
            {/* Placeholder side texts - could be dynamically generated if needed */}
            <span className="chart-side-text left">50%</span>
            <span className="chart-side-text right">50%</span>
            </div>
        </motion.section>

        {/* --- Main Content Section --- */}
        <motion.section className="budget-main-content" variants={sectionVariants}>
            <motion.button
            className="add-budget-button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            variants={itemVariants}
            >
            Add a Budget
            </motion.button>

            {/* --- Filter Bar --- */}
            <motion.div className="filter-bar" variants={itemVariants}>
            <input type="text" placeholder="Search By Description" className="filter-input" />
            <div className="filter-group">
                <label htmlFor="filter-category">Filter By Category:</label>
                <select id="filter-category" className="filter-select">
                <option value="">Category</option>
                <option value="food">Food</option>
                <option value="travel">Travel</option>
                <option value="study">Study</option>
                {/* Add more categories */}
                </select>
            </div>
            <div className="filter-group">
                <label htmlFor="filter-amount">Filter By Amount:</label>
                <select id="filter-amount" className="filter-select">
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
                </select>
            </div>
            <button className="refresh-button">
                Refresh <RefreshIcon />
            </button>
            </motion.div>

            {/* --- Table and Breakdown Wrapper --- */}
            <div className="table-breakdown-wrapper">
            {/* --- Budget Table --- */}
            <motion.div className="budget-table-container" variants={itemVariants}>
                <table className="budget-table">
                <thead>
                    <tr>
                    <th>Budget ID</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Description</th>
                    <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {budgetItems.map((item, index) => (
                    <tr key={index}>
                        <td>{item.id}</td>
                        <td>{item.category}</td>
                        <td>{item.amount}</td>
                        <td>{item.description}</td>
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

            {/* --- Category Breakdown --- */}
            <motion.div className="category-breakdown" variants={itemVariants}>
                <h4>Category Breakdown</h4>
                {categoryData.map((cat, index) => (
                <div className="category-item" key={index}>
                    <div className="category-info">
                    <span>{cat.name}:</span>
                    <span>{cat.used} / {cat.total}</span>
                    </div>
                    <div className="progress-bar-container">
                    <motion.div
                        className="progress-bar-filled"
                        initial={{ width: 0 }}
                        animate={{ width: `${(cat.used / cat.total) * 100}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    ></motion.div>
                    </div>
                </div>
                ))}
            </motion.div>
            </div>
        </motion.section>
        </motion.div>
        <Footer /> {/* Include Footer component */}
    </>
  );
};

export default BudgetManagementPage;