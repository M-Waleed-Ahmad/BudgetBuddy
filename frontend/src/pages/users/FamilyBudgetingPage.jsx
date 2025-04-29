import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import Navbar from '../../components/Navbar';        // Adjust path if needed
import Footer from '../../components/Footer';        // Adjust path if needed
import Modal from '../../components/Modal';        // Adjust path if needed
import '../../styles/FamilyBudgetingPage.css';   // Adjust path if needed
import userAvatarPlaceholder from '../../assets/avatar.png'; // Adjust path if needed

// --- Icons ---
const EditIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }} title="Edit">✏️</span>;
const DeleteIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }} title="Delete">🗑️</span>;
const RefreshIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }} title="Refresh">🔄</span>;
const AddIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }} title="Add">➕</span>;
const WalletIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px` }}>💰</span>;
const UserIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px` }}>👤</span>;
const SettingsIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }} title="Settings">⚙️</span>;
const ExportIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }} title="Export">📤</span>;


// --- Define available categories ---
const availableCategories = ['Food', 'Travel', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Education', 'Other'];

const FamilyBudgetingPage = () => {

    // --- Simulated User Plans & Roles (Replace with actual fetched data) ---
    const [userPlansAndRoles, setUserPlansAndRoles] = useState([
        { planId: 'plan1', name: 'Johnson Family Budget', userRole: 'admin', totalBudget: 5000, startDate: '2024-01-01', endDate: '2024-12-31' },
        { planId: 'plan2', name: 'Vacation Fund 2025', userRole: 'editor', totalBudget: 2000, startDate: '2024-05-01', endDate: '2025-04-30' },
        { planId: 'plan3', name: 'Shared House Expenses', userRole: 'viewer', totalBudget: 1500, startDate: '2024-01-01', endDate: '2024-06-30' },
    ]);

    // --- Component State ---
    const [selectedPlanId, setSelectedPlanId] = useState(userPlansAndRoles[0]?.planId || '');
    const [currentPlanDetails, setCurrentPlanDetails] = useState(userPlansAndRoles[0] || {}); // Store details of selected plan

    // Modal Visibility States
    const [modalState, setModalState] = useState({
        isAddPlanOpen: false, isSettingsOpen: false, isAddMemberOpen: false,
        isExportOpen: false, isAddPersonalExpenseOpen: false,
        isEditMemberOpen: false, isDeleteMemberOpen: false,
        isEditFamilyExpenseOpen: false, isDeleteFamilyExpenseOpen: false,
        isEditPersonalExpenseOpen: false, isDeletePersonalExpenseOpen: false,
        isDeletePlanOpen: false,
    });

    // State for items being edited/deleted/viewed
    const [editingItem, setEditingItem] = useState(null);
    const [deletingItemId, setDeletingItemId] = useState(null);
    const [deletingItemType, setDeletingItemType] = useState(''); // e.g., 'member', 'familyExpense', 'personalExpense', 'plan'

    // Form Data States
    const [addPlanFormData, setAddPlanFormData] = useState({ plan_name: '', budget_id: '', expense_id: '' }); // Example, adjust fields as needed
    const [settingsFormData, setSettingsFormData] = useState({ plan_name: '', totalBudget: '', startDate: '', endDate: '' });
    const [addMemberFormData, setAddMemberFormData] = useState({ email: '', role: 'viewer' });
    const [expenseFormData, setExpenseFormData] = useState({ date: '', category: '', description: '', amount: '', notes: '' }); // Used for Add/Edit Personal & Family Expense
    const [exportFormData, setExportFormData] = useState({ format: 'csv', dateRange: 'current_month' });


    // --- Dummy Data (Should be fetched based on selectedPlanId) ---
    const [familyMembers, setFamilyMembers] = useState(Array(3).fill(null).map((_, i) => ({ id: `mem${i}`, avatar: userAvatarPlaceholder, name: `Member ${i+1}`, email: `member${i+1}@test.com`, budget: "Rs.500", status: "Active", role: i === 0 ? 'Admin' : 'Viewer' })));
    const [familyExpenses, setFamilyExpenses] = useState(Array(4).fill(null).map((_, i) => ({ id: `fexp${i}`, date: `2024-12-${20-i}`, member: `M${i+1}`, category: 'Food', description: 'Team Lunch', amount: 150 + i * 20, status: 'Approved' })));
    const [personalExpenses, setPersonalExpenses] = useState(Array(2).fill(null).map((_, i) => ({ id: `pexp${i}`, date: `2024-12-${15-i}`, category: 'Shopping', description: 'Clothes', amount: 300 + i * 50, status: 'Self' })));


    // --- Derived State ---
    const currentUserRoleForSelectedPlan = useMemo(() => {
        return currentPlanDetails?.userRole || 'viewer';
    }, [currentPlanDetails]);

    const spentAmount = useMemo(() => familyExpenses.reduce((sum, item) => sum + item.amount, 0), [familyExpenses]); // Example calculation
    const remainingAmount = useMemo(() => (currentPlanDetails?.totalBudget || 0) - spentAmount, [currentPlanDetails, spentAmount]);
    const spentPercentage = useMemo(() => (currentPlanDetails?.totalBudget || 0) > 0 ? Math.round((spentAmount / (currentPlanDetails?.totalBudget || 1)) * 100) : 0, [currentPlanDetails, spentAmount]);


    // --- ECharts Options ---
    const mainBarChartOptions = useMemo(() => ({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { data: ['Budget Amount', 'Expense Amount'], bottom: 0, textStyle: { color: '#555' } },
        grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
        xAxis: { type: 'category', data: ['Food', 'Travel', 'Utilities', 'Entertainment', 'Shopping', 'Health'], axisTick: { alignWithLabel: true }, axisLabel: { color: '#666' } },
        yAxis: { type: 'value', axisLabel: { color: '#666' } },
        // Data should ideally be fetched based on selectedPlanId
        series: [
            { name: 'Budget Amount', type: 'bar', barWidth: '40%', data: [500, 800, 1200, 600, 900, 700], itemStyle: { color: '#91cc75' } },
            { name: 'Expense Amount', type: 'bar', barWidth: '40%', data: [400, 900, 1000, 500, 750, 800], itemStyle: { color: '#fc8452' } }
        ]
    }), [selectedPlanId]); // Example dependency, replace with actual data dependencies

    const personalPieChartOptions = useMemo(() => ({
        tooltip: { trigger: 'item', formatter: '{b}: Rs {c} ({d}%)' }, // Added Rs
        legend: { data: ['Your Spending', 'Remaining Budget'], bottom: 0, textStyle: { color: '#555' } },
        series: [{
            name: 'Contribution', type: 'pie', radius: ['40%', '70%'], avoidLabelOverlap: false,
            label: { show: false }, emphasis: { label: { show: false } }, labelLine: { show: false },
            // Data should be personal contributions/limits for the selected plan
            data: [
                { value: 1500, name: 'Your Spending', itemStyle: { color: '#5470c6' } },
                { value: 3500, name: 'Remaining Budget', itemStyle: { color: '#ee6666' } }
            ]
        }]
    }), [selectedPlanId]); // Example dependency

     const personalBarChartOptions = useMemo(() => ({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { data: ['Budget', 'Expense'], bottom: 0, textStyle: { color: '#555' } },
        grid: { top:'15%', left: '3%', right: '4%', bottom: '10%', containLabel: true },
        xAxis: { type: 'category', data: ['Food', 'Travel', 'Other'], axisTick: { alignWithLabel: true }, axisLabel: { color: '#666' } },
        yAxis: { type: 'value', axisLabel: { color: '#666' } },
        // Data should reflect personal budget vs expense in selected plan
        series: [
            { name: 'Budget', type: 'bar', barWidth: '30%', data: [600, 500, 700], itemStyle: { color: '#5470c6' } },
            { name: 'Expense', type: 'bar', barWidth: '30%', data: [500, 450, 800], itemStyle: { color: '#ee6666' } }
        ]
    }), [selectedPlanId]); // Example dependency


    // --- Animation Variants ---
    const pageVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
    const itemVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } } };


    // --- Modal Open/Close Handlers ---
    const openModal = (modalName, item = null, itemType = '') => {
        // Close all other modals first
        setModalState(prev => Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}));
        // Open the target modal
        setModalState(prev => ({ ...prev, [modalName]: true }));

        if (item) setEditingItem(item); // Store item for editing/viewing details
        if (itemType && item) { // For delete confirmation, store ID and type
            setDeletingItemId(item.id || item.planId);
            setDeletingItemType(itemType);
        } else { // Clear delete state if not opening a delete modal
             setDeletingItemId(null);
             setDeletingItemType('');
        }

        // Pre-fill forms based on which modal is opening
        if (modalName === 'isSettingsOpen' && currentPlanDetails) {
            setSettingsFormData({ plan_name: currentPlanDetails.name || '', totalBudget: currentPlanDetails.totalBudget?.toString() || '', startDate: currentPlanDetails.startDate || '', endDate: currentPlanDetails.endDate || '' });
        } else if (modalName === 'isAddPlanOpen') {
            setAddPlanFormData({ plan_name: '', budget_id: '', expense_id: '' }); // Reset Add Plan form
        } else if (modalName === 'isAddMemberOpen') {
             setAddMemberFormData({ email: '', role: 'viewer' }); // Reset Add Member form
        } else if (modalName === 'isAddPersonalExpenseOpen') {
             setExpenseFormData({ date: new Date().toISOString().split('T')[0], category: availableCategories[0] || '', description: '', amount: '', notes: '' }); // Reset Expense form
        }
        // Edit forms are handled by useEffect below
    };

    const closeModal = () => {
        setModalState(prev => Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {})); // Close all modals
        // Delay reset for exit animations
        setTimeout(() => { setEditingItem(null); setDeletingItemId(null); setDeletingItemType(''); }, 300);
    };


    // --- Form Input Handlers ---
    const handleFormChange = (e, formSetter) => { const { name, value } = e.target; formSetter(prev => ({ ...prev, [name]: value })); };


    // --- Form Submit Handlers ---
    const handleAddPlanSubmit = (e) => { e.preventDefault(); console.log("Adding Plan:", addPlanFormData); alert("Adding Plan (Simulated)"); /* TODO: API Call */ closeModal(); };
    const handleSettingsSubmit = (e) => { e.preventDefault(); const numericTotal = parseFloat(settingsFormData.totalBudget) || 0; if (numericTotal <= 0 || !settingsFormData.startDate || !settingsFormData.endDate || new Date(settingsFormData.startDate) >= new Date(settingsFormData.endDate)) { alert("Invalid settings data."); return; }; console.log("Saving Settings:", settingsFormData); alert("Saving Settings (Simulated)"); /* TODO: API Call */ setCurrentPlanDetails(prev => ({ ...prev, ...settingsFormData, totalBudget: numericTotal })); closeModal(); };
    const handleAddMemberSubmit = (e) => { e.preventDefault(); if (!addMemberFormData.email) {alert("Email is required."); return;} console.log("Adding Member:", addMemberFormData); alert("Adding Member (Simulated)"); /* TODO: API Call */ closeModal(); };
    const handleExportSubmit = (e) => { e.preventDefault(); console.log("Exporting:", exportFormData); alert("Exporting Data (Simulated)"); /* TODO: API Call */ closeModal(); };
    const handleAddEditExpenseSubmit = (e, type) => { // Type is 'personal' or 'family'
         e.preventDefault();
         const numericAmount = parseFloat(expenseFormData.amount) || 0;
         if (numericAmount <= 0 || !expenseFormData.category || !expenseFormData.date) { alert("Please fill required fields correctly."); return; }

         if (editingItem) { // Editing existing expense
             console.log(`Updating ${type} expense:`, editingItem.id, { ...expenseFormData, amount: numericAmount });
             // TODO: API Call
             const listSetter = type === 'personal' ? setPersonalExpenses : setFamilyExpenses;
             listSetter(prev => prev.map(item => item.id === editingItem.id ? { ...item, ...expenseFormData, amount: numericAmount } : item));
             alert(`${type.charAt(0).toUpperCase() + type.slice(1)} Expense ${editingItem.id} updated! (Simulated)`);
         } else { // Adding new expense
            const newExpense = { id: `${type.slice(0,1)}exp-${Date.now()}`.slice(-10), ...expenseFormData, amount: numericAmount, member: type === 'family' ? 'You' : undefined, status: type === 'family' ? 'Pending Approval' : 'Self' };
            console.log(`Adding new ${type} expense:`, newExpense);
             // TODO: API Call
             const listSetter = type === 'personal' ? setPersonalExpenses : setFamilyExpenses;
             listSetter(prev => [newExpense, ...prev]);
             alert(`${type.charAt(0).toUpperCase() + type.slice(1)} Expense added! (Simulated)`);
         }
         closeModal();
    };
    // Placeholder for Edit Member submit
    const handleEditMemberSubmit = (e) => { e.preventDefault(); console.log("Editing Member", editingItem); alert("Edit Member Submit (Simulated)"); /* TODO: API Call */ closeModal(); };


    // --- Delete Confirmation Handler ---
    const confirmDelete = () => {
        if (!deletingItemId || !deletingItemType) return;
        console.log(`Deleting ${deletingItemType}:`, deletingItemId);
        // TODO: API Calls based on deletingItemType
        let itemDescription = deletingItemType.replace(/([A-Z])/g, ' $1').toLowerCase(); // Format type for message
        switch (deletingItemType) {
            case 'member': setFamilyMembers(prev => prev.filter(item => item.id !== deletingItemId)); break;
            case 'familyExpense': setFamilyExpenses(prev => prev.filter(item => item.id !== deletingItemId)); break;
            case 'personalExpense': setPersonalExpenses(prev => prev.filter(item => item.id !== deletingItemId)); break;
            case 'plan':
                 setUserPlansAndRoles(prev => prev.filter(item => item.planId !== deletingItemId));
                 const remainingPlans = userPlansAndRoles.filter(p => p.planId !== deletingItemId);
                 setSelectedPlanId(remainingPlans[0]?.planId || ''); // Select first remaining or clear
                 itemDescription = 'plan'; // Override for message
                 alert(`Plan ${deletingItemId} deleted! Selecting next available plan. (Simulated)`);
                 break;
            default: console.error("Unknown item type to delete"); return; // Exit if type unknown
        }
         alert(`${itemDescription.charAt(0).toUpperCase() + itemDescription.slice(1)} ${deletingItemId} deleted! (Simulated)`);
        closeModal();
    };

    // --- Refresh Handler ---
    const handleRefresh = (section) => { alert(`Refresh ${section} clicked! (Implement data fetching)`); /* TODO: Fetch data */ };

    // --- Effects ---
    // Update currentPlanDetails & fetch data when selectedPlanId changes
    useEffect(() => {
        const plan = userPlansAndRoles.find(p => p.planId === selectedPlanId);
        setCurrentPlanDetails(plan || {});
        // TODO: Fetch associated data (members, expenses, etc.) for the selected plan ID here
        console.log("Fetching data for plan:", selectedPlanId);
        // Example: Resetting dummy data on plan change (replace with fetch)
        setFamilyMembers(Array(Math.floor(Math.random() * 4) + 2).fill(null).map((_, i) => ({ id: `mem${i}${selectedPlanId}`, avatar: userAvatarPlaceholder, name: `Member ${i+1}`, email: `member${i+1}@test.com`, budget: "Rs.500", status: "Active", role: i === 0 ? 'Admin' : 'Viewer' })));
        setFamilyExpenses(Array(Math.floor(Math.random() * 5) + 3).fill(null).map((_, i) => ({ id: `fexp${i}${selectedPlanId}`, date: `2024-11-${20-i}`, member: `M${i+1}`, category: 'Food', description: 'Plan Lunch', amount: 150 + i * 20, status: 'Approved' })));
        setPersonalExpenses(Array(Math.floor(Math.random() * 3) + 1).fill(null).map((_, i) => ({ id: `pexp${i}${selectedPlanId}`, date: `2024-11-${15-i}`, category: 'Shopping', description: 'Books', amount: 300 + i * 50, status: 'Self' })));
    }, [selectedPlanId, userPlansAndRoles]); // Rerun when selection or available plans change

    // Pre-fill expense edit form
    useEffect(() => {
        if (editingItem && (modalState.isEditFamilyExpenseOpen || modalState.isEditPersonalExpenseOpen)) {
             setExpenseFormData({ date: editingItem.date || '', category: editingItem.category || '', description: editingItem.description || '', amount: editingItem.amount?.toString() || '', notes: editingItem.notes || '' });
        } else if (!modalState.isEditFamilyExpenseOpen && !modalState.isEditPersonalExpenseOpen) {
             // Reset only if specifically not editing expense, don't reset if another modal is open
             if (!Object.values(modalState).some(isOpen => isOpen)) {
                 setExpenseFormData({ date: new Date().toISOString().split('T')[0], category: availableCategories[0] || '', description: '', amount: '', notes: '' });
             }
        }
         // Add similar useEffect for editingMember if implementing that modal
    }, [editingItem, modalState.isEditFamilyExpenseOpen, modalState.isEditPersonalExpenseOpen, modalState]);


    // --- Utility ---
    const formatDate = (dateString) => { if (!dateString) return 'N/A'; try { return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); } catch (e) { console.error("Date format error:", dateString, e); return dateString; } };

    return (
        <div className="page-container"> {/* Use page-container for consistent padding/bg */}
            <Navbar />
            <motion.main className="family-budget-page-content" variants={pageVariants} initial="hidden" animate="visible">

                {/* --- Plan Selector --- */}
                <motion.div className="plan-selector-container" variants={itemVariants}>
                     <label htmlFor="plan-select">Viewing Plan:</label>
                     <select id="plan-select" value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)} className="plan-select-dropdown" aria-label="Select Family Budget Plan">
                         {userPlansAndRoles.map(plan => (<option key={plan.planId} value={plan.planId}>{plan.name} ({plan.userRole})</option>))}
                         {userPlansAndRoles.length === 0 && <option disabled>No plans available</option>}
                     </select>
                     <motion.button onClick={() => openModal('isAddPlanOpen')} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="primary-button small-button add-global-plan-button">Add New Plan</motion.button>
                </motion.div>

                {/* --- Family Budget Overview --- */}
                <motion.section className="content-section overview-section" variants={itemVariants}>
                    <div className="section-header space-between">
                        <h2>{currentPlanDetails?.name || 'Family Budget'} Overview</h2>
                        {currentUserRoleForSelectedPlan === 'admin' && (
                            <div className="header-actions">
                                <motion.button onClick={() => openModal('isSettingsOpen')} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="secondary-button small-button"><SettingsIcon size={14}/> Plan Settings</motion.button>
                                <motion.button onClick={() => openModal('isDeletePlanOpen', currentPlanDetails, 'plan')} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="danger-button small-button"><DeleteIcon size={14}/> Delete Plan</motion.button>
                            </div>
                        )}
                    </div>
                    <div className="stats-boxes">
                        <div className="stat-box"><span>Total Budget</span>Rs.{currentPlanDetails?.totalBudget?.toLocaleString() || 0}</div>
                        <div className="stat-box"><span>Spent Amount</span>Rs.{spentAmount.toLocaleString()}</div>
                        <div className="stat-box"><span>Remaining Amount</span>Rs.{remainingAmount.toLocaleString()}</div>
                    </div>
                    <div className="budget-progress-bar-container pill-progress">
                        <motion.div className="budget-progress-bar-filled primary-fill" initial={{ width: 0 }} animate={{ width: `${spentPercentage}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
                        <span className="progress-percentage inside">{spentPercentage}%</span>
                    </div>
                    <div className="progress-labels"><span>Spent</span><span>Remaining</span></div>
                    <div className="chart-container main-chart">
                         <h4>Budget vs. Expense by Category</h4>
                        <ReactECharts option={mainBarChartOptions} style={{ height: '300px', width: '100%' }} notMerge={true} lazyUpdate={true} />
                    </div>
                </motion.section>

                {/* --- Family Members (Admin Only) --- */}
                {currentUserRoleForSelectedPlan === 'admin' && (
                    <motion.section className="content-section" variants={itemVariants}>
                        <div className="section-header"><h2>Family Members</h2></div>
                        <div className="filter-export-bar compact-bar">
                            <div className="filter-controls">
                                <input type="text" placeholder="Search By Email" className="filter-input small-input" />
                                <div className="filter-group"><label>Filter By Status:</label><select className="filter-select small-select"><option value="">All Status</option><option value="Active">Active</option><option value="Pending">Pending</option></select></div>
                                <button onClick={() => handleRefresh('Members')} className="refresh-button icon-text-button small-button">Refresh <RefreshIcon size={14}/></button>
                            </div>
                            <motion.button onClick={() => openModal('isAddMemberOpen')} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="primary-button small-button"><UserIcon size={14}/> Add Member</motion.button>
                        </div>
                        <div className="data-table-container">
                            <table className="data-table members-table">
                                <thead><tr><th>ID</th><th></th><th>Name</th><th>Email</th><th>Budget Limit</th><th>Status</th><th>Role</th><th>Action</th></tr></thead>
                                <tbody>
                                    {familyMembers.map((member) => (
                                        <tr key={member.id}>
                                            <td>{member.id}</td><td><img src={member.avatar} alt="avatar" className="table-avatar"/></td><td>{member.name}</td><td>{member.email}</td><td>{member.budget}</td><td>{member.status}</td><td>{member.role}</td>
                                            <td className="action-cell">
                                                <motion.button onClick={() => openModal('isEditMemberOpen', member)} title="Edit Member" whileTap={{ scale: 0.9 }} className="icon-button"><EditIcon size={14}/></motion.button>
                                                <motion.button onClick={() => openModal('isDeleteMemberOpen', member, 'member')} title="Remove Member" whileTap={{ scale: 0.9 }} className="icon-button"><DeleteIcon size={14}/></motion.button>
                                            </td>
                                        </tr>
                                    ))}
                                    {familyMembers.length === 0 && <tr><td colSpan="8" className="no-data-message">No members found in this plan.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </motion.section>
                )}

                {/* --- Family Expense Record --- */}
                <motion.section className="content-section" variants={itemVariants}>
                    <div className="section-header"><h2>Family Expense Record</h2></div>
                    <div className="filter-export-bar compact-bar">
                         <div className="filter-controls">
                            <input type="text" placeholder="Search By Description" className="filter-input small-input" />
                            <div className="filter-group"><label>Filter By Category:</label><select className="filter-select small-select"><option value="">All</option>{availableCategories.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                            <div className="filter-group"><label>Sort By Amount:</label><select className="filter-select small-select"><option value="desc">Descending</option><option value="asc">Ascending</option></select></div>
                             <button onClick={() => handleRefresh('Family Expenses')} className="refresh-button icon-text-button small-button">Refresh <RefreshIcon size={14}/></button>
                        </div>
                        {(currentUserRoleForSelectedPlan === 'admin' || currentUserRoleForSelectedPlan === 'editor') && (
                             <motion.button onClick={() => openModal('isExportOpen')} title="Export Expenses" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="secondary-button export-button small-button"><ExportIcon size={14}/> Export</motion.button>
                        )}
                    </div>
                    <div className="data-table-container">
                        <table className="data-table expense-table">
                             <thead><tr><th>ID</th><th>Date</th><th>Member</th><th>Category</th><th>Description</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
                            <tbody>
                                {familyExpenses.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.id}</td><td>{item.date}</td><td>{item.member}</td><td>{item.category}</td><td>{item.description}</td><td>Rs.{item.amount.toLocaleString()}</td><td>{item.status}</td>
                                        <td className="action-cell">
                                            <motion.button onClick={() => openModal('isEditFamilyExpenseOpen', item)} title="Edit Expense" whileTap={{ scale: 0.9 }} className="icon-button"><EditIcon size={14}/></motion.button>
                                            <motion.button onClick={() => openModal('isDeleteFamilyExpenseOpen', item, 'familyExpense')} title="Delete Expense" whileTap={{ scale: 0.9 }} className="icon-button"><DeleteIcon size={14}/></motion.button>
                                        </td>
                                    </tr>
                                ))}
                                 {familyExpenses.length === 0 && <tr><td colSpan="8" className="no-data-message">No family expenses recorded for this plan.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </motion.section>

                {/* --- Your Personal Record --- */}
                <motion.section className="content-section" variants={itemVariants}>
                    <div className="section-header"><h2>Your Personal Record (within this Plan)</h2></div>
                    <div className="personal-charts-container">
                        <div className="chart-container personal-chart">
                            <h4>Your Contribution</h4>
                            <ReactECharts option={personalPieChartOptions} style={{ height: '250px', width: '100%' }} notMerge={true} lazyUpdate={true} />
                        </div>
                        <div className="chart-container personal-chart">
                             <h4>Expense Overview</h4>
                             <ReactECharts option={personalBarChartOptions} style={{ height: '250px', width: '100%' }} notMerge={true} lazyUpdate={true} />
                        </div>
                    </div>
                    <div className="filter-export-bar compact-bar">
                         <div className="filter-controls">
                            <input type="text" placeholder="Search By Description" className="filter-input small-input" />
                            <div className="filter-group"><label>Filter By Category:</label><select className="filter-select small-select"><option value="">All</option>{availableCategories.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                            <div className="filter-group"><label>Sort By Amount:</label><select className="filter-select small-select"><option value="desc">Descending</option><option value="asc">Ascending</option></select></div>
                             <button onClick={() => handleRefresh('Personal Expenses')} className="refresh-button icon-text-button small-button">Refresh <RefreshIcon size={14}/></button>
                        </div>
                        <motion.button onClick={() => openModal('isAddPersonalExpenseOpen')} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="primary-button small-button"><AddIcon size={14}/> Add My Expense</motion.button>
                    </div>
                     <div className="data-table-container">
                        <table className="data-table expense-table personal-expense-table">
                            <thead><tr><th>ID</th><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
                             <tbody>
                                {personalExpenses.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.id}</td><td>{item.date}</td><td>{item.category}</td><td>{item.description}</td><td>Rs.{item.amount.toLocaleString()}</td><td>{item.status}</td>
                                        <td className="action-cell">
                                            <motion.button onClick={() => openModal('isEditPersonalExpenseOpen', item)} title="Edit My Expense" whileTap={{ scale: 0.9 }} className="icon-button"><EditIcon size={14}/></motion.button>
                                            <motion.button onClick={() => openModal('isDeletePersonalExpenseOpen', item, 'personalExpense')} title="Delete My Expense" whileTap={{ scale: 0.9 }} className="icon-button"><DeleteIcon size={14}/></motion.button>
                                        </td>
                                    </tr>
                                ))}
                                {personalExpenses.length === 0 && <tr><td colSpan="7" className="no-data-message">You haven't added any personal expenses to this plan yet.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </motion.section>

            </motion.main>

            {/* --- MODALS --- */}
            {/* Add New Global Plan Modal */}
            <Modal isOpen={modalState.isAddPlanOpen} onClose={closeModal} title="Add New Family Plan">
                <form onSubmit={handleAddPlanSubmit} className="modal-form">
                    <div className="form-group"><label htmlFor="plan_name_add">Plan Name</label><input type="text" id="plan_name_add" name="plan_name" required className="input-field" value={addPlanFormData.plan_name} onChange={(e) => handleFormChange(e, setAddPlanFormData)} placeholder="e.g., Summer Vacation Fund"/></div>
                    {/* Add fields for initial budget, dates etc. as needed */}
                    <div className="form-actions"><button type="button" className="secondary-button" onClick={closeModal}>Cancel</button><button type="submit" className="primary-button">Create Plan</button></div>
                </form>
            </Modal>

            {/* Plan Settings Modal */}
            <Modal isOpen={modalState.isSettingsOpen} onClose={closeModal} title="Plan Settings">
                <form onSubmit={handleSettingsSubmit} className="modal-form">
                    <div className="form-group"><label htmlFor="plan_name_set">Plan Name</label><input type="text" id="plan_name_set" name="plan_name" required className="input-field" value={settingsFormData.plan_name} onChange={(e) => handleFormChange(e, setSettingsFormData)}/></div>
                    <div className="form-group"><label htmlFor="totalBudget_set">Total Budget (Rs)</label><input type="number" id="totalBudget_set" name="totalBudget" required min="1" step="any" className="input-field" value={settingsFormData.totalBudget} onChange={(e) => handleFormChange(e, setSettingsFormData)}/></div>
                    <div className="form-group"><label htmlFor="startDate_set">Start Date</label><input type="date" id="startDate_set" name="startDate" required className="input-field" value={settingsFormData.startDate} onChange={(e) => handleFormChange(e, setSettingsFormData)}/></div>
                    <div className="form-group"><label htmlFor="endDate_set">End Date</label><input type="date" id="endDate_set" name="endDate" required className="input-field" value={settingsFormData.endDate} onChange={(e) => handleFormChange(e, setSettingsFormData)}/></div>
                    <div className="form-actions"><button type="button" className="secondary-button" onClick={closeModal}>Cancel</button><button type="submit" className="primary-button">Save Settings</button></div>
                </form>
            </Modal>

             {/* Add Member Modal */}
             <Modal isOpen={modalState.isAddMemberOpen} onClose={closeModal} title="Add New Member">
                 <form onSubmit={handleAddMemberSubmit} className="modal-form">
                     <div className="form-group"><label htmlFor="email_add">Member Email</label><input type="email" id="email_add" name="email" required className="input-field" placeholder="Enter email address" value={addMemberFormData.email} onChange={(e) => handleFormChange(e, setAddMemberFormData)}/></div>
                     <div className="form-group"><label htmlFor="role_add">Assign Role</label><select id="role_add" name="role" required className="select-field" value={addMemberFormData.role} onChange={(e) => handleFormChange(e, setAddMemberFormData)}><option value="viewer">Viewer</option><option value="editor">Editor</option><option value="admin">Admin</option></select></div>
                     <div className="form-actions"><button type="button" className="secondary-button" onClick={closeModal}>Cancel</button><button type="submit" className="primary-button">Add Member</button></div>
                 </form>
             </Modal>

              {/* Export Modal */}
              <Modal isOpen={modalState.isExportOpen} onClose={closeModal} title="Export Expenses">
                  <form onSubmit={handleExportSubmit} className="modal-form">
                       <div className="form-group"><label htmlFor="exp-dateRange_exp">Date Range:</label><select id="exp-dateRange_exp" name="dateRange" className="select-field" required value={exportFormData.dateRange} onChange={(e) => handleFormChange(e, setExportFormData)}><option value="current_month">Current Month</option><option value="last_month">Last Month</option><option value="last_3_months">Last 3 Months</option><option value="year_to_date">Year to Date</option><option value="all_time">All Time</option></select></div>
                       <div className="form-group"><label htmlFor="exp-format_exp">Format:</label><select id="exp-format_exp" name="format" className="select-field" required value={exportFormData.format} onChange={(e) => handleFormChange(e, setExportFormData)}><option value="csv">CSV</option><option value="pdf">PDF</option></select></div>
                       <div className="form-actions"><button type="button" className="secondary-button" onClick={closeModal}>Cancel</button><button type="submit" className="primary-button">Export Data</button></div>
                  </form>
              </Modal>

             {/* Add/Edit Personal Expense Modal */}
             <Modal isOpen={modalState.isAddPersonalExpenseOpen || modalState.isEditPersonalExpenseOpen} onClose={closeModal} title={editingItem ? "Edit Personal Expense" : "Add Personal Expense"}>
                 <form onSubmit={(e) => handleAddEditExpenseSubmit(e, 'personal')} className="modal-form">
                     {editingItem && (<div className="form-group"><label>Expense ID</label><input type="text" value={editingItem.id} className="input-field" readOnly disabled/></div>)}
                     <div className="form-group"><label htmlFor="pexp-date_form">Date</label><input type="date" id="pexp-date_form" name="date" required className="input-field" value={expenseFormData.date} onChange={(e) => handleFormChange(e, setExpenseFormData)}/></div>
                     <div className="form-group"><label htmlFor="pexp-category_form">Category</label><select id="pexp-category_form" name="category" required className="select-field" value={expenseFormData.category} onChange={(e) => handleFormChange(e, setExpenseFormData)}><option value="" disabled>-- Select --</option>{availableCategories.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                     <div className="form-group"><label htmlFor="pexp-description_form">Description</label><input type="text" id="pexp-description_form" name="description" required className="input-field" value={expenseFormData.description} onChange={(e) => handleFormChange(e, setExpenseFormData)}/></div>
                     <div className="form-group"><label htmlFor="pexp-amount_form">Amount (Rs)</label><input type="number" id="pexp-amount_form" name="amount" required min="0.01" step="any" className="input-field" value={expenseFormData.amount} onChange={(e) => handleFormChange(e, setExpenseFormData)}/></div>
                     <div className="form-group"><label htmlFor="pexp-notes_form">Notes</label><textarea id="pexp-notes_form" name="notes" className="textarea-field" value={expenseFormData.notes} onChange={(e) => handleFormChange(e, setExpenseFormData)}></textarea></div>
                     <div className="form-actions"><button type="button" className="secondary-button" onClick={closeModal}>Cancel</button><button type="submit" className="primary-button">{editingItem ? "Save Changes" : "Add Expense"}</button></div>
                 </form>
             </Modal>

             {/* Edit Family Expense Modal */}
             <Modal isOpen={modalState.isEditFamilyExpenseOpen} onClose={closeModal} title="Edit Family Expense">
                 <form onSubmit={(e) => handleAddEditExpenseSubmit(e, 'family')} className="modal-form">
                     {editingItem && (<div className="form-group"><label>Expense ID</label><input type="text" value={editingItem.id} className="input-field" readOnly disabled/></div>)}
                     <div className="form-group"><label htmlFor="fexp-date_form">Date</label><input type="date" id="fexp-date_form" name="date" required className="input-field" value={expenseFormData.date} onChange={(e) => handleFormChange(e, setExpenseFormData)}/></div>
                     <div className="form-group"><label htmlFor="fexp-category_form">Category</label><select id="fexp-category_form" name="category" required className="select-field" value={expenseFormData.category} onChange={(e) => handleFormChange(e, setExpenseFormData)}><option value="" disabled>-- Select --</option>{availableCategories.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                     <div className="form-group"><label htmlFor="fexp-description_form">Description</label><input type="text" id="fexp-description_form" name="description" required className="input-field" value={expenseFormData.description} onChange={(e) => handleFormChange(e, setExpenseFormData)}/></div>
                     <div className="form-group"><label htmlFor="fexp-amount_form">Amount (Rs)</label><input type="number" id="fexp-amount_form" name="amount" required min="0.01" step="any" className="input-field" value={expenseFormData.amount} onChange={(e) => handleFormChange(e, setExpenseFormData)}/></div>
                     <div className="form-group"><label htmlFor="fexp-notes_form">Notes</label><textarea id="fexp-notes_form" name="notes" className="textarea-field" value={expenseFormData.notes} onChange={(e) => handleFormChange(e, setExpenseFormData)}></textarea></div>
                     <div className="form-actions"><button type="button" className="secondary-button" onClick={closeModal}>Cancel</button><button type="submit" className="primary-button">Save Changes</button></div>
                 </form>
             </Modal>

            {/* Edit Member Modal Placeholder */}
             <Modal isOpen={modalState.isEditMemberOpen} onClose={closeModal} title={`Edit Member: ${editingItem?.name || ''}`}>
                  <form onSubmit={handleEditMemberSubmit} className="modal-form">
                       <div className="form-group"><label>Member ID:</label><input type="text" readOnly disabled value={editingItem?.id || ''} className="input-field"/></div>
                       <div className="form-group"><label>Email:</label><input type="email" readOnly disabled value={editingItem?.email || ''} className="input-field"/></div>
                       {/* Add fields for Budget Limit, Status (Dropdown?), Role (Dropdown?) */}
                       <div className="form-group"><label htmlFor="edit_mem_budget">Budget Limit (Rs)</label><input type="number" min="0" step="any" id="edit_mem_budget" name="budget" className="input-field" placeholder="e.g., 500" defaultValue={editingItem?.budget?.replace('Rs.','')} /></div>
                       <div className="form-group"><label htmlFor="edit_mem_role">Role</label><select id="edit_mem_role" name="role" className="select-field" defaultValue={editingItem?.role}><option value="viewer">Viewer</option><option value="editor">Editor</option><option value="admin">Admin</option></select></div>
                       <div className="form-actions"><button type="button" className="secondary-button" onClick={closeModal}>Cancel</button><button type="submit" className="primary-button">Save Member</button></div>
                  </form>
             </Modal>


             {/* Universal Delete Confirmation Modal */}
             <Modal isOpen={modalState.isDeleteMemberOpen || modalState.isDeleteFamilyExpenseOpen || modalState.isDeletePersonalExpenseOpen || modalState.isDeletePlanOpen} onClose={closeModal} title={`Confirm Deletion: ${deletingItemType.replace(/([A-Z])/g, ' $1').trim()}`}>
                <div className="confirmation-text">Are you sure you want to delete this {deletingItemType.replace(/([A-Z])/g, ' $1').toLowerCase()} (ID: <strong>{deletingItemId}</strong>)? This action cannot be undone.</div>
                <div className="confirmation-actions">
                    <motion.button type="button" className="secondary-button" onClick={closeModal} whileTap={{ scale: 0.95 }}>Cancel</motion.button>
                    <motion.button type="button" className="primary-button delete-confirm-button" onClick={confirmDelete} whileTap={{ scale: 0.95 }}>Confirm Delete</motion.button>
                </div>
            </Modal>

            <Footer />
        </div>
    );
};

export default FamilyBudgetingPage;