import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Modal from '../../components/Modal';
import '../../styles/ExpenseManagementPage.css'; // Ensure this path is correct
import { toast } from 'react-hot-toast';
import {
    // Expense API
    fetchExpensesForCurrentMonth,
    addExpense,
    updateExpense,
    deleteExpense,
    // Categories API
    getCategories,
    // Monthly Budget API (for overall target)
    getCurrentMonthBudget,
    // Category Limit API (Budget collection)
    getBudgetsForMonth, // Fetches category limits for a specific month
} from '../../api/api'; // Adjust path if needed

// --- Icons ---
const EditIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }} title="Edit">✏️</span>;
const DeleteIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }} title="Delete">🗑️</span>;
const RefreshIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }} title="Refresh">🔄</span>;
const LightbulbIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px` }}>💡</span>;
const WalletIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px` }}>💰</span>;
const CalendarIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px` }}>📅</span>;

// --- Helper Functions ---
const getCurrentYearMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
};

const formatDate = (dateString, inputFormat = false) => {
    if (!dateString) return inputFormat ? '' : 'Not Set';
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        dateString += 'T00:00:00Z'; // Add UTC context for consistency
    }
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) throw new Error("Invalid Date object");
        if (inputFormat) {
            return date.toISOString().split('T')[0];
        } else {
            return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
        }
    } catch (e) {
        console.error("Date format error:", dateString, e);
        return inputFormat ? '' : 'Invalid Date';
    }
};

const getCurrentDateInput = () => new Date().toISOString().split('T')[0];

// --- Initial States ---
const initialExpenseFormState = { category_id: '', amount: '', description: '', expense_date: getCurrentDateInput(), notes: '' };
const initialMonthlyBudgetState = { _id: null, total_budget_amount: 0, start_date: '', end_date: '', month_year: getCurrentYearMonth() };

// ==========================================================================
// Expense Management Page Component
// ==========================================================================
const ExpenseManagementPage = () => {
    // --- State ---
    const [expenses, setExpenses] = useState([]);
    const [totalSpent, setTotalSpent] = useState(0);
    const [isLoadingExpenses, setIsLoadingExpenses] = useState(true);
    const [expensesError, setExpensesError] = useState(null);

    const [availableCategories, setAvailableCategories] = useState([]);
    const [categoryMap, setCategoryMap] = useState({}); // Maps ALL category IDs to names
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [categoriesError, setCategoriesError] = useState(null);

    const [monthlyBudgetData, setMonthlyBudgetData] = useState(initialMonthlyBudgetState);
    const [isLoadingMonthlyBudget, setIsLoadingMonthlyBudget] = useState(true);
    const [monthlyBudgetError, setMonthlyBudgetError] = useState(null);

    const [budgetItems, setBudgetItems] = useState([]); // Holds category limits for the selected month
    const [isLoadingBudgetItems, setIsLoadingBudgetItems] = useState(true); // Separate loading state
    const [budgetItemsError, setBudgetItemsError] = useState(null);

    // Holds aggregated data for categories with limits: { id: { name, limit, remaining, spent } }
    const [budgetedCategoryMap, setBudgetedCategoryMap] = useState({});
    // Holds array [{ _id, name }] for categories with limits, used for the expense form dropdown
    const [budgetedCategories, setBudgetedCategories] = useState([]);

    // Modals and temporary editing/deleting state
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [deletingExpenseId, setDeletingExpenseId] = useState(null);
    const [viewingNotes, setViewingNotes] = useState('');
    const [expenseFormData, setExpenseFormData] = useState(initialExpenseFormState);

    const selectedMonthYear = useMemo(() => getCurrentYearMonth(), []); // Fixed to current month


    // --- Data Fetching Logic ---
    const fetchPageData = useCallback(async () => {
        // Reset errors and set combined loading states
        setExpensesError(null); setCategoriesError(null); setMonthlyBudgetError(null); setBudgetItemsError(null);
        setIsLoadingExpenses(true); setIsLoadingCategories(true); setIsLoadingMonthlyBudget(true); setIsLoadingBudgetItems(true);

        let fetchedCategoriesData = null;
        let fetchedMonthlyBudgetData = null;
        let fetchedBudgetItemsData = [];
        let fetchedExpensesData = [];
        let calculatedTotalSpent = 0;

        try {
            // Fetch categories and monthly budget first as they might be needed for others
            const [categoryRes, monthlyBudgetRes] = await Promise.allSettled([
                getCategories(),
                getCurrentMonthBudget()
            ]);

            // Process Categories
            if (categoryRes.status === 'fulfilled' && categoryRes.value) {
                fetchedCategoriesData = categoryRes.value || [];
                setAvailableCategories(fetchedCategoriesData);
                const catMap = fetchedCategoriesData.reduce((acc, cat) => { acc[cat._id] = cat.name; return acc; }, {});
                setCategoryMap(catMap);
                // Set default in form state *only if* form state hasn't been set yet
                setExpenseFormData(prev => ({
                    ...prev,
                    category_id: prev.category_id || (fetchedCategoriesData.length > 0 ? fetchedCategoriesData[0]._id : '')
                 }));
            } else { throw categoryRes.reason || new Error("Failed to load categories."); }
            setIsLoadingCategories(false);

            // Process Monthly Budget Target
            if (monthlyBudgetRes.status === 'fulfilled' && monthlyBudgetRes.value?._id) {
                fetchedMonthlyBudgetData = monthlyBudgetRes.value;
                setMonthlyBudgetData({
                    _id: fetchedMonthlyBudgetData._id,
                    total_budget_amount: fetchedMonthlyBudgetData.total_budget_amount || 0,
                    start_date: formatDate(fetchedMonthlyBudgetData.start_date, true),
                    end_date: formatDate(fetchedMonthlyBudgetData.end_date, true),
                    month_year: fetchedMonthlyBudgetData.month_year || selectedMonthYear,
                });
            } else { setMonthlyBudgetData(initialMonthlyBudgetState); } // Reset if no budget found
            setIsLoadingMonthlyBudget(false);

            // Now fetch expenses and budget items (category limits)
             const [expenseRes, categoryLimitsRes] = await Promise.allSettled([
                fetchExpensesForCurrentMonth(),
                getBudgetsForMonth(selectedMonthYear)
            ]);

             // Process Expenses
             if (expenseRes.status === 'fulfilled' && expenseRes.value) {
                 fetchedExpensesData = expenseRes.value.expenses || [];
                 calculatedTotalSpent = expenseRes.value.totalSpent || 0;
                 setExpenses(fetchedExpensesData);
                 setTotalSpent(calculatedTotalSpent);
             } else { throw expenseRes.reason || new Error("Failed to load expenses."); }
             setIsLoadingExpenses(false);

             // Process Category Limits (Budget Items)
             if (categoryLimitsRes.status === 'fulfilled' && categoryLimitsRes.value) {
                 fetchedBudgetItemsData = categoryLimitsRes.value || [];
                 setBudgetItems(fetchedBudgetItemsData);
             } else { throw categoryLimitsRes.reason || new Error("Failed to load category limits."); }
             setIsLoadingBudgetItems(false);

        } catch (error) {
            console.error("Error fetching page data:", error);
            // Set specific error states based on which promises failed (check status above)
            if (error.message.includes("categor")) setCategoriesError(error.message);
            else if (error.message.includes("budget target")) setMonthlyBudgetError(error.message);
            else if (error.message.includes("limit")) setBudgetItemsError(error.message);
            else setExpensesError(error.message || "An error occurred loading page data."); // General/Expense error
            // Ensure loading spinners stop if an early fetch fails
            setIsLoadingExpenses(false); setIsLoadingCategories(false); setIsLoadingMonthlyBudget(false); setIsLoadingBudgetItems(false);
        }
    }, [selectedMonthYear]); // Removed categoryMap dependency, calculated in useEffect below


    // Effect to recalculate budgeted category map when dependencies change
    useEffect(() => {
        const newBudgetedMap = {};
        // Calculate total spent per category from the fetched expenses
        const spentPerCategory = expenses.reduce((acc, expense) => {
            const catId = expense.category_id?._id || expense.category_id;
            if (catId) { acc[catId] = (acc[catId] || 0) + (Number(expense.amount) || 0); }
            return acc;
        }, {});

        // Populate map with limit and remaining amount for budgeted categories
        budgetItems.forEach(item => {
            const catId = item.category_id?._id || item.category_id;
            if (!catId) return;
            const limit = Number(item.limit_amount) || 0;
            const spent = spentPerCategory[catId] || 0;
            const remaining = Math.max(0, limit - spent);
            const name = item.category_id?.name || categoryMap[catId] || 'Unknown'; // Use categoryMap

            if (!newBudgetedMap[catId]) {
                newBudgetedMap[catId] = { name: name, limit: 0, remaining: 0, spent: 0 };
            }
            newBudgetedMap[catId].limit += limit; // Sum limits (should ideally be unique per category/month)
            newBudgetedMap[catId].spent = spent; // Use calculated spent
            newBudgetedMap[catId].remaining = Math.max(0, newBudgetedMap[catId].limit - spent); // Recalculate based on potentially summed limit
        });

        setBudgetedCategoryMap(newBudgetedMap);
        // Update the dropdown list - only show categories present in the map
        setBudgetedCategories(Object.entries(newBudgetedMap).map(([id, data]) => ({ _id: id, name: data.name })));

    }, [budgetItems, expenses, categoryMap]); // Recalculate when limits, expenses, or category map change

    // --- Initial Data Load Effect ---
    useEffect(() => {
        fetchPageData();
    }, [fetchPageData]);


    // --- Derived State & Calculations ---
  
    const budgetRemaining = useMemo(() => Math.max(0, (monthlyBudgetData.total_budget_amount || 0) - totalSpent), [monthlyBudgetData.total_budget_amount, totalSpent]);
    const budgetSpentPercentage = useMemo(() => {
        const target = monthlyBudgetData.total_budget_amount || 0;
        return target > 0 ? Math.round((totalSpent / target) * 100) : 0;
    }, [totalSpent, monthlyBudgetData.total_budget_amount]);

    // Category breakdown card: Shows Limit vs. Spent for each category with a limit
    const categoryDataForBreakdown = useMemo(() => {
        return Object.entries(budgetedCategoryMap).map(([id, data]) => ({
            name: data.name,
            // Use actual 'spent' from the map
            used: Math.round(data.spent),
            total: Math.round(data.limit) // Total is the limit set
        })).filter(cat => cat.total > 0); // Only show categories where a limit > 0 is set
    }, [budgetedCategoryMap]);


 
    // --- Animation Variants ---
    const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } } };
    const pageVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };


    // --- Modal Control Handlers ---
    const openAddExpenseModal = () => {
        setEditingExpense(null); setExpensesError(null);
        setExpenseFormData({ ...initialExpenseFormState, category_id: budgetedCategories.length > 0 ? budgetedCategories[0]._id : '', expense_date: getCurrentDateInput() });
        setIsAddEditModalOpen(true);
    };
    const openEditExpenseModal = (expense) => {
        setEditingExpense(expense); setExpensesError(null);
        setExpenseFormData({
            category_id: expense.category_id?._id || expense.category_id || '',
            amount: expense.amount?.toString() || '', description: expense.description || '',
            expense_date: formatDate(expense.expense_date, true), notes: expense.notes || ''
        });
        setIsAddEditModalOpen(true);
    };
    const openDeleteExpenseModal = (id) => { setExpensesError(null); setDeletingExpenseId(id); setIsDeleteModalOpen(true); };
    const openAnalyzeModal = (e) => { e.preventDefault(); setIsAnalyzeModalOpen(true); };
    const openExportModal = () => { setIsExportModalOpen(true); };
    const openViewNotesModal = (notesText) => { setViewingNotes(notesText); setIsNotesModalOpen(true); };
    const closeModal = () => {
        setIsAddEditModalOpen(false); setIsDeleteModalOpen(false); setIsAnalyzeModalOpen(false);
        setIsExportModalOpen(false); setIsNotesModalOpen(false);
        setExpensesError(null); setMonthlyBudgetError(null); setBudgetItemsError(null); setCategoriesError(null);
        setTimeout(() => { setEditingExpense(null); setDeletingExpenseId(null); setViewingNotes(''); }, 300);
    };

    // --- Form Input Handler ---
    const handleExpenseFormChange = (e) => {
        const { name, value } = e.target;
        setExpenseFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- Form/Action Handlers ---
    const handleAddEditExpenseSubmit = async (e) => {
        e.preventDefault();
        setExpensesError(null);
        const numericAmount = parseFloat(expenseFormData.amount);
        const selectedCategoryId = expenseFormData.category_id;

        // Basic Validation
        if (isNaN(numericAmount) || numericAmount <= 0) { setExpensesError("Amount must be a positive number."); return; }
        if (!selectedCategoryId) { setExpensesError("Please select a category."); return; }
        if (!expenseFormData.expense_date) { setExpensesError("Please select a date."); return; }

        // Budget Limit Validation
        const categoryBudgetInfo = budgetedCategoryMap[selectedCategoryId];
        if (!categoryBudgetInfo) {
            setExpensesError(`No budget limit set for category: ${categoryMap[selectedCategoryId] || 'Selected Category'}.`);
            return;
        }
        let amountChange = numericAmount;
        if (editingExpense && editingExpense._id && (editingExpense.category_id?._id || editingExpense.category_id) === selectedCategoryId) {
            amountChange = numericAmount - (Number(editingExpense.amount) || 0);
        }
        if (amountChange > categoryBudgetInfo.remaining) {
            setExpensesError(`Amount exceeds remaining budget for ${categoryBudgetInfo.name}. Remaining: Rs ${categoryBudgetInfo.remaining.toLocaleString()}`);
            return;
        }

        const payload = {
            category_id: selectedCategoryId, amount: numericAmount, description: expenseFormData.description,
            expense_date: expenseFormData.expense_date, notes: expenseFormData.notes || null,
        };
        const isLoadingSetter = editingExpense ? setIsLoadingExpenses : setIsLoadingExpenses; // Use same loader for now
        isLoadingSetter(true);
        try {
            if (editingExpense && editingExpense._id) {
                await updateExpense(editingExpense._id, payload);
                toast.success('Expense updated successfully!');
            } else {
                await addExpense(payload);
                toast.success('Expense added successfully!');
            }
            await fetchPageData();
            closeModal();
        } catch (error) {
            console.error("Error saving expense:", error);
            setExpensesError(error.message || (editingExpense ? "Update failed." : "Add failed."));
        } finally {
            isLoadingSetter(false);
        }
    };

    const confirmDeleteExpense = async () => {
        if (!deletingExpenseId) { setExpensesError("No expense selected."); return; }
        setExpensesError(null);
        setIsLoadingExpenses(true);
        try {
            await deleteExpense(deletingExpenseId);
            toast.success('Expense deleted successfully!');
            await fetchPageData();
            closeModal();
        } catch (error) {
            console.error("Error deleting expense:", error);
            setExpensesError(error.message || "Failed to delete expense.");
        } finally {
            setIsLoadingExpenses(false);
        }
    };

    const handleExportSubmit = (e) => { e.preventDefault(); toast.success("Export functionality not implemented."); closeModal(); };
    const handleRefresh = () => { fetchPageData();toast.success("Data Refreshed"); };
    const truncateNotes = (text, maxLength = 30) => {
         if (!text || text.length <= maxLength) return { truncated: text, needsTruncating: false };
         return { truncated: text.substring(0, maxLength) + "...", needsTruncating: true };
     };

    // --- Combined Loading State ---
    const isLoading = isLoadingExpenses || isLoadingCategories || isLoadingMonthlyBudget || isLoadingBudgetItems;

    // --- Render ---
    return (
      <>
        <Navbar />
        <div className="page-container">
            <motion.main className="expense-page-content" variants={pageVariants} initial="hidden" animate="visible">

                {/* Top Summary Section */}
                <motion.section className="expense-summary-section" variants={itemVariants}>
                    <div className="summary-card budget-summary-card">
                        <h4>Budget Summary</h4>
                        {isLoadingMonthlyBudget || isLoadingExpenses ? <p>Loading...</p> : null}
                        {monthlyBudgetError ? <p className="error-message small">{monthlyBudgetError}</p> : null}
                        {!isLoadingMonthlyBudget && !isLoadingExpenses && !monthlyBudgetError ? (
                            <>
                                <p><WalletIcon size={14} /> Target: Rs {monthlyBudgetData.total_budget_amount.toLocaleString()}</p>
                                <p><WalletIcon size={14} /> Spent: Rs {totalSpent.toLocaleString()}</p>
                                <p><WalletIcon size={14} /> Remaining: Rs {budgetRemaining.toLocaleString()}</p>
                                <div className="budget-progress-bar-container" title={`Spent ${budgetSpentPercentage}% of target`}>
                                     <motion.div className="budget-progress-bar-filled" style={{backgroundColor: budgetSpentPercentage > 100 ? '#ff3b30' : 'ff3b30'}} initial={{ width: 0 }} animate={{ width: `${Math.min(100, budgetSpentPercentage)}%` }} transition={{ duration: 0.8, ease: "easeOut" }}>
                                        <span className="progress-percentage">{budgetSpentPercentage}%</span>
                                    </motion.div>
                                </div>
                                <div className="progress-labels"><span>Spent</span><span>Target</span></div>
                            </>
                        ) : null}
                    </div>
                    <div className="summary-card insight-card">
                        <h4>Insight <LightbulbIcon /></h4>
                        <p>Check your category spending!</p>
                        <a href="#analyze" onClick={openAnalyzeModal} className="analyze-link">Analyze Spending <EditIcon size={12}/></a>
                    </div>
                    <div className="summary-card category-breakdown-card">
                         <h4>Category Limits vs Spent</h4>
                         {isLoadingCategories || isLoadingBudgetItems ? <p>Loading...</p> : null}
                         {categoriesError ? <p className="error-message small">{categoriesError}</p> : null}
                         {budgetItemsError ? <p className="error-message small">{budgetItemsError}</p> : null}
                         {!isLoadingCategories && !isLoadingBudgetItems && categoryDataForBreakdown.length === 0 && <p className="no-data-message">No category limits set.</p>}
                         {!isLoadingCategories && !isLoadingBudgetItems && categoryDataForBreakdown.map((cat) => (
                            <div className="category-item" key={cat.name}>
                                <div className="category-info"><span>{cat.name}:</span><span>Spent: {cat.used.toLocaleString()} / Limit: {cat.total.toLocaleString()}</span></div>
                                <div className="breakdown-progress-bar-container" title={`Used ${(cat.total > 0 ? (cat.used / cat.total) * 100 : 0).toFixed(0)}% of limit`}>
                                    <motion.div className="breakdown-progress-bar-filled" style={{backgroundColor: cat.used > cat.total ? '#ff3b30' : '#007aff'}} initial={{ width: 0 }} animate={{ width: cat.total > 0 ? `${Math.min(100, (cat.used / cat.total) * 100)}%` : '0%' }} transition={{ duration: 0.8, ease: "easeOut" }}></motion.div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.section>

                {/* Add Expense Button */}
                <motion.button className="add-expense-button full-width-button" variants={itemVariants} onClick={openAddExpenseModal} disabled={isLoading || budgetedCategories.length === 0}>
                    {isLoadingCategories || isLoadingBudgetItems ? 'Loading...' : (budgetedCategories.length === 0 ? 'Set Category Limits First' : 'Add an Expense')}
                </motion.button>

                {/* Filter and Export Bar */}
                <motion.div className="filter-export-bar" variants={itemVariants}>
                    <div className="filter-controls">
                        <input type="text" placeholder="Search..." className="filter-input" />
                        <div className="filter-group"><label>Category:</label><select className="filter-select" disabled={isLoadingCategories}>{isLoadingCategories ? <option>...</option> : <option value="">All</option>}{availableCategories.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
                        <div className="filter-group"><label>Sort:</label><select className="filter-select"><option value="date_desc">Date (Newest)</option><option value="amount_desc">Amount (High)</option></select></div>
                        <button className="refresh-button icon-text-button" onClick={handleRefresh} title="Refresh Data" disabled={isLoading}><RefreshIcon /></button>
                    </div>
                    <motion.button className="export-button secondary-button" onClick={openExportModal}>Export</motion.button>
                </motion.div>

                 {/* Expense Table */}
                 {expensesError ? <p className="error-message">{expensesError}</p> : null}
                 <motion.div className="expense-table-container" variants={itemVariants}>
                    {isLoadingExpenses ? <p>Loading expenses...</p> : (
                        <table className="expense-table data-table" aria-label="Expenses List">
                            <thead><tr><th scope="col">Date</th><th scope="col">Category</th><th scope="col">Description</th><th scope="col">Amount</th><th scope="col" className="notes-column">Notes</th><th scope="col">Action</th></tr></thead>
                            <tbody>
                                {expenses.length > 0 ? (
                                    expenses.map((item) => {
                                        const notesInfo = truncateNotes(item.notes);
                                        return (
                                            <tr key={item._id}>
                                                <td>{formatDate(item.expense_date)}</td>
                                                <td>{item.category_id?.name || categoryMap[item.category_id] || 'N/A'}</td>
                                                <td>{item.description || '-'}</td>
                                                <td>Rs.{item.amount.toLocaleString()}</td>
                                                <td className="notes-column">
                                                    {notesInfo.truncated || '-'}
                                                    {notesInfo.needsTruncating && (<button onClick={() => openViewNotesModal(item.notes)} className="read-more-link">Read More...</button>)}
                                                </td>
                                                <td className="action-cell">
                                                    <motion.button whileTap={{ scale: 0.9 }} className="icon-button" onClick={() => openEditExpenseModal(item)} title={`Edit Expense`} disabled={isLoadingExpenses}><EditIcon size={16} /></motion.button>
                                                    <motion.button whileTap={{ scale: 0.9 }} className="icon-button" onClick={() => openDeleteExpenseModal(item._id)} title={`Delete Expense`} disabled={isLoadingExpenses}><DeleteIcon size={16} /></motion.button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : ( <tr><td colSpan="6" className="no-data-message">No expenses recorded for this period.</td></tr> )}
                            </tbody>
                        </table>
                    )}
                </motion.div>
            </motion.main>

             {/* --- MODALS --- */}
            <Modal isOpen={isAddEditModalOpen} onClose={closeModal} title={editingExpense ? "Edit Expense" : "Add New Expense"}>
                <form onSubmit={handleAddEditExpenseSubmit} className="modal-form">
                    {expensesError && <p className="error-message modal-error">{expensesError}</p>}
                    <div className="form-group"><label htmlFor="expense_date">Date</label><input type="date" id="expense_date" name="expense_date" className="input-field" required value={expenseFormData.expense_date} onChange={handleExpenseFormChange} /></div>
                    <div className="form-group">
                        <label htmlFor="category_id">Category</label>
                        <select id="category_id" name="category_id" className="select-field" required value={expenseFormData.category_id} onChange={handleExpenseFormChange} disabled={isLoadingCategories || isLoadingBudgetItems}>
                             <option value="" disabled>-- Select Budgeted Category --</option>
                             {budgetedCategories.length === 0 && !(isLoadingCategories || isLoadingBudgetItems) && <option disabled>No categories have limits set</option>}
                             {budgetedCategories.map(c => (<option key={c._id} value={c._id}>{c.name}</option>))}
                        </select>
                        {expenseFormData.category_id && budgetedCategoryMap[expenseFormData.category_id] && (
                            <small style={{ display: 'block', marginTop: '4px', color: '#666' }}> Remaining Limit: Rs {budgetedCategoryMap[expenseFormData.category_id].remaining.toLocaleString()} </small>
                        )}
                    </div>
                    <div className="form-group"><label htmlFor="description">Description</label><input type="text" id="description" name="description" className="input-field" required value={expenseFormData.description} onChange={handleExpenseFormChange} placeholder="e.g., Lunch meeting" /></div>
                    <div className="form-group"><label htmlFor="amount">Amount (Rs)</label><input type="number" id="amount" name="amount" className="input-field" required min="0.01" step="any" value={expenseFormData.amount} onChange={handleExpenseFormChange} placeholder="e.g., 150.75" /></div>
                    <div className="form-group"><label htmlFor="notes">Notes (Optional)</label><textarea id="notes" name="notes" className="textarea-field" value={expenseFormData.notes} onChange={handleExpenseFormChange} /></div>
                    <div className="form-actions">
                        <motion.button type="button" className="secondary-button" onClick={closeModal} disabled={isLoadingExpenses}>Cancel</motion.button>
                        <motion.button type="submit" className="primary-button" disabled={isLoadingExpenses}> {isLoadingExpenses ? "Saving..." : (editingExpense ? "Save Changes" : "Add Expense")} </motion.button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isDeleteModalOpen} onClose={closeModal} title="Confirm Deletion">
                 {expensesError && <p className="error-message modal-error">{expensesError}</p>}
                 <div className="confirmation-text">Are you sure you want to delete this expense?</div>
                 <div className="confirmation-actions">
                     <motion.button type="button" className="secondary-button" onClick={closeModal} disabled={isLoadingExpenses}>Cancel</motion.button>
                     <motion.button type="button" className="primary-button delete-confirm-button" onClick={confirmDeleteExpense} disabled={isLoadingExpenses}> {isLoadingExpenses ? "Deleting..." : "Confirm Delete"} </motion.button>
                 </div>
            </Modal>

            <Modal isOpen={isAnalyzeModalOpen} onClose={closeModal} title="Budget Analysis"><div className="modal-body"><p>Analysis features coming soon!</p></div><div className="form-actions"><motion.button type="button" className="primary-button" onClick={closeModal}>Close</motion.button></div></Modal>
            <Modal isOpen={isExportModalOpen} onClose={closeModal} title="Export Expenses"><form onSubmit={handleExportSubmit} className="modal-form"><div className="form-group"><label htmlFor="dateRange">Date Range:</label><select id="dateRange" name="dateRange" className="select-field" required><option value="current_month">Current Month</option>{/* TODO: Add other options */}</select></div><div className="form-group"><label htmlFor="format">Format:</label><select id="format" name="format" className="select-field" required><option value="csv">CSV</option><option value="pdf">PDF</option></select></div><div className="form-actions"><motion.button type="button" className="secondary-button" onClick={closeModal}>Cancel</motion.button><motion.button type="submit" className="primary-button">Export Data</motion.button></div></form></Modal>
            <Modal isOpen={isNotesModalOpen} onClose={closeModal} title="Expense Notes"><div className="modal-body view-notes-body"><p>{viewingNotes || "No notes."}</p></div><div className="form-actions"><motion.button type="button" className="primary-button" onClick={closeModal}>Close</motion.button></div></Modal>

            <Footer />
        </div>
      </>
    );
};

export default ExpenseManagementPage;