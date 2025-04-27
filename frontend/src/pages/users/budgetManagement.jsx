import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import Navbar from '../../components/Navbar';      // Adjust path if needed
import Footer from '../../components/Footer';      // Adjust path if needed
import Modal from '../../components/Modal';        // Adjust path if needed
import '../../styles/BudgetManagementPage.css'; // Adjust path if needed

// --- Icons ---
const EditIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }} title="Edit">✏️</span>;
const DeleteIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }} title="Delete">🗑️</span>;
const RefreshIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }} title="Refresh">🔄</span>;

// --- Initial Dummy Data Generation ---
const generateInitialBudgetData = (count = 8) =>
    Array(count).fill(null).map((_, index) => ({
        id: `bud-${index + 1}-${Date.now()}`.slice(-10),
        category: index % 3 === 0 ? 'Travel' : (index % 2 === 0 ? 'Food' : 'Utilities'),
        amount: 2000 + index * 150,
        description: index % 2 === 0 ? 'Groceries Purchase' : 'Monthly Bill'
    }));

// --- Define available categories for dropdowns ---
const availableCategories = ['Food', 'Travel', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Education', 'Other'];

const BudgetManagementPage = () => {

    // --- State ---
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isMonthlyBudgetModalOpen, setIsMonthlyBudgetModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState(null);
    const [deletingBudgetId, setDeletingBudgetId] = useState(null);
    const [budgetItems, setBudgetItems] = useState(generateInitialBudgetData());
    const [formData, setFormData] = useState({ category: '', amount: '', description: '' });
    const [monthlyBudgetData, setMonthlyBudgetData] = useState({ totalAmount: 10000, startDate: '2025-03-05', endDate: '2025-04-05' });
    const [monthlyBudgetFormData, setMonthlyBudgetFormData] = useState({ ...monthlyBudgetData });

    // --- Derived State & Calculations (Memoized) ---
    const totalBudgetItemsAmount = useMemo(() => {
        return budgetItems.reduce((sum, item) => sum + item.amount, 0);
    }, [budgetItems]);

    const categoryData = useMemo(() => {
        const categories = ['Food', 'Travel', 'Utilities']; // Example fixed categories for breakdown
        return categories.map(catName => {
            const itemsInCategory = budgetItems.filter(i => i.category === catName);
            const total = itemsInCategory.reduce((s, i) => s + i.amount, 0) || 1;
            const used = total * (Math.random() * 0.6 + 0.2); // Simulate random usage
            return { name: catName, used: Math.round(used), total: Math.round(total) };
        }).filter(cat => cat.total > 1);
    }, [budgetItems]);

    // --- ECharts Options ---
    const budgetChartOptions = useMemo(() => ({
        tooltip: { trigger: 'item', formatter: '{b}: Rs {c} ({d}%)' },
        legend: { show: false },
        series: [{
            name: 'Budget Usage', type: 'pie', radius: ['65%', '85%'], avoidLabelOverlap: false,
            label: { show: false }, emphasis: { label: { show: false } }, labelLine: { show: false },
            data: [
                { value: Math.max(0, monthlyBudgetData.totalAmount * 0.6), name: 'Used', itemStyle: { color: '#ff3b30' } },
                { value: Math.max(0, monthlyBudgetData.totalAmount * 0.4), name: 'Remaining', itemStyle: { color: '#34c759' } }
            ],
            animationType: 'scale', animationEasing: 'elasticOut',
        }]
    }), [monthlyBudgetData.totalAmount]);

    // --- Animation Variants ---
    const sectionVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } } };

    // --- Modal Control ---
    const openAddModal = () => { setEditingBudget(null); setFormData({ category: availableCategories[0] || '', amount: '', description: '' }); setIsAddEditModalOpen(true); }; // Default category
    const openEditModal = (budget) => { setEditingBudget(budget); setIsAddEditModalOpen(true); };
    const openDeleteModal = (id) => { setDeletingBudgetId(id); setIsDeleteModalOpen(true); };
    const openMonthlyBudgetModal = () => { setMonthlyBudgetFormData({ totalAmount: monthlyBudgetData.totalAmount.toString(), startDate: monthlyBudgetData.startDate, endDate: monthlyBudgetData.endDate }); setIsMonthlyBudgetModalOpen(true); };
    const closeModal = () => { setIsAddEditModalOpen(false); setIsDeleteModalOpen(false); setIsMonthlyBudgetModalOpen(false); setTimeout(() => { setEditingBudget(null); setDeletingBudgetId(null); }, 300); };

    // --- Form Handling ---
    const handleFormChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
    const handleMonthlyBudgetFormChange = (e) => { const { name, value } = e.target; setMonthlyBudgetFormData(prev => ({ ...prev, [name]: value })); };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        const numericAmount = parseFloat(formData.amount) || 0;
        if (numericAmount <= 0) { alert("Amount must be greater than zero."); return; }
        if (!formData.category) { alert("Please select a category."); return; } // Ensure category selected

        if (editingBudget) {
            console.log('Updating budget item:', editingBudget.id, { ...formData, amount: numericAmount });
            // TODO: API call
            setBudgetItems(prev => prev.map(item => item.id === editingBudget.id ? { ...item, ...formData, amount: numericAmount } : item));
            alert(`Budget item ${editingBudget.id} updated! (Simulated)`);
        } else {
            const newBudget = { id: `bud-${Date.now()}`.slice(-10), ...formData, amount: numericAmount };
            console.log('Adding new budget item:', newBudget);
            // TODO: API call
            setBudgetItems(prev => [newBudget, ...prev]);
            alert(`Budget item ${newBudget.id} added! (Simulated)`);
        }
        closeModal();
    };

    const handleMonthlyBudgetFormSubmit = (e) => {
        e.preventDefault();
        const numericTotal = parseFloat(monthlyBudgetFormData.totalAmount) || 0;
        if (numericTotal <= 0) { alert("Total amount must be greater than zero."); return; }
        if (!monthlyBudgetFormData.startDate || !monthlyBudgetFormData.endDate) { alert("Start and End dates are required."); return; }
        if (new Date(monthlyBudgetFormData.startDate) >= new Date(monthlyBudgetFormData.endDate)) { alert("End date must be after start date."); return; }

        const updatedMonthlyData = { totalAmount: numericTotal, startDate: monthlyBudgetFormData.startDate, endDate: monthlyBudgetFormData.endDate };
        console.log('Updating monthly budget settings:', updatedMonthlyData);
        // TODO: API call
        setMonthlyBudgetData(updatedMonthlyData);
        alert('Monthly budget settings updated! (Simulated)');
        closeModal();
    };

    // --- Delete Confirmation ---
    const confirmDelete = () => {
        if (deletingBudgetId) {
            console.log('Deleting budget item:', deletingBudgetId);
            // TODO: API call
            setBudgetItems(prev => prev.filter(item => item.id !== deletingBudgetId));
            alert(`Budget item ${deletingBudgetId} deleted! (Simulated)`);
            closeModal();
        }
    };

    // --- Refresh Handler ---
    const handleRefresh = () => { alert("Refresh action clicked! (Implement data fetching)"); /* TODO: Fetch data */ };

    // --- Effects ---
    useEffect(() => {
        if (editingBudget) {
            setFormData({ category: editingBudget.category, amount: editingBudget.amount.toString(), description: editingBudget.description || '' });
        } else {
             setFormData({ category: availableCategories[0] || '', amount: '', description: '' }); // Reset form, default category
        }
    }, [editingBudget]);

    // --- Utility Functions ---
    const formatDate = (dateString) => { if (!dateString) return 'N/A'; try { return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); } catch (e) { console.error("Date format error:", dateString, e); return dateString; } };

    return (
      <>
        <Navbar />
        <div className="budget-page-container">

            {/* --- Top Summary Section --- */}
            <motion.section className="budget-summary-section" initial="hidden" animate="visible" variants={sectionVariants}>
                 <div className="budget-details">
                    <h3>Budget For This Month <button onClick={openMonthlyBudgetModal} className="icon-button inline-edit-button" title="Edit Monthly Budget Settings"><EditIcon size={16} /></button></h3>
                    <p>Total Budget : Rs {monthlyBudgetData.totalAmount.toLocaleString()}</p>
                    <p>Today: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric'})}</p>
                    <p>Start Date: {formatDate(monthlyBudgetData.startDate)}</p>
                    <p>End Date: {formatDate(monthlyBudgetData.endDate)}</p>
                </div>
                <div className="budget-chart-container">
                    <div className="chart-text">
                        <h4>Monthly Budget</h4>
                        <p>Usage ({Math.round(monthlyBudgetData.totalAmount * 0.6).toLocaleString()} / {monthlyBudgetData.totalAmount.toLocaleString()})</p>
                    </div>
                    <ReactECharts option={budgetChartOptions} style={{ height: '150px', width: '100%' }} notMerge={true} lazyUpdate={true} key={monthlyBudgetData.totalAmount} />
                    <span className="chart-side-text left">0%</span> <span className="chart-side-text right">100%</span>
                </div>
            </motion.section>

            {/* --- Main Content Section (Budget Items List) --- */}
            <motion.section className="budget-main-content" initial="hidden" animate="visible" variants={sectionVariants}>
                <motion.button className="add-budget-button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} variants={itemVariants} onClick={openAddModal}>Add a Budget Item</motion.button>
                <motion.div className="filter-bar" variants={itemVariants}>
                     <input type="text" placeholder="Search By Description" className="filter-input" aria-label="Search budget items by description"/>
                     <div className="filter-group">
                        <label htmlFor="filter-category">Filter By Category:</label>
                        <select id="filter-category" className="filter-select" aria-label="Filter budget items by category">
                            <option value="">All Categories</option>
                            {availableCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                         </select>
                    </div>
                     <div className="filter-group">
                        <label htmlFor="filter-amount">Sort By Amount:</label>
                        <select id="filter-amount" className="filter-select" aria-label="Sort budget items by amount">
                            <option value="asc">Ascending</option> <option value="desc">Descending</option>
                        </select>
                    </div>
                    <button className="refresh-button" onClick={handleRefresh} title="Refresh Data">Refresh <RefreshIcon /></button>
                </motion.div>
                <div className="table-breakdown-wrapper">
                    <motion.div className="budget-table-container" variants={itemVariants}>
                        <table className="budget-table" aria-label="Budget Items List">
                            <thead><tr><th scope="col">Item ID</th><th scope="col">Category</th><th scope="col">Amount</th><th scope="col">Description</th><th scope="col">Action</th></tr></thead>
                            <tbody>
                                {budgetItems.length > 0 ? (
                                    budgetItems.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.id}</td><td>{item.category}</td><td>Rs.{item.amount.toLocaleString()}</td><td>{item.description}</td>
                                            <td className="action-cell">
                                                <motion.button whileTap={{ scale: 0.9 }} className="icon-button" title={`Edit Item ${item.id}`} onClick={() => openEditModal(item)} aria-label={`Edit Item ${item.id}`}><EditIcon size={16} /></motion.button>
                                                <motion.button whileTap={{ scale: 0.9 }} className="icon-button" title={`Delete Item ${item.id}`} onClick={() => openDeleteModal(item.id)} aria-label={`Delete Item ${item.id}`}><DeleteIcon size={16} /></motion.button>
                                            </td>
                                        </tr>
                                    ))
                                ) : ( <tr><td colSpan="5" className="no-data-message">No budget items found. Click "Add a Budget Item" to get started.</td></tr> )}
                            </tbody>
                        </table>
                    </motion.div>
                    <motion.div className="category-breakdown" variants={itemVariants}>
                        <h4>Category Breakdown</h4>
                         {categoryData.length > 0 ? (
                            categoryData.map((cat, index) => (
                                <div className="category-item" key={index}>
                                    <div className="category-info"><span>{cat.name}:</span><span>{cat.used.toLocaleString()} / {cat.total.toLocaleString()}</span></div>
                                    <div className="progress-bar-container" title={`Usage: ${(cat.total > 0 ? (cat.used / cat.total) * 100 : 0).toFixed(1)}%`}>
                                        <motion.div className="progress-bar-filled" initial={{ width: 0 }} animate={{ width: cat.total > 0 ? `${(cat.used / cat.total) * 100}%` : '0%' }} transition={{ duration: 0.8, ease: "easeOut" }}></motion.div>
                                    </div>
                                </div>
                            ))
                         ) : (<p className="no-data-message">No category data.</p>)}
                    </motion.div>
                </div>
            </motion.section>

            {/* --- MODALS --- */}
            <Modal isOpen={isAddEditModalOpen} onClose={closeModal} title={editingBudget ? "Edit Budget Item" : "Add New Budget Item"}>
                <form onSubmit={handleFormSubmit} className="modal-form">
                     {editingBudget && (<div className="form-group"><label>Item ID</label><input type="text" className="input-field" value={editingBudget.id} readOnly disabled aria-label="Budget Item ID (read-only)"/></div>)}
                    {/* --- Category Dropdown --- */}
                    <div className="form-group">
                        <label htmlFor="category">Category</label>
                        <select id="category" name="category" className="select-field" required value={formData.category} onChange={handleFormChange} aria-required="true">
                             <option value="" disabled>-- Select a Category --</option>
                             {availableCategories.map(cat => (
                                 <option key={cat} value={cat}>{cat}</option>
                             ))}
                        </select>
                    </div>
                    <div className="form-group"><label htmlFor="amount">Amount (Rs)</label><input type="number" id="amount" name="amount" className="input-field" required min="0.01" step="any" value={formData.amount} onChange={handleFormChange} placeholder="e.g., 1500.50" aria-required="true"/></div>
                    <div className="form-group"><label htmlFor="description">Description (Optional)</label><textarea id="description" name="description" className="textarea-field" value={formData.description} onChange={handleFormChange} placeholder="e.g., Weekly grocery budget"/></div>
                    <div className="form-actions">
                        <motion.button type="button" className="secondary-button" onClick={closeModal} whileTap={{ scale: 0.95 }}>Cancel</motion.button>
                        <motion.button type="submit" className="primary-button" whileTap={{ scale: 0.95 }}>{editingBudget ? "Save Changes" : "Add Item"}</motion.button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isMonthlyBudgetModalOpen} onClose={closeModal} title="Edit Monthly Budget Settings">
                <form onSubmit={handleMonthlyBudgetFormSubmit} className="modal-form">
                    <div className="form-group"><label htmlFor="totalAmount">Total Monthly Budget (Rs)</label><input type="number" id="totalAmount" name="totalAmount" className="input-field" required min="1" step="any" value={monthlyBudgetFormData.totalAmount} onChange={handleMonthlyBudgetFormChange} placeholder="e.g., 10000" aria-required="true"/></div>
                    <div className="form-group"><label htmlFor="startDate">Start Date</label><input type="date" id="startDate" name="startDate" className="input-field" required value={monthlyBudgetFormData.startDate} onChange={handleMonthlyBudgetFormChange} aria-required="true"/></div>
                    <div className="form-group"><label htmlFor="endDate">End Date</label><input type="date" id="endDate" name="endDate" className="input-field" required value={monthlyBudgetFormData.endDate} onChange={handleMonthlyBudgetFormChange} aria-required="true"/></div>
                    <div className="form-actions">
                        <motion.button type="button" className="secondary-button" onClick={closeModal} whileTap={{ scale: 0.95 }}>Cancel</motion.button>
                        <motion.button type="submit" className="primary-button" whileTap={{ scale: 0.95 }}>Save Settings</motion.button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isDeleteModalOpen} onClose={closeModal} title="Confirm Deletion">
                 <div className="confirmation-text">Are you sure you want to delete budget item ID: <strong>{deletingBudgetId}</strong>? This action cannot be undone.</div>
                 <div className="confirmation-actions">
                     <motion.button type="button" className="secondary-button" onClick={closeModal} whileTap={{ scale: 0.95 }}>Cancel</motion.button>
                     <motion.button type="button" className="primary-button delete-confirm-button" onClick={confirmDelete} whileTap={{ scale: 0.95 }}>Confirm Delete</motion.button>
                 </div>
            </Modal>

        </div> {/* End budget-page-container */}
        <Footer />
      </>
    );
};

export default BudgetManagementPage;