import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';      // Adjust path if needed
import Footer from '../../components/Footer';      // Adjust path if needed
import Modal from '../../components/Modal';        // Adjust path if needed
import '../../styles/ExpenseManagementPage.css'; // Adjust path if needed

// --- Icons ---
const EditIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }} title="Edit">✏️</span>;
const DeleteIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }} title="Delete">🗑️</span>;
const RefreshIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }} title="Refresh">🔄</span>;
const LightbulbIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px` }}>💡</span>;
const WalletIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px` }}>💰</span>;
const CalendarIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px` }}>📅</span>;

// --- Initial Dummy Data Generation ---
const generateInitialExpenseData = (count = 7) =>
    Array(count).fill(null).map((_, index) => ({
        id: `exp-${index + 1}-${Date.now()}`.slice(-10),
        date: `2024-12-${23 - index}`, // Vary date slightly
        category: index % 3 === 0 ? 'Travel' : (index % 2 === 0 ? 'Food' : 'Utilities'),
        description: index % 2 === 0 ? 'Client Lunch' : 'Office Supplies',
        amount: 1500 + index * 110, // Vary amount
        notes: `This is note ${index + 1}. Some details about the expense justification or reimbursement status could go here. Sometimes notes can be quite long, requiring a 'Read More' option.`,
    }));

// --- Available categories ---
const availableCategories = ['Food', 'Travel', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Education', 'Other'];


const ExpenseManagementPage = () => {

    // --- State ---
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);

    const [editingExpense, setEditingExpense] = useState(null);
    const [deletingExpenseId, setDeletingExpenseId] = useState(null);
    const [viewingNotes, setViewingNotes] = useState(''); // Store notes text for the modal

    const [expenseItems, setExpenseItems] = useState(generateInitialExpenseData());
    const [formData, setFormData] = useState({ date: '', category: '', description: '', amount: '', notes: '' });

    // Summary card data (replace with actual fetched data)
    const [summaryData, setSummaryData] = useState({
         totalBudget: 5000,
         budgetRemaining: 3000, // Example
         daysToGo: 15,
    });
     const [categoryData, setCategoryData] = useState([
        { name: 'Food', used: 1000, total: 2500 },
        { name: 'Travel', used: 500, total: 1500 },
        { name: 'Utilities', used: 700, total: 1000 },
    ]);

    // Derived calculation for progress bar
    const budgetSpentPercentage = useMemo(() => {
        const spent = summaryData.totalBudget - summaryData.budgetRemaining;
        return summaryData.totalBudget > 0 ? Math.round((spent / summaryData.totalBudget) * 100) : 0;
    }, [summaryData]);


    // --- Animation Variants ---
    const pageVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } } };


    // --- Modal Control Functions ---
    const openAddExpenseModal = () => { setEditingExpense(null); setFormData({ date: new Date().toISOString().split('T')[0], category: availableCategories[0] || '', description: '', amount: '', notes: '' }); setIsAddEditModalOpen(true); };
    const openEditExpenseModal = (expense) => { setEditingExpense(expense); setIsAddEditModalOpen(true); }; // Form filled via useEffect
    const openDeleteExpenseModal = (id) => { setDeletingExpenseId(id); setIsDeleteModalOpen(true); };
    const openAnalyzeModal = (e) => { e.preventDefault(); setIsAnalyzeModalOpen(true); }; // Prevent default link behavior
    const openExportModal = () => { setIsExportModalOpen(true); };
    const openViewNotesModal = (notesText) => { setViewingNotes(notesText); setIsNotesModalOpen(true); };

    const closeModal = () => {
        setIsAddEditModalOpen(false); setIsDeleteModalOpen(false); setIsAnalyzeModalOpen(false);
        setIsExportModalOpen(false); setIsNotesModalOpen(false);
        setTimeout(() => { setEditingExpense(null); setDeletingExpenseId(null); setViewingNotes(''); }, 300); // Reset temp states after close
    };

    // --- Form/Action Handlers ---
    const handleFormChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };

    const handleAddEditExpenseSubmit = (e) => {
        e.preventDefault();
        const numericAmount = parseFloat(formData.amount) || 0;
        if (numericAmount <= 0) { alert("Amount must be greater than zero."); return; }
        if (!formData.category) { alert("Please select a category."); return; }
        if (!formData.date) { alert("Please select a date."); return; }

        if (editingExpense) {
            // Edit Logic
            console.log('Updating expense:', editingExpense.id, { ...formData, amount: numericAmount });
            // TODO: API Call
            setExpenseItems(prev => prev.map(item => item.id === editingExpense.id ? { ...item, ...formData, amount: numericAmount } : item));
            alert(`Expense ${editingExpense.id} updated! (Simulated)`);
        } else {
            // Add Logic
            const newExpense = { id: `exp-${Date.now()}`.slice(-10), ...formData, amount: numericAmount };
            console.log('Adding new expense:', newExpense);
            // TODO: API Call
            setExpenseItems(prev => [newExpense, ...prev]);
            alert(`Expense ${newExpense.id} added! (Simulated)`);
        }
        closeModal();
    };

    const confirmDeleteExpense = () => {
        if (deletingExpenseId) {
            console.log('Deleting expense:', deletingExpenseId);
            // TODO: API Call
            setExpenseItems(prev => prev.filter(item => item.id !== deletingExpenseId));
            alert(`Expense ${deletingExpenseId} deleted! (Simulated)`);
            closeModal();
        }
    };

    const handleExportSubmit = (e) => {
        e.preventDefault();
        // TODO: Implement actual export logic based on form data
        const format = e.target.elements.format.value;
        const dateRange = e.target.elements.dateRange.value;
        alert(`Exporting data in ${format} format for ${dateRange}... (Simulated)`);
        console.log("Export options:", { format, dateRange });
        closeModal();
    };

    const handleRefresh = () => { alert("Refresh clicked! (Implement data fetching)"); /* TODO: Fetch data */ };

    // --- Effects ---
    // Pre-fill edit form
    useEffect(() => {
        if (editingExpense) {
            setFormData({
                date: editingExpense.date || new Date().toISOString().split('T')[0],
                category: editingExpense.category || '',
                description: editingExpense.description || '',
                amount: editingExpense.amount.toString() || '',
                notes: editingExpense.notes || ''
            });
        } else {
             setFormData({ date: new Date().toISOString().split('T')[0], category: availableCategories[0] || '', description: '', amount: '', notes: '' }); // Reset
        }
    }, [editingExpense]);

    // --- Utility to truncate notes ---
    const truncateNotes = (text, maxLength = 50) => {
        if (!text || text.length <= maxLength) return { truncated: text, needsTruncating: false };
        return { truncated: text.substring(0, maxLength) + "...", needsTruncating: true };
    };

    return (
        <div className="page-container">
            <Navbar />
            <motion.main className="expense-page-content" variants={pageVariants} initial="hidden" animate="visible">

                {/* --- Top Summary Section --- */}
                <motion.section className="expense-summary-section" variants={itemVariants}>
                    <div className="summary-card budget-summary-card">
                        <h4>Budget Summary</h4>
                        <p><WalletIcon size={14} /> Total Budget : Rs {summaryData.totalBudget.toLocaleString()}</p>
                        <p><WalletIcon size={14} /> Budget Remaining : Rs {summaryData.budgetRemaining.toLocaleString()}</p>
                        <p><CalendarIcon size={14} /> Days To Go : {summaryData.daysToGo} Days</p>
                        <div className="budget-progress-bar-container">
                             <motion.div className="budget-progress-bar-filled" initial={{ width: 0 }} animate={{ width: `${budgetSpentPercentage}%` }} transition={{ duration: 0.8, ease: "easeOut" }}>
                                <span className="progress-percentage">{budgetSpentPercentage}%</span>
                            </motion.div>
                        </div>
                        <div className="progress-labels"><span>Spent</span><span>Remaining</span></div>
                    </div>
                    <div className="summary-card insight-card">
                        <h4>Insight <LightbulbIcon /></h4>
                        <p>Your budget health needs a check!</p>
                        {/* Updated Link to open modal */}
                        <a href="#analyze" onClick={openAnalyzeModal} className="analyze-link">Click to analyze <EditIcon size={12}/></a>
                    </div>
                    <div className="summary-card category-breakdown-card">
                        <h4>Category Breakdown</h4>
                        {categoryData.map((cat, index) => (
                            <div className="category-item" key={index}>
                                <div className="category-info"><span>{cat.name}:</span><span>{cat.used.toLocaleString()} / {cat.total.toLocaleString()}</span></div>
                                <div className="breakdown-progress-bar-container">
                                    <motion.div className="breakdown-progress-bar-filled" initial={{ width: 0 }} animate={{ width: cat.total > 0 ? `${(cat.used / cat.total) * 100}%` : '0%' }} transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 * index }}></motion.div>
                                </div>
                            </div>
                        ))}
                        {categoryData.length === 0 && <p className="no-data-message">No category data.</p>}
                    </div>
                </motion.section>

                {/* --- Add Expense Button --- */}
                <motion.button className="add-expense-button full-width-button" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} variants={itemVariants} onClick={openAddExpenseModal}>Add an Expense</motion.button>

                {/* --- Filter and Export Bar --- */}
                <motion.div className="filter-export-bar" variants={itemVariants}>
                    <div className="filter-controls">
                        <input type="text" placeholder="Search By Description" className="filter-input" aria-label="Search expenses by description" />
                        <div className="filter-group"><label htmlFor="filter-category-exp">Category:</label><select id="filter-category-exp" className="filter-select"><option value="">All</option>{availableCategories.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                        <div className="filter-group"><label htmlFor="filter-amount-exp">Sort By Amount:</label><select id="filter-amount-exp" className="filter-select"><option value="desc">Descending</option><option value="asc">Ascending</option></select></div>
                        <button className="refresh-button icon-text-button" onClick={handleRefresh} title="Refresh Expenses"><RefreshIcon /></button>
                    </div>
                    {/* Updated Export Button */}
                    <motion.button className="export-button secondary-button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={openExportModal}>Export</motion.button>
                </motion.div>

                {/* --- Expense Table --- */}
                <motion.div className="expense-table-container" variants={itemVariants}>
                    <table className="expense-table data-table" aria-label="Expenses List">
                        <thead><tr><th scope="col">Expense ID</th><th scope="col">Date</th><th scope="col">Category</th><th scope="col">Description</th><th scope="col">Amount</th><th scope="col" className="notes-column">Notes</th><th scope="col">Action</th></tr></thead>
                        <tbody>
                            {expenseItems.length > 0 ? (
                                expenseItems.map((item) => {
                                    const notesInfo = truncateNotes(item.notes);
                                    return (
                                        <tr key={item.id}>
                                            <td>{item.id}</td><td>{item.date}</td><td>{item.category}</td><td>{item.description}</td><td>Rs.{item.amount.toLocaleString()}</td>
                                            <td className="notes-column">
                                                {notesInfo.truncated}
                                                {notesInfo.needsTruncating && (
                                                    // Updated Link to open modal
                                                    <button onClick={() => openViewNotesModal(item.notes)} className="read-more-link">Read More...</button>
                                                )}
                                            </td>
                                            <td className="action-cell">
                                                {/* Updated Edit/Delete buttons */}
                                                <motion.button whileTap={{ scale: 0.9 }} className="icon-button" onClick={() => openEditExpenseModal(item)} title={`Edit Expense ${item.id}`} aria-label={`Edit Expense ${item.id}`}><EditIcon size={16} /></motion.button>
                                                <motion.button whileTap={{ scale: 0.9 }} className="icon-button" onClick={() => openDeleteExpenseModal(item.id)} title={`Delete Expense ${item.id}`} aria-label={`Delete Expense ${item.id}`}><DeleteIcon size={16} /></motion.button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan="7" className="no-data-message">No expenses found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </motion.div>
            </motion.main>

            {/* --- MODALS --- */}

            {/* Add/Edit Expense Modal */}
            <Modal isOpen={isAddEditModalOpen} onClose={closeModal} title={editingExpense ? "Edit Expense" : "Add New Expense"}>
                <form onSubmit={handleAddEditExpenseSubmit} className="modal-form">
                     {editingExpense && (<div className="form-group"><label>Expense ID</label><input type="text" className="input-field" value={editingExpense.id} readOnly disabled aria-label="Expense ID (read-only)"/></div>)}
                    <div className="form-group"><label htmlFor="date">Date</label><input type="date" id="date" name="date" className="input-field" required value={formData.date} onChange={handleFormChange} aria-required="true"/></div>
                    <div className="form-group"><label htmlFor="exp-category">Category</label><select id="exp-category" name="category" className="select-field" required value={formData.category} onChange={handleFormChange} aria-required="true"><option value="" disabled>-- Select Category --</option>{availableCategories.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                    <div className="form-group"><label htmlFor="exp-description">Description</label><input type="text" id="exp-description" name="description" className="input-field" required value={formData.description} onChange={handleFormChange} placeholder="e.g., Lunch meeting" aria-required="true"/></div>
                    <div className="form-group"><label htmlFor="exp-amount">Amount (Rs)</label><input type="number" id="exp-amount" name="amount" className="input-field" required min="0.01" step="any" value={formData.amount} onChange={handleFormChange} placeholder="e.g., 150.75" aria-required="true"/></div>
                    <div className="form-group"><label htmlFor="exp-notes">Notes (Optional)</label><textarea id="exp-notes" name="notes" className="textarea-field" value={formData.notes} onChange={handleFormChange} placeholder="Add any relevant details..."/></div>
                    <div className="form-actions">
                        <motion.button type="button" className="secondary-button" onClick={closeModal} whileTap={{ scale: 0.95 }}>Cancel</motion.button>
                        <motion.button type="submit" className="primary-button" whileTap={{ scale: 0.95 }}>{editingExpense ? "Save Changes" : "Add Expense"}</motion.button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={closeModal} title="Confirm Deletion">
                 <div className="confirmation-text">Are you sure you want to delete expense ID: <strong>{deletingExpenseId}</strong>?</div>
                 <div className="confirmation-actions">
                     <motion.button type="button" className="secondary-button" onClick={closeModal} whileTap={{ scale: 0.95 }}>Cancel</motion.button>
                     <motion.button type="button" className="primary-button delete-confirm-button" onClick={confirmDeleteExpense} whileTap={{ scale: 0.95 }}>Confirm Delete</motion.button>
                 </div>
            </Modal>

             {/* Analyze Modal */}
            <Modal isOpen={isAnalyzeModalOpen} onClose={closeModal} title="Budget Analysis">
                <div className="modal-body">
                    <p>This section will contain insights and analysis based on your budget and spending patterns.</p>
                    {/* TODO: Add actual analysis components/text here */}
                    <ul><li>Spending trends over time</li><li>Comparison against budget limits per category</li><li>Suggestions for savings</li></ul>
                </div>
                 <div className="form-actions"><motion.button type="button" className="primary-button" onClick={closeModal} whileTap={{ scale: 0.95 }}>Close</motion.button></div>
            </Modal>

             {/* Export Modal */}
            <Modal isOpen={isExportModalOpen} onClose={closeModal} title="Export Expenses">
                <form onSubmit={handleExportSubmit} className="modal-form">
                     <div className="form-group">
                        <label htmlFor="dateRange">Date Range:</label>
                        <select id="dateRange" name="dateRange" className="select-field" required>
                            <option value="current_month">Current Month</option>
                            <option value="last_month">Last Month</option>
                            <option value="last_3_months">Last 3 Months</option>
                            <option value="year_to_date">Year to Date</option>
                            <option value="all_time">All Time</option>
                            {/* Add custom date range option if needed */}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="format">Format:</label>
                        <select id="format" name="format" className="select-field" required>
                            <option value="csv">CSV (Comma Separated Values)</option>
                            <option value="pdf">PDF</option>
                            {/* <option value="xlsx">Excel (XLSX)</option> */}
                        </select>
                    </div>
                     <div className="form-actions">
                        <motion.button type="button" className="secondary-button" onClick={closeModal} whileTap={{ scale: 0.95 }}>Cancel</motion.button>
                        <motion.button type="submit" className="primary-button" whileTap={{ scale: 0.95 }}>Export Data</motion.button>
                    </div>
                </form>
            </Modal>

             {/* View Notes Modal */}
            <Modal isOpen={isNotesModalOpen} onClose={closeModal} title="Expense Notes">
                 <div className="modal-body view-notes-body">
                    <p>{viewingNotes || "No notes available."}</p>
                </div>
                 <div className="form-actions"><motion.button type="button" className="primary-button" onClick={closeModal} whileTap={{ scale: 0.95 }}>Close</motion.button></div>
            </Modal>

            <Footer />
        </div>
    );
};

export default ExpenseManagementPage;