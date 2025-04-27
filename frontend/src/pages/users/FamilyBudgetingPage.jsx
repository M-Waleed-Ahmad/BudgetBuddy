import React from 'react';
import { motion } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import Navbar from '../../components/navbar'; // Using provided import path
import Footer from '../../components/footer'; // Using provided import path
import '../../styles/FamilyBudgetingPage.css';       // CSS for this page
import userAvatarPlaceholder from '../../assets/avatar.png'; // Placeholder if member image missing

// Placeholder Icons
const EditIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }}>✎</span>;
const DeleteIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }}>🗑️</span>;
const RefreshIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }}>🔄</span>;
const AddIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }}>➕</span>;
const WalletIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px` }}>💰</span>;
const UserIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px` }}>👤</span>;


const FamilyBudgetingPage = ({ userRole = 'viewer' }) => { // Default to 'viewer' if no role passed

    // --- Dummy Data ---
    const totalBudget = 2400;
    const spentAmount = 2400; // Example where spent = total
    const remainingAmount = totalBudget - spentAmount;
    const spentPercentage = totalBudget > 0 ? Math.round((spentAmount / totalBudget) * 100) : 0;

    const familyMembers = Array(6).fill({
        id: '001',
        avatar: userAvatarPlaceholder, // Use imported placeholder
        name: "First Name",
        email: "LastName@",
        budget: "Rs.xxx",
        status: "Active",
        role: "Viewer", // Example role display
    });

    const familyExpenses = Array(7).fill({
        id: '001',
        date: '12-23-2024',
        member: 'GH', // Initials or name
        category: 'Food',
        description: 'Grocery',
        amount: 'Rs.2000',
        status: 'Pending Approval',
    });

    const personalExpenses = Array(5).fill({
        id: '001',
        date: '12-23-2024',
        category: 'Food',
        description: 'Grocery',
        amount: 'Rs.2000',
        status: 'Pending Approval',
    });

    // --- ECharts Options ---
    const mainBarChartOptions = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { data: ['Budget Amount', 'Expense Amount'], bottom: 0 },
        grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
        xAxis: { type: 'category', data: ['Category1', 'Category2', 'Category3', 'Category4', 'Category5', 'Category6'], axisTick: { alignWithLabel: true } },
        yAxis: { type: 'value' },
        series: [
            { name: 'Budget Amount', type: 'bar', barWidth: '40%', data: [500, 800, 1200, 600, 900, 700], itemStyle: { color: '#34c759' } }, // Green
            { name: 'Expense Amount', type: 'bar', barWidth: '40%', data: [400, 900, 1000, 500, 750, 800], itemStyle: { color: '#ff3b30' } }  // Red
        ]
    };

    const personalPieChartOptions = {
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { data: ['Your Spending', 'Remaining Budget'], bottom: 0 },
        series: [{
            name: 'Contribution', type: 'pie', radius: ['40%', '70%'], avoidLabelOverlap: false,
            label: { show: false }, emphasis: { label: { show: false } }, labelLine: { show: false },
            data: [
                { value: 1500, name: 'Your Spending', itemStyle: { color: '#007bff' } }, // Blue
                { value: 3500, name: 'Remaining Budget', itemStyle: { color: '#ff7f0e' } } // Orange
            ]
        }]
    };

     const personalBarChartOptions = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { data: ['Budget', 'Expense'], bottom: 0 },
        grid: { top:'15%', left: '3%', right: '4%', bottom: '10%', containLabel: true },
        xAxis: { type: 'category', data: ['Cat A', 'Cat B', 'Cat C'], axisTick: { alignWithLabel: true } },
        yAxis: { type: 'value' },
        series: [
            { name: 'Budget', type: 'bar', barWidth: '30%', data: [600, 500, 700], itemStyle: { color: '#007bff' } }, // Blue
            { name: 'Expense', type: 'bar', barWidth: '30%', data: [500, 450, 800], itemStyle: { color: '#ff7f0e' } }  // Orange
        ]
    };

    // --- Animation Variants ---
    const pageVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
    const itemVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } } };

    return (
        <div className="page-container">
            <Navbar />
            <motion.main
                className="family-budget-page-content"
                variants={pageVariants}
                initial="hidden"
                animate="visible"
            >
                {/* --- Family Budget Overview --- */}
                <motion.section className="content-section overview-section" variants={itemVariants}>
                    <div className="section-header space-between">
                        <h2>Family Budget Overview</h2>
                        {/* Admin-only buttons */}
                        {userRole === 'admin' && (
                            <div className="header-actions">
                                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="secondary-button small-button">Change Plan</motion.button>
                                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="primary-button small-button">Add new Plan</motion.button>
                            </div>
                        )}
                    </div>

                    {/* Stats Boxes */}
                    <div className="stats-boxes">
                        <div className="stat-box"><span>Total Budget</span>Rs.{totalBudget}</div>
                        <div className="stat-box"><span>Spent Amount</span>Rs.{spentAmount}</div>
                        <div className="stat-box"><span>Remaining Amount</span>Rs.{remainingAmount}</div>
                    </div>

                    {/* Progress Bar */}
                    <div className="budget-progress-bar-container pill-progress">
                        <motion.div
                            className="budget-progress-bar-filled primary-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${spentPercentage}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                        <span className="progress-percentage inside">{spentPercentage}%</span>
                    </div>
                    <div className="progress-labels">
                        <span>Spent</span>
                        <span>Remaining</span>
                    </div>

                    {/* Main Bar Chart */}
                    <div className="chart-container main-chart">
                         <h4>Budget vs. Expense by Category</h4>
                        <ReactECharts option={mainBarChartOptions} style={{ height: '300px', width: '100%' }} />
                    </div>
                </motion.section>

                {/* --- Family Members (Admin Only) --- */}
                {userRole === 'admin' && (
                    <motion.section className="content-section" variants={itemVariants}>
                        <div className="section-header">
                             <h2>Family Members</h2>
                         </div>
                         {/* Filter Bar */}
                        <div className="filter-export-bar compact-bar">
                            <div className="filter-controls">
                                <input type="text" placeholder="Search By Email" className="filter-input small-input" />
                                <div className="filter-group">
                                    <label>Filter By Status:</label>
                                    <select className="filter-select small-select"><option value="">Status</option></select>
                                </div>
                                <div className="filter-group">
                                    <label>Filter By Amount:</label>
                                    <select className="filter-select small-select"><option value="asc">Ascending</option></select>
                                </div>
                                <button className="refresh-button icon-text-button small-button">Refresh <RefreshIcon size={14}/></button>
                            </div>
                            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="primary-button small-button"><UserIcon size={14}/> Add new User</motion.button>
                        </div>
                        {/* Members Table */}
                        <div className="data-table-container">
                            <table className="data-table members-table">
                                <thead>
                                    <tr>
                                        <th>ID</th><th></th><th>Name</th><th>Email</th><th>Budget Limit</th><th>Status</th><th>Role</th><th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {familyMembers.map((member, index) => (
                                        <tr key={index}>
                                            <td>{member.id}</td>
                                            <td><img src={member.avatar} alt="avatar" className="table-avatar"/></td>
                                            <td>{member.name}</td><td>{member.email}</td><td>{member.budget}</td>
                                            <td>{member.status}</td><td>{member.role}</td>
                                            <td className="action-cell">
                                                <motion.button whileTap={{ scale: 0.9 }} className="icon-button"><EditIcon size={14}/></motion.button>
                                                <motion.button whileTap={{ scale: 0.9 }} className="icon-button"><DeleteIcon size={14}/></motion.button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.section>
                )}

                {/* --- Family Expense Record --- */}
                <motion.section className="content-section" variants={itemVariants}>
                    <div className="section-header">
                        <h2>Family Expense Record</h2>
                    </div>
                    {/* Filter Bar */}
                    <div className="filter-export-bar compact-bar">
                         <div className="filter-controls">
                            <input type="text" placeholder="Search By Description" className="filter-input small-input" />
                            <div className="filter-group">
                                <label>Filter By Category:</label>
                                <select className="filter-select small-select"><option value="">Category</option></select>
                            </div>
                            <div className="filter-group">
                                <label>Filter By Amount:</label>
                                <select className="filter-select small-select"><option value="asc">Ascending</option></select>
                            </div>
                             <button className="refresh-button icon-text-button small-button">Refresh <RefreshIcon size={14}/></button>
                        </div>
                        {/* Export button might be admin/editor only */}
                        {(userRole === 'admin' || userRole === 'editor') && (
                             <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="secondary-button export-button small-button">Export</motion.button>
                        )}
                    </div>
                     {/* Expense Table */}
                    <div className="data-table-container">
                        <table className="data-table expense-table">
                             <thead>
                                <tr>
                                    <th>ID</th><th>Date</th><th>Member</th><th>Category</th><th>Description</th><th>Amount</th><th>Status</th><th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {familyExpenses.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.id}</td><td>{item.date}</td><td>{item.member}</td><td>{item.category}</td>
                                        <td>{item.description}</td><td>{item.amount}</td><td>{item.status}</td>
                                        <td className="action-cell">
                                            <motion.button whileTap={{ scale: 0.9 }} className="icon-button"><EditIcon size={14}/></motion.button>
                                            <motion.button whileTap={{ scale: 0.9 }} className="icon-button"><DeleteIcon size={14}/></motion.button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.section>

                {/* --- Your Personal Record --- */}
                <motion.section className="content-section" variants={itemVariants}>
                    <div className="section-header">
                        <h2>Your Personal Record</h2>
                    </div>
                     {/* Personal Charts */}
                    <div className="personal-charts-container">
                        <div className="chart-container personal-chart">
                            <h4>Your Contribution</h4>
                            <ReactECharts option={personalPieChartOptions} style={{ height: '250px', width: '100%' }} />
                        </div>
                        <div className="chart-container personal-chart">
                             <h4>Expense Overview</h4>
                             <ReactECharts option={personalBarChartOptions} style={{ height: '250px', width: '100%' }} />
                        </div>
                    </div>
                    {/* Personal Filter/Add Button */}
                    <div className="filter-export-bar compact-bar">
                         <div className="filter-controls">
                            <input type="text" placeholder="Search By Description" className="filter-input small-input" />
                             <div className="filter-group">
                                <label>Filter By Category:</label>
                                <select className="filter-select small-select"><option value="">Category</option></select>
                            </div>
                             <div className="filter-group">
                                <label>Filter By Amount:</label>
                                <select className="filter-select small-select"><option value="asc">Ascending</option></select>
                            </div>
                             <button className="refresh-button icon-text-button small-button">Refresh <RefreshIcon size={14}/></button>
                        </div>
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="primary-button small-button"><AddIcon size={14}/> Add my Expense</motion.button>
                    </div>
                    {/* Personal Expense Table */}
                     <div className="data-table-container">
                        <table className="data-table expense-table personal-expense-table">
                            <thead>
                                <tr>
                                    <th>ID</th><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th>Status</th><th>Action</th>
                                </tr>
                            </thead>
                             <tbody>
                                {personalExpenses.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.id}</td><td>{item.date}</td><td>{item.category}</td>
                                        <td>{item.description}</td><td>{item.amount}</td><td>{item.status}</td>
                                        <td className="action-cell">
                                            <motion.button whileTap={{ scale: 0.9 }} className="icon-button"><EditIcon size={14}/></motion.button>
                                            <motion.button whileTap={{ scale: 0.9 }} className="icon-button"><DeleteIcon size={14}/></motion.button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.section>

            </motion.main>
            <Footer />
        </div>
    );
};

export default FamilyBudgetingPage;