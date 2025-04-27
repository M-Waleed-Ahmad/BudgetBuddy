import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import Navbar from '../../components/navbar';        // Adjust path if needed
import Footer from '../../components/footer';        // Adjust path if needed
import '../../styles/FamilyBudgetingPage.css';   // CSS for this page
import userAvatarPlaceholder from '../../assets/avatar.png'; // Adjust path if needed

// Placeholder Icons
const EditIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }}>✎</span>;
const DeleteIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }}>🗑️</span>;
const RefreshIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }}>🔄</span>;
const AddIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }}>➕</span>;
const WalletIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px` }}>💰</span>;
const UserIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px` }}>👤</span>;


const FamilyBudgetingPage = () => {

    // --- SIMULATED User Plans and Roles (Replace with actual fetched data) ---
    const userPlansAndRoles = [
        { planId: 'plan1', name: 'Johnson Family Budget', userRole: 'admin' },
        { planId: 'plan2', name: 'Vacation Fund 2025', userRole: 'editor' },
        { planId: 'plan3', name: 'Shared House Expenses', userRole: 'viewer' },
    ];

    // --- State for the currently selected plan ---
    const [selectedPlanId, setSelectedPlanId] = useState(userPlansAndRoles[0]?.planId || '');

    // --- Derive the current user's role based on the selected plan ---
    const currentUserRoleForSelectedPlan = useMemo(() => {
        const selectedPlan = userPlansAndRoles.find(p => p.planId === selectedPlanId);
        return selectedPlan?.userRole || 'viewer';
    }, [selectedPlanId, userPlansAndRoles]);


    // --- Dummy Data (Replace/Fetch based on selectedPlanId) ---
    const totalBudget = 2400;
    const spentAmount = 1800; // Adjusted for better visuals
    const remainingAmount = totalBudget - spentAmount;
    const spentPercentage = totalBudget > 0 ? Math.round((spentAmount / totalBudget) * 100) : 0;

    const familyMembers = Array(6).fill({
        id: '001', avatar: userAvatarPlaceholder, name: "First Name", email: "LastName@",
        budget: "Rs.xxx", status: "Active", role: "Viewer",
    });
    const familyExpenses = Array(7).fill({
        id: '001', date: '12-23-2024', member: 'GH', category: 'Food', description: 'Grocery',
        amount: 'Rs.2000', status: 'Pending Approval',
    });
    const personalExpenses = Array(5).fill({
        id: '001', date: '12-23-2024', category: 'Food', description: 'Grocery',
        amount: 'Rs.2000', status: 'Pending Approval',
    });


    // --- ECharts Options ---
    const mainBarChartOptions = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { data: ['Budget Amount', 'Expense Amount'], bottom: 0, textStyle: { color: '#555' } },
        grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
        xAxis: { type: 'category', data: ['Food', 'Travel', 'Utilities', 'Entertainment', 'Shopping', 'Health'], axisTick: { alignWithLabel: true }, axisLabel: { color: '#666' } },
        yAxis: { type: 'value', axisLabel: { color: '#666' } },
        series: [
            { name: 'Budget Amount', type: 'bar', barWidth: '40%', data: [500, 800, 1200, 600, 900, 700], itemStyle: { color: '#91cc75' } }, // Softer Green
            { name: 'Expense Amount', type: 'bar', barWidth: '40%', data: [400, 900, 1000, 500, 750, 800], itemStyle: { color: '#fc8452' } }  // Softer Red/Orange
        ]
    };

    const personalPieChartOptions = {
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { data: ['Your Spending', 'Remaining Budget'], bottom: 0, textStyle: { color: '#555' } },
        series: [{
            name: 'Contribution', type: 'pie', radius: ['40%', '70%'], avoidLabelOverlap: false,
            label: { show: false }, emphasis: { label: { show: false } }, labelLine: { show: false },
            data: [
                { value: 1500, name: 'Your Spending', itemStyle: { color: '#5470c6' } }, // Echarts Blue
                { value: 3500, name: 'Remaining Budget', itemStyle: { color: '#ee6666' } } // Echarts Red
            ]
        }]
    };

     const personalBarChartOptions = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { data: ['Budget', 'Expense'], bottom: 0, textStyle: { color: '#555' } },
        grid: { top:'15%', left: '3%', right: '4%', bottom: '10%', containLabel: true },
        xAxis: { type: 'category', data: ['Food', 'Travel', 'Other'], axisTick: { alignWithLabel: true }, axisLabel: { color: '#666' } },
        yAxis: { type: 'value', axisLabel: { color: '#666' } },
        series: [
            { name: 'Budget', type: 'bar', barWidth: '30%', data: [600, 500, 700], itemStyle: { color: '#5470c6' } },
            { name: 'Expense', type: 'bar', barWidth: '30%', data: [500, 450, 800], itemStyle: { color: '#ee6666' } }
        ]
    };

    // --- Animation Variants ---
    const pageVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
    const itemVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } } };

    // --- Handler for plan selection change ---
    const handlePlanChange = (event) => {
        setSelectedPlanId(event.target.value);
        // TODO: Add logic here to fetch data specific to the selected plan
        // e.g., fetchPlanData(event.target.value);
        console.log("Switched to Plan ID:", event.target.value);
    };

    return (
        <div className="page-container">
            <Navbar />
            <motion.main
                className="family-budget-page-content"
                variants={pageVariants}
                initial="hidden"
                animate="visible"
            >
                {/* --- Plan Selector --- */}
                <motion.div className="plan-selector-container" variants={itemVariants}>
                     <label htmlFor="plan-select">Viewing Plan:</label>
                     <select
                        id="plan-select"
                        value={selectedPlanId}
                        onChange={handlePlanChange}
                        className="plan-select-dropdown"
                        aria-label="Select Family Budget Plan"
                     >
                         {userPlansAndRoles.map(plan => (
                             <option key={plan.planId} value={plan.planId}>
                                 {plan.name} ({plan.userRole})
                             </option>
                         ))}
                         {userPlansAndRoles.length === 0 && <option disabled>No plans available</option>}
                     </select>
                     {/* Add New Plan button - always visible? Or only if user can create plans? */}
                     {/* Assuming any logged-in user can attempt to create a new plan */}
                     <motion.button
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        className="primary-button small-button add-global-plan-button"
                        // onClick={() => handleAddNewPlan()} // Add handler if needed
                        >
                            Add New Global Plan
                     </motion.button>
                </motion.div>


                {/* --- Family Budget Overview --- */}
                <motion.section className="content-section overview-section" variants={itemVariants}>
                    <div className="section-header space-between">
                        {/* Update title based on selected plan */}
                        <h2>{userPlansAndRoles.find(p => p.planId === selectedPlanId)?.name || 'Family Budget'} Overview</h2>
                        {/* Admin-only settings button */}
                        {currentUserRoleForSelectedPlan === 'admin' && (
                            <div className="header-actions">
                                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="secondary-button small-button">Plan Settings</motion.button>
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
                {currentUserRoleForSelectedPlan === 'admin' && (
                    <motion.section className="content-section" variants={itemVariants}>
                        <div className="section-header">
                             <h2>Family Members</h2>
                         </div>
                        <div className="filter-export-bar compact-bar">
                            <div className="filter-controls">
                                <input type="text" placeholder="Search By Email" className="filter-input small-input" />
                                <div className="filter-group">
                                    <label>Filter By Status:</label>
                                    <select className="filter-select small-select"><option value="">Status</option></select>
                                </div>
                                {/* Removed Filter By Amount as it seems irrelevant here */}
                                <button className="refresh-button icon-text-button small-button">Refresh <RefreshIcon size={14}/></button>
                            </div>
                            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="primary-button small-button"><UserIcon size={14}/> Add new Member</motion.button>
                        </div>
                        <div className="data-table-container">
                            <table className="data-table members-table">
                                <thead>
                                    <tr><th>ID</th><th></th><th>Name</th><th>Email</th><th>Budget Limit</th><th>Status</th><th>Role</th><th>Action</th></tr>
                                </thead>
                                <tbody>
                                    {familyMembers.map((member, index) => (
                                        <tr key={index}>
                                            <td>{member.id}</td>
                                            <td><img src={member.avatar} alt="avatar" className="table-avatar"/></td>
                                            <td>{member.name}</td><td>{member.email}</td><td>{member.budget}</td>
                                            <td>{member.status}</td><td>{member.role}</td>
                                            <td className="action-cell">
                                                <motion.button title="Edit Member" whileTap={{ scale: 0.9 }} className="icon-button"><EditIcon size={14}/></motion.button>
                                                <motion.button title="Remove Member" whileTap={{ scale: 0.9 }} className="icon-button"><DeleteIcon size={14}/></motion.button>
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
                    <div className="filter-export-bar compact-bar">
                         <div className="filter-controls">
                            <input type="text" placeholder="Search By Description" className="filter-input small-input" />
                            <div className="filter-group"><label>Filter By Category:</label><select className="filter-select small-select"><option value="">Category</option></select></div>
                            <div className="filter-group"><label>Filter By Amount:</label><select className="filter-select small-select"><option value="asc">Ascending</option></select></div>
                             <button className="refresh-button icon-text-button small-button">Refresh <RefreshIcon size={14}/></button>
                        </div>
                        {(currentUserRoleForSelectedPlan === 'admin' || currentUserRoleForSelectedPlan === 'editor') && (
                             <motion.button title="Export Expenses" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="secondary-button export-button small-button">Export</motion.button>
                        )}
                    </div>
                    <div className="data-table-container">
                        <table className="data-table expense-table">
                             <thead><tr><th>ID</th><th>Date</th><th>Member</th><th>Category</th><th>Description</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
                            <tbody>
                                {familyExpenses.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.id}</td><td>{item.date}</td><td>{item.member}</td><td>{item.category}</td>
                                        <td>{item.description}</td><td>{item.amount}</td><td>{item.status}</td>
                                        <td className="action-cell">
                                            {/* Edit/Delete might depend on user role AND if it's their own expense */}
                                            <motion.button title="Edit Expense" whileTap={{ scale: 0.9 }} className="icon-button"><EditIcon size={14}/></motion.button>
                                            <motion.button title="Delete Expense" whileTap={{ scale: 0.9 }} className="icon-button"><DeleteIcon size={14}/></motion.button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.section>

                {/* --- Your Personal Record --- */}
                <motion.section className="content-section" variants={itemVariants}>
                    <div className="section-header"><h2>Your Personal Record</h2></div>
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
                    <div className="filter-export-bar compact-bar">
                         <div className="filter-controls">
                            <input type="text" placeholder="Search By Description" className="filter-input small-input" />
                            <div className="filter-group"><label>Filter By Category:</label><select className="filter-select small-select"><option value="">Category</option></select></div>
                            <div className="filter-group"><label>Filter By Amount:</label><select className="filter-select small-select"><option value="asc">Ascending</option></select></div>
                             <button className="refresh-button icon-text-button small-button">Refresh <RefreshIcon size={14}/></button>
                        </div>
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="primary-button small-button"><AddIcon size={14}/> Add my Expense</motion.button>
                    </div>
                     <div className="data-table-container">
                        <table className="data-table expense-table personal-expense-table">
                            <thead><tr><th>ID</th><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
                             <tbody>
                                {personalExpenses.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.id}</td><td>{item.date}</td><td>{item.category}</td>
                                        <td>{item.description}</td><td>{item.amount}</td><td>{item.status}</td>
                                        <td className="action-cell">
                                            <motion.button title="Edit My Expense" whileTap={{ scale: 0.9 }} className="icon-button"><EditIcon size={14}/></motion.button>
                                            <motion.button title="Delete My Expense" whileTap={{ scale: 0.9 }} className="icon-button"><DeleteIcon size={14}/></motion.button>
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