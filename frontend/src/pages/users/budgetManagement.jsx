import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Modal from '../../components/Modal';
import '../../styles/BudgetManagementPage.css';
import { toast } from 'react-hot-toast'; // Import toast for notifications
import {
    // Overall Monthly Budget API
    getCurrentMonthBudget,
    createMonthlyBudget,
    updateMonthlyBudget,
    // Categories API
    getCategories,
    // Category Limit Item API
    getBudgetsForMonth, // Fetches category limits for a specific month
    addBudgetItem,      // Adds a new category limit
    updateBudgetItem,   // Updates an existing category limit
    deleteBudgetItem,   // Deletes a category limit
    // TODO: Import function to fetch expenses when implementing usage tracking
    // getExpensesForMonth,
    fetchExpensesForCurrentMonth, // Placeholder for future use
} from '../../api/api'; // Adjust path if needed

// --- Icons ---
const EditIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }} title="Edit">✏️</span>;
const DeleteIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }} title="Delete">🗑️</span>;
const RefreshIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }} title="Refresh">🔄</span>;

// --- Helper Functions ---
const getCurrentYearMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
};

const formatDate = (dateString) => {
    if (!dateString) return 'Not Set';
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        dateString += 'T00:00:00Z'; // Add Z for UTC context
    }
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) throw new Error("Invalid Date object");
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
    } catch (e) {
        console.error("Date format error:", dateString, e);
        return 'Invalid Date';
    }
};

// --- Initial States ---
const initialMonthlyBudgetState = {
    _id: null, total_budget_amount: 0, start_date: '', end_date: '', month_year: getCurrentYearMonth(),
};
const initialCategoryItemFormState = { category_id: '', limit_amount: '', description: '' };

// ==========================================================================
// BudgetManagementPage Component
// ==========================================================================
const BudgetManagementPage = () => {
    // --- State ---
    const [monthlyBudgetData, setMonthlyBudgetData] = useState(initialMonthlyBudgetState);
    const [isLoadingMonthlyBudget, setIsLoadingMonthlyBudget] = useState(true);
    const [monthlyBudgetError, setMonthlyBudgetError] = useState(null);
    const [isMonthlyBudgetModalOpen, setIsMonthlyBudgetModalOpen] = useState(false);
    const [monthlyBudgetFormData, setMonthlyBudgetFormData] = useState({ total_budget_amount: '', start_date: '', end_date: '' });

    const [availableCategories, setAvailableCategories] = useState([]);
    const [categoryMap, setCategoryMap] = useState({});
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [categoriesError, setCategoriesError] = useState(null);

    const [budgetItems, setBudgetItems] = useState([]); // Holds category limits for the selected month
    const [isLoadingBudgetItems, setIsLoadingBudgetItems] = useState(false);
    const [budgetItemsError, setBudgetItemsError] = useState(null);
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingBudgetItem, setEditingBudgetItem] = useState(null); // Holds the full budget item object being edited
    const [deletingBudgetItemId, setDeletingBudgetItemId] = useState(null);
    const [categoryItemFormData, setCategoryItemFormData] = useState(initialCategoryItemFormState);

    const selectedMonthYear = useMemo(() => getCurrentYearMonth(), []); // Currently fixed to current month

    const [categoryWiseSpending, setCategoryWiseSpending] = useState([]); // Placeholder for future use
    
    const fetchExpensesForCurrent = useCallback(async () => {
        try {
            const data = await fetchExpensesForCurrentMonth(); // Placeholder for future use
            console.log("Fetched expenses for current month:", data);
    
            const categorys = calculateCategoryWiseSpending(data.expenses); // Calculating from fetched expenses
            setCategoryWiseSpending(categorys);
    
            console.log("Category-wise spending:", categorys); // log 'categorys', not 'categoryWiseSpending'
    
        } catch (error) {
            console.error("Error fetching expenses for current month:", error);
            setCategoryWiseSpending([]);
        }
    }, []);
    
    const calculateCategoryWiseSpending = (expenses) => {
        const categoryTotals = {};
    
        expenses.forEach(expense => {
            const categoryName = expense.category_id.name; // assuming category_id has a 'name' field
            if (categoryTotals[categoryName]) {
                categoryTotals[categoryName] += expense.amount;
            } else {
                categoryTotals[categoryName] = expense.amount;
            }
        });
        console.log("Category totals:", categoryTotals);
        return categoryTotals;
    };
    
    

    // --- Data Fetching Callbacks ---
    const fetchMonthlyBudget = useCallback(async () => {
        setIsLoadingMonthlyBudget(true);
        setMonthlyBudgetError(null);
        try {
            const data = await getCurrentMonthBudget();
            if (data && data._id) {
               setMonthlyBudgetData({
                    _id: data._id,
                    total_budget_amount: data.total_budget_amount || 0,
                    start_date: data.start_date ? new Date(data.start_date).toISOString().split('T')[0] : '',
                    end_date: data.end_date ? new Date(data.end_date).toISOString().split('T')[0] : '',
                    month_year: data.month_year || getCurrentYearMonth(),
                });
            } else {
                setMonthlyBudgetData(initialMonthlyBudgetState);
            }
        } catch (error) {
            console.error("Error fetching current month budget:", error);
            setMonthlyBudgetError("Could not fetch monthly budget settings.");
            setMonthlyBudgetData(initialMonthlyBudgetState);
        } finally {
            setIsLoadingMonthlyBudget(false);
        }
    }, []);

    const fetchCategories = useCallback(async () => {
        setIsLoadingCategories(true);
        setCategoriesError(null);
        try {
            const categories = await getCategories();
            const validCategories = categories || [];
            setAvailableCategories(validCategories);
            const catMap = validCategories.reduce((acc, cat) => { acc[cat._id] = cat.name; return acc; }, {});
            setCategoryMap(catMap);
            if (validCategories.length > 0 && !categoryItemFormData.category_id) {
                setCategoryItemFormData(prev => ({ ...prev, category_id: validCategories[0]._id }));
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            setCategoriesError("Could not fetch categories.");
            setAvailableCategories([]); setCategoryMap({});
        } finally {
            setIsLoadingCategories(false);
        }
    }, [categoryItemFormData.category_id]);

    const fetchCategoryBudgetItems = useCallback(async (monthYear) => {
        if (!monthYear) return;
        setIsLoadingBudgetItems(true);
        setBudgetItemsError(null);
        setBudgetItems([]);
        try {
            const items = await getBudgetsForMonth(monthYear);
            setBudgetItems(items || []); // Assuming backend sends populated/correct data
        } catch (error) {
            console.error(`Error fetching category budget items for ${monthYear}:`, error);
            setBudgetItemsError(error.message || "Could not fetch category budget items.");
            setBudgetItems([]);
        } finally {
            setIsLoadingBudgetItems(false);
        }
    }, []); // Removed categoryMap dependency here, rely on backend population or map later


    // --- Initial Data Load Effect ---
    useEffect(() => {
        // Fetch categories first, then budget items which might rely on categoryMap
        fetchCategories().then(() => {
             fetchCategoryBudgetItems(selectedMonthYear);
        });
        fetchMonthlyBudget();
        fetchExpensesForCurrent(); // Placeholder for future use
        // Order matters if one fetch depends on data from another (like categoryMap for display)
    }, [fetchMonthlyBudget, fetchCategories, fetchCategoryBudgetItems, selectedMonthYear]); // Removed fetchExpensesForCurrentMonth from dependencies


    // --- Derived State & Calculations ---
    const totalCategoryLimitsSet = useMemo(() => {
        return budgetItems.reduce((sum, item) => sum + (Number(item.limit_amount) || 0), 0);
    }, [budgetItems]);

    // Category breakdown: Shows Limit vs. Used (simulated) for each category with a limit set
    const categoryDataForBreakdown = useMemo(() => {
        const categoryMapWithSums = budgetItems.reduce((acc, item) => {
            const categoryId = item.category_id?._id || item.category_id || 'Unknown';
            const categoryName = item.category_id?.name || categoryMap[categoryId] || 'Unknown';
            const limit = Number(item.limit_amount) || 0;
            // Initialize or update the category data
            if (!acc[categoryId]) {
                acc[categoryId] = { name: categoryName, used: 0, total: 0 };
            }
            acc[categoryId].total += limit;
            // Using CategoryWiseSpending fetched from the backend 
            const usedAmount = categoryWiseSpending[categoryName] || 0; // Placeholder for actual used amount
            acc[categoryId].used = usedAmount; // Simulated usage for now
            
            return acc;
        }, {});

        // Convert the map to an array and round values
        return Object.values(categoryMapWithSums).map(cat => ({
            ...cat,
            used: Math.round(cat.used),
            total: Math.round(cat.total),
        })).filter(cat => cat.total > 0); // Only show categories where a limit > 0 is set
    }, [budgetItems, categoryMap]); // Depends on fetched budget items and category map


    // --- ECharts Options (Overall Target vs. Sum of Category Limits) ---
    const budgetChartOptions = useMemo(() => {
        const targetAmount = monthlyBudgetData.total_budget_amount || 0;
        const totalLimits = totalCategoryLimitsSet; // Use the memoized calculation
        const remainingUnallocatedTarget = Math.max(0, targetAmount - totalLimits);

        // console.log("Chart - Limits:", totalLimits, "Target:", targetAmount, "Unallocated:", remainingUnallocatedTarget);

        return {
            tooltip: {
                trigger: 'item',
                formatter: (params) => `${params.name}: Rs ${params.value.toLocaleString()} (${params.percent}%)`
            },
            legend: { show: false },
            series: [{
                name: 'Budget Allocation Status',
                type: 'pie',
                radius: ['65%', '85%'],
                avoidLabelOverlap: false,
                label: { show: false }, emphasis: { label: { show: false } }, labelLine: { show: false },
                // Prevent chart from showing only one segment if target is 0 or limits perfectly match target
                data: (totalLimits === 0 && remainingUnallocatedTarget === 0)
                    ? [{ value: 1, name: 'No Budget Set', itemStyle: { color: '#cccccc' } }] // Placeholder if empty
                    : [
                        { value: Math.round(totalLimits), name: 'Allocated to Categories', itemStyle: { color: '#34c759' } }, // Sum of limits
                        { value: Math.round(remainingUnallocatedTarget), name: 'Unallocated Target', itemStyle: { color: '#ff9500' } } // Target - Sum of limits
                    ].filter(d => d.value > 0), // Only include segments with value > 0
                animationType: 'scale', animationEasing: 'elasticOut',
            }]
        };
    }, [monthlyBudgetData.total_budget_amount, totalCategoryLimitsSet]); // Depend on target and calculated sum


    // --- Animation Variants ---
    const sectionVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } } };

    // --- Modal Control Handlers ---
    const openAddBudgetItemModal = () => {
        setEditingBudgetItem(null);
        setBudgetItemsError(null);
        setCategoryItemFormData({ ...initialCategoryItemFormState, category_id: availableCategories.length > 0 ? availableCategories[0]._id : '' });
        setIsAddEditModalOpen(true);
    };
    const openEditBudgetItemModal = (item) => {
        setEditingBudgetItem(item);
        setBudgetItemsError(null);
        setCategoryItemFormData({
            category_id: item.category_id?._id || item.category_id || '',
            limit_amount: item.limit_amount?.toString() || '',
            description: item.description || ''
        });
        setIsAddEditModalOpen(true);
    };
    const openDeleteBudgetItemModal = (id) => {
        setBudgetItemsError(null);
        setDeletingBudgetItemId(id);
        setIsDeleteModalOpen(true);
    };
    const openMonthlyBudgetModal = () => {
        setMonthlyBudgetError(null);
        setMonthlyBudgetFormData({
            total_budget_amount: monthlyBudgetData.total_budget_amount.toString(),
            start_date: monthlyBudgetData.start_date || '',
            end_date: monthlyBudgetData.end_date || '',
        });
        setIsMonthlyBudgetModalOpen(true);
    };
    const closeModal = () => {
        setIsAddEditModalOpen(false); setIsDeleteModalOpen(false); setIsMonthlyBudgetModalOpen(false);
        setMonthlyBudgetError(null); setBudgetItemsError(null); setCategoriesError(null);
        setTimeout(() => { setEditingBudgetItem(null); setDeletingBudgetItemId(null); }, 300);
    };

    // --- Form Input Handlers ---
    const handleCategoryItemFormChange = (e) => {
        const { name, value } = e.target;
        setCategoryItemFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleMonthlyBudgetFormChange = (e) => {
        const { name, value } = e.target;
        setMonthlyBudgetFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- Form Submission Handlers ---
    const handleCategoryItemFormSubmit = async (e) => {
        e.preventDefault();
        setBudgetItemsError(null);
        const numericAmount = parseFloat(categoryItemFormData.limit_amount);
        if (isNaN(numericAmount) || numericAmount <= 0) { setBudgetItemsError("Limit amount must be a positive number."); return; }
        if (!categoryItemFormData.category_id) { setBudgetItemsError("Please select a category."); return; }

        const commonPayload = { category_id: categoryItemFormData.category_id, limit_amount: numericAmount, description: categoryItemFormData.description || null };
        setIsLoadingBudgetItems(true);
        try {
            if (editingBudgetItem && editingBudgetItem._id) {
                await updateBudgetItem(editingBudgetItem._id, commonPayload);
                toast.success(`Category limit updated successfully!`);
            } else {
                const createPayload = { ...commonPayload, month_year: selectedMonthYear };
                await addBudgetItem(createPayload);
                toast.success(`Category limit added successfully!`);
            }
            await fetchCategoryBudgetItems(selectedMonthYear);
            closeModal();
        } catch (error) {
            console.error("Error saving category budget item:", error);
            setBudgetItemsError(error.message || (editingBudgetItem ? "Failed to update." : "Failed to add."));
        } finally {
            setIsLoadingBudgetItems(false);
        }
    };

    const handleMonthlyBudgetFormSubmit = async (e) => {
        e.preventDefault();
        setMonthlyBudgetError(null);
        const numericTotal = parseFloat(monthlyBudgetFormData.total_budget_amount) || 0;
        const { start_date, end_date } = monthlyBudgetFormData;
        if (numericTotal < 0) { setMonthlyBudgetError("Total amount cannot be negative."); return; }
        if (!start_date || !end_date) { setMonthlyBudgetError("Start and End dates are required."); return; }
        if (new Date(start_date) >= new Date(end_date)) { setMonthlyBudgetError("End date must be after start date."); return; }
        const payload = { total_budget_amount: numericTotal, start_date, end_date };

        setIsLoadingMonthlyBudget(true);
        try {
            let updatedData;
            if (monthlyBudgetData._id) {
                updatedData = await updateMonthlyBudget(monthlyBudgetData._id, payload);
                toast.success('Monthly budget settings updated!');
            } else {
                updatedData = await createMonthlyBudget(payload);
                toast.success('Monthly budget settings created!');
            }
            if (updatedData && updatedData._id) {
                 setMonthlyBudgetData({
                    _id: updatedData._id,
                    total_budget_amount: updatedData.total_budget_amount || 0,
                    start_date: updatedData.start_date ? new Date(updatedData.start_date).toISOString().split('T')[0] : '',
                    end_date: updatedData.end_date ? new Date(updatedData.end_date).toISOString().split('T')[0] : '',
                    month_year: updatedData.month_year || getCurrentYearMonth(),
                 });
            }
            closeModal();
        } catch (error) {
            console.error("Error saving monthly budget settings:", error);
            setMonthlyBudgetError(error.message || (monthlyBudgetData._id ? "Update failed." : "Create failed."));
        } finally {
             setIsLoadingMonthlyBudget(false);
        }
    };

    // --- Delete Handler ---
    const confirmDeleteItem = async () => {
        if (!deletingBudgetItemId) { setBudgetItemsError("No item selected."); return; }
        setBudgetItemsError(null);
        setIsLoadingBudgetItems(true);
        try {
            await deleteBudgetItem(deletingBudgetItemId);
            toast.success(`Category limit deleted successfully!`);
            await fetchCategoryBudgetItems(selectedMonthYear);
            closeModal();
        } catch (error) {
            console.error("Error deleting category budget item:", error);
            setBudgetItemsError(error.message || "Failed to delete category limit.");
        } finally {
            setIsLoadingBudgetItems(false);
        }
    };

    // --- Refresh Handler ---
    const handleRefresh = () => {
        setMonthlyBudgetError(null); setBudgetItemsError(null); setCategoriesError(null);
        fetchMonthlyBudget();
        fetchCategories().then(() => fetchCategoryBudgetItems(selectedMonthYear)); // Ensure categories load before items if needed
        toast.success("Data refreshed successfully!");
    };

    // --- Combined Loading State ---
    const isLoading = isLoadingMonthlyBudget || isLoadingCategories || isLoadingBudgetItems;

    // --- Render ---
    return (
      <>
        <Navbar />
        <div className="budget-page-container">

            {/* Overall Monthly Budget Section */}
            <motion.section className="budget-summary-section" initial="hidden" animate="visible" variants={sectionVariants}>
                 <div className="budget-details">
                    <h3>Budget For This Month
                        <button onClick={openMonthlyBudgetModal} className="icon-button inline-edit-button" title="Edit Monthly Budget Settings" disabled={isLoadingMonthlyBudget}>
                            <EditIcon size={16} />
                        </button>
                    </h3>
                    {isLoadingMonthlyBudget ? <p>Loading settings...</p> : null}
                    {monthlyBudgetError && !isMonthlyBudgetModalOpen ? <p className="error-message">{monthlyBudgetError}</p> : null}
                    {!isLoadingMonthlyBudget && !monthlyBudgetError ? (
                        <>
                            <p>Overall Target: Rs {monthlyBudgetData.total_budget_amount.toLocaleString()}</p>
                            <p>Start Date: {formatDate(monthlyBudgetData.start_date)}</p>
                            <p>End Date: {formatDate(monthlyBudgetData.end_date)}</p>
                        </>
                    ) : null}
                     <p>Today: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric'})}</p>
                </div>
                <div className="budget-chart-container">
                    <div className="chart-text">
                        {/* Changed title to reflect chart content */}
                        <h4>Budget Allocation Status</h4>
                        <p>Target: Rs {monthlyBudgetData.total_budget_amount.toLocaleString()}</p>
                        <p>Allocated: Rs {totalCategoryLimitsSet.toLocaleString()}</p>
                    </div>
                     {isLoadingMonthlyBudget || isLoadingBudgetItems ? <p>Loading chart...</p> :
                         <ReactECharts
                            option={budgetChartOptions}
                            style={{ height: '150px', width: '100%' }}
                            notMerge={true} // Re-renders chart completely when options change
                            lazyUpdate={true}
                            // Key changes when relevant data changes to help force re-render if needed
                            key={`${monthlyBudgetData.total_budget_amount}-${totalCategoryLimitsSet}`}
                        />
                     }
                    <span className="chart-side-text left">0%</span> <span className="chart-side-text right">100%</span>
                </div>
            </motion.section>

            {/* Category Budget Limits Section */}
            <motion.section className="budget-main-content" initial="hidden" animate="visible" variants={sectionVariants}>
                <motion.button className="add-budget-button" variants={itemVariants} onClick={openAddBudgetItemModal} disabled={isLoadingCategories}>
                    Add Category Budget Limit
                </motion.button>

                {/* Filters */}
                <motion.div className="filter-bar" variants={itemVariants}>
                     <input type="text" placeholder="Search By Description" className="filter-input" aria-label="Search budget items by description"/>
                     <div className="filter-group">
                        <label htmlFor="filter-category">Filter By Category:</label>
                        <select id="filter-category" className="filter-select" aria-label="Filter budget items by category" disabled={isLoadingCategories}>
                             {isLoadingCategories ? <option>Loading...</option> : <option value="">All Categories</option>}
                            {availableCategories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                         </select>
                    </div>
                    <button className="refresh-button" onClick={handleRefresh} title="Refresh Data" disabled={isLoading}>
                        Refresh <RefreshIcon />
                    </button>
                </motion.div>

                 {/* Error Displays */}
                 {budgetItemsError ? <p className="error-message">{budgetItemsError}</p> : null}
                 {categoriesError ? <p className="error-message">{categoriesError}</p> : null}

                {/* Table & Breakdown */}
                <div className="table-breakdown-wrapper">
                    <motion.div className="budget-table-container" variants={itemVariants}>
                         <h4 style={{ textAlign: 'center', marginBottom: '10px' }}>Category Budget Limits for {getCurrentYearMonth()}</h4>
                         {isLoadingBudgetItems ? <p>Loading category limits...</p> : (
                            <table className="budget-table" aria-label="Category Budget Limits List">
                                <thead><tr><th scope="col">Category</th><th scope="col">Limit Amount</th><th scope="col">Description</th><th scope="col">Action</th></tr></thead>
                                <tbody>
                                    {budgetItems.length > 0 ? (
                                        budgetItems.map((item) => (
                                            <tr key={item._id}>
                                                <td>{item.category_id?.name || categoryMap[item.category_id] || 'Unknown'}</td>
                                                <td>Rs.{item.limit_amount?.toLocaleString() || 0}</td>
                                                <td>{item.description || '-'}</td>
                                                <td className="action-cell">
                                                    <motion.button whileTap={{ scale: 0.9 }} className="icon-button" title={`Edit Item`} onClick={() => openEditBudgetItemModal(item)} disabled={isLoadingBudgetItems}> <EditIcon size={16} /> </motion.button>
                                                    <motion.button whileTap={{ scale: 0.9 }} className="icon-button" title={`Delete Item`} onClick={() => openDeleteBudgetItemModal(item._id)} disabled={isLoadingBudgetItems}> <DeleteIcon size={16} /> </motion.button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : ( <tr><td colSpan="4" className="no-data-message">No category budget limits found for this month.</td></tr> )}
                                </tbody>
                                {budgetItems.length > 0 && (
                                    <tfoot><tr><th scope="row">Total Limits Set:</th><td><strong>Rs.{totalCategoryLimitsSet.toLocaleString()}</strong></td><td colSpan="2"></td></tr></tfoot>
                                )}
                            </table>
                         )}
                    </motion.div>
                    {/* Category Breakdown */}
                    <motion.div className="category-breakdown" variants={itemVariants}>
                        {/* TODO: Update title when using real expense data */}
                        <h4>Category Usage (Simulated)</h4>
                        {isLoadingCategories || isLoadingBudgetItems ? <p>Loading breakdown...</p> : null}
                         {categoryDataForBreakdown.length > 0 ? (
                            categoryDataForBreakdown.map((cat) => (
                                <div className="category-item" key={cat.name}>
                                    <div className="category-info"><span>{cat.name}:</span><span>Rs {cat.used.toLocaleString()} / {cat.total.toLocaleString()}</span></div>
                                    <div className="progress-bar-container" title={`Simulated Usage: ${(cat.total > 0 ? (cat.used / cat.total) * 100 : 0).toFixed(1)}%`}>
                                        <motion.div className="progress-bar-filled" initial={{ width: 0 }} animate={{ width: cat.total > 0 ? `${(cat.used / cat.total) * 100}%` : '0%' }} transition={{ duration: 0.8, ease: "easeOut" }}></motion.div>
                                    </div>
                                </div>
                            ))
                         ) : (!isLoadingCategories && !isLoadingBudgetItems ? <p className="no-data-message">No category limits set.</p> : null)}
                    </motion.div>
                </div>
            </motion.section>

            {/* --- Modals --- */}
            {/* Add/Edit Category Limit Modal */}
            <Modal isOpen={isAddEditModalOpen} onClose={closeModal} title={editingBudgetItem ? "Edit Category Budget Limit" : "Add New Category Budget Limit"}>
                <form onSubmit={handleCategoryItemFormSubmit} className="modal-form">
                    {budgetItemsError && <p className="error-message modal-error">{budgetItemsError}</p>}
                    <div className="form-group">
                        <label htmlFor="category_id">Category</label>
                        <select id="category_id" name="category_id" className="select-field" required value={categoryItemFormData.category_id} onChange={handleCategoryItemFormChange} disabled={isLoadingCategories}>
                             {isLoadingCategories ? <option>Loading...</option> : <option value="" disabled>-- Select --</option>}
                             {availableCategories.map(cat => (<option key={cat._id} value={cat._id}>{cat.name}</option>))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="limit_amount">Limit Amount (Rs)</label>
                        <input type="number" id="limit_amount" name="limit_amount" className="input-field" required min="0.01" step="any" value={categoryItemFormData.limit_amount} onChange={handleCategoryItemFormChange} placeholder="e.g., 500" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="description">Description (Optional)</label>
                        <textarea id="description" name="description" className="textarea-field" value={categoryItemFormData.description} onChange={handleCategoryItemFormChange} placeholder="e.g., Monthly grocery limit" />
                    </div>
                    <div className="form-actions">
                        <motion.button type="button" className="secondary-button" onClick={closeModal} disabled={isLoadingBudgetItems}>Cancel</motion.button>
                        <motion.button type="submit" className="primary-button" disabled={isLoadingBudgetItems}> {isLoadingBudgetItems ? "Saving..." : (editingBudgetItem ? "Save Changes" : "Add Limit")} </motion.button>
                    </div>
                </form>
            </Modal>

            {/* Edit/Create Overall Monthly Budget Modal */}
            <Modal isOpen={isMonthlyBudgetModalOpen} onClose={closeModal} title={monthlyBudgetData._id ? "Edit Monthly Budget Settings" : "Create Monthly Budget Settings"}>
                <form onSubmit={handleMonthlyBudgetFormSubmit} className="modal-form">
                    {monthlyBudgetError && <p className="error-message modal-error">{monthlyBudgetError}</p>}
                    <div className="form-group">
                        <label htmlFor="total_budget_amount">Total Monthly Budget (Rs)</label>
                        <input type="number" id="total_budget_amount" name="total_budget_amount" className="input-field" required min="0" step="any" value={monthlyBudgetFormData.total_budget_amount} onChange={handleMonthlyBudgetFormChange} placeholder="e.g., 10000"/>
                    </div>
                    <div className="form-group">
                        <label htmlFor="start_date">Start Date</label>
                        <input type="date" id="start_date" name="start_date" className="input-field" required value={monthlyBudgetFormData.start_date} onChange={handleMonthlyBudgetFormChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="end_date">End Date</label>
                        <input type="date" id="end_date" name="end_date" className="input-field" required value={monthlyBudgetFormData.end_date} onChange={handleMonthlyBudgetFormChange} />
                    </div>
                    <div className="form-actions">
                        <motion.button type="button" className="secondary-button" onClick={closeModal} disabled={isLoadingMonthlyBudget}>Cancel</motion.button>
                        <motion.button type="submit" className="primary-button" disabled={isLoadingMonthlyBudget}> {isLoadingMonthlyBudget ? "Saving..." : (monthlyBudgetData._id ? "Save Settings" : "Create Budget")} </motion.button>
                    </div>
                </form>
            </Modal>

            {/* Delete Category Limit Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={closeModal} title="Confirm Deletion">
                 {budgetItemsError && <p className="error-message modal-error">{budgetItemsError}</p>}
                 <div className="confirmation-text">Are you sure you want to delete this category budget limit? This action cannot be undone.</div>
                 <div className="confirmation-actions">
                     <motion.button type="button" className="secondary-button" onClick={closeModal} disabled={isLoadingBudgetItems}>Cancel</motion.button>
                     <motion.button type="button" className="primary-button delete-confirm-button" onClick={confirmDeleteItem} disabled={isLoadingBudgetItems}> {isLoadingBudgetItems ? "Deleting..." : "Confirm Delete"} </motion.button>
                 </div>
            </Modal>

        </div> {/* End budget-page-container */}
        <Footer />
      </>
    );
};

export default BudgetManagementPage;