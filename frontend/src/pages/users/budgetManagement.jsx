import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Modal from '../../components/Modal';
import '../../styles/BudgetManagementPage.css';
import {
    getCurrentMonthBudget,
    createMonthlyBudget,
    updateMonthlyBudget,
    getCategories, // Assuming getCategories fetches user's categories [{_id: '...', name: '...'}]
    
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
        dateString += 'T00:00:00';
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

// Initial state for the overall monthly budget
const initialMonthlyBudgetState = {
    _id: null,
    total_budget_amount: 0,
    start_date: '',
    end_date: '',
    month_year: getCurrentYearMonth(),
};

// Initial state for the category budget item form
const initialCategoryItemFormState = {
    category_id: '', // Use ID
    limit_amount: '', // Use correct field name
    description: '',
};

const BudgetManagementPage = () => {
    // --- State ---
    // Overall Monthly Budget (MonthlyBudget Collection)
    const [monthlyBudgetData, setMonthlyBudgetData] = useState(initialMonthlyBudgetState);
    const [isLoadingMonthlyBudget, setIsLoadingMonthlyBudget] = useState(true);
    const [monthlyBudgetError, setMonthlyBudgetError] = useState(null);
    const [isMonthlyBudgetModalOpen, setIsMonthlyBudgetModalOpen] = useState(false);
    const [monthlyBudgetFormData, setMonthlyBudgetFormData] = useState({ total_budget_amount: '', start_date: '', end_date: '' });

    // Categories (User's available categories)
    const [availableCategories, setAvailableCategories] = useState([]); // Fetched from API
    const [categoryMap, setCategoryMap] = useState({}); // For mapping ID to Name: { 'catId1': 'Food', ... }
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [categoriesError, setCategoriesError] = useState(null);

    // Category-Specific Budget Items (Budget Collection)
    // TODO: Replace dummy logic with actual API integration
    const [budgetItems, setBudgetItems] = useState([]); // Fetched from API - start empty
    const [isLoadingBudgetItems, setIsLoadingBudgetItems] = useState(false); // Set true when fetching
    const [budgetItemsError, setBudgetItemsError] = useState(null);
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingBudgetItem, setEditingBudgetItem] = useState(null); // The item being edited (needs _id)
    const [deletingBudgetItemId, setDeletingBudgetItemId] = useState(null); // The ID of item to delete
    const [categoryItemFormData, setCategoryItemFormData] = useState(initialCategoryItemFormState);


    // --- Data Fetching ---
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
            setAvailableCategories(categories || []);
            // Create a map for easy name lookup
            const catMap = (categories || []).reduce((acc, cat) => {
                acc[cat._id] = cat.name;
                return acc;
            }, {});
            setCategoryMap(catMap);
            // Set default category in form if not already set and categories exist
            if (categories && categories.length > 0 && !categoryItemFormData.category_id) {
                setCategoryItemFormData(prev => ({ ...prev, category_id: categories[0]._id }));
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            setCategoriesError("Could not fetch categories.");
            setAvailableCategories([]);
            setCategoryMap({});
        } finally {
            setIsLoadingCategories(false);
        }
    }, [categoryItemFormData.category_id]); // Refetch if default needs setting, maybe remove dependency

    // TODO: Implement fetch function for category budget items
    const fetchCategoryBudgetItems = useCallback(async (monthYear) => {
        setIsLoadingBudgetItems(true);
        setBudgetItemsError(null);
        setBudgetItems([]); // Clear previous items
        console.log(`TODO: Implement API call to fetch budget items for ${monthYear}`);
        try {
            // const items = await getBudgetsForMonth(monthYear); // API Call Placeholder
            // setBudgetItems(items || []);
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
            // setBudgetItems(generateDummyItems(5)); // Replace with real data
            console.warn("Using placeholder logic for fetching category budget items.");
        } catch (error) {
            console.error(`Error fetching category budget items for ${monthYear}:`, error);
            setBudgetItemsError("Could not fetch category budget items.");
            setBudgetItems([]);
        } finally {
            setIsLoadingBudgetItems(false);
        }
    }, []); // Add dependencies if monthYear changes

    useEffect(() => {
        fetchMonthlyBudget();
        fetchCategories();
        fetchCategoryBudgetItems(getCurrentYearMonth()); // Fetch for current month initially
    }, [fetchMonthlyBudget, fetchCategories, fetchCategoryBudgetItems]);


    // --- Derived State & Calculations ---
    // Calculation based on category-specific budget items (Budget Collection)
    // TODO: Update when API for budgetItems is integrated
    const totalCategoryLimitsSet = useMemo(() => {
        // return budgetItems.reduce((sum, item) => sum + (item.limit_amount || 0), 0);
        return 0; // Placeholder until API is integrated
    }, [budgetItems]);

    // Category breakdown based on category-specific budget items
    // TODO: Update when API for budgetItems is integrated
    const categoryDataForBreakdown = useMemo(() => {
        // Placeholder logic - needs real budgetItems and expense data
        return availableCategories.map(cat => {
            // Find budget limit set for this category (replace with real data structure)
            // const limit = budgetItems.find(item => item.category_id === cat._id)?.limit_amount || 1;
            const limit = (Math.random() * 500) + 50; // Dummy limit
            // Find expenses for this category (needs another fetch)
            const used = limit * (Math.random() * 0.7); // Dummy usage
            return { name: cat.name, used: Math.round(used), total: Math.round(limit) };
        }).filter(cat => cat.total > 0);
    }, [availableCategories, budgetItems]); // Depends on fetched categories and budget items


    // --- ECharts Options (Overall Monthly Budget Target) ---
    const budgetChartOptions = useMemo(() => {
        // TODO: Fetch actual expense data to show real usage vs target
        const targetAmount = monthlyBudgetData.total_budget_amount || 0;
        const simulatedUsed = targetAmount * 0.6; // Simulate usage
        const remaining = Math.max(0, targetAmount - simulatedUsed);
        return {
            tooltip: { trigger: 'item', formatter: '{b}: Rs {c} ({d}%)' },
            legend: { show: false },
            series: [{
                name: 'Overall Budget Usage', type: 'pie', radius: ['65%', '85%'], avoidLabelOverlap: false,
                label: { show: false }, emphasis: { label: { show: false } }, labelLine: { show: false },
                data: [
                    { value: Math.round(simulatedUsed), name: 'Used (Simulated)', itemStyle: { color: '#ff3b30' } },
                    { value: Math.round(remaining), name: 'Remaining', itemStyle: { color: '#34c759' } }
                ],
                animationType: 'scale', animationEasing: 'elasticOut',
            }]
        };
    }, [monthlyBudgetData.total_budget_amount]);

    // --- Animation Variants ---
    const sectionVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } } };

    // --- Modal Control ---
    const openAddBudgetItemModal = () => {
        setEditingBudgetItem(null);
        setCategoryItemFormData({
            ...initialCategoryItemFormState,
            // Set default category if available
            category_id: availableCategories.length > 0 ? availableCategories[0]._id : ''
        });
        setIsAddEditModalOpen(true);
    };

    const openEditBudgetItemModal = (item) => {
        setEditingBudgetItem(item);
        setCategoryItemFormData({
            // Ensure fields match the expected structure from your API
            category_id: item.category_id || '', // Use category_id
            limit_amount: item.limit_amount?.toString() || '', // Use limit_amount
            description: item.description || ''
        });
        setIsAddEditModalOpen(true);
    };

    const openDeleteBudgetItemModal = (id) => {
        setDeletingBudgetItemId(id);
        setIsDeleteModalOpen(true);
    };

    const openMonthlyBudgetModal = () => {
        setMonthlyBudgetFormData({
            total_budget_amount: monthlyBudgetData.total_budget_amount.toString(),
            start_date: monthlyBudgetData.start_date || '',
            end_date: monthlyBudgetData.end_date || '',
        });
        setIsMonthlyBudgetModalOpen(true);
    };

    const closeModal = () => {
        setIsAddEditModalOpen(false);
        setIsDeleteModalOpen(false);
        setIsMonthlyBudgetModalOpen(false);
        setMonthlyBudgetError(null);
        setBudgetItemsError(null);
        setCategoriesError(null);
        setTimeout(() => {
            setEditingBudgetItem(null);
            setDeletingBudgetItemId(null);
        }, 300);
    };

    // --- Form Handling ---
    const handleCategoryItemFormChange = (e) => {
        const { name, value } = e.target;
        setCategoryItemFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleMonthlyBudgetFormChange = (e) => {
        const { name, value } = e.target;
        setMonthlyBudgetFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- Form Submission ---
    // Submit handler for Category Budget Items (Budget Collection)
    // TODO: Implement API calls (addBudgetItem, updateBudgetItem)
    const handleCategoryItemFormSubmit = async (e) => {
        e.preventDefault();
        setBudgetItemsError(null);

        const numericAmount = parseFloat(categoryItemFormData.limit_amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            setBudgetItemsError("Limit amount must be a positive number.");
            return;
        }
        if (!categoryItemFormData.category_id) {
            setBudgetItemsError("Please select a category.");
            return;
        }

        const payload = {
            category_id: categoryItemFormData.category_id,
            limit_amount: numericAmount,
            description: categoryItemFormData.description || null,
            month_year: getCurrentYearMonth(), // Or selected month if applicable
        };

        setIsLoadingBudgetItems(true);
        console.log("TODO: Implement API call for category budget item save/update");
        try {
            if (editingBudgetItem) {
                console.log('Updating category budget item:', editingBudgetItem._id, payload);
                // await updateBudgetItem(editingBudgetItem._id, payload); // API Call Placeholder
                alert(`Category limit updated! (Simulated)`);
            } else {
                console.log('Adding new category budget item:', payload);
                // const newItem = await addBudgetItem(payload); // API Call Placeholder
                alert(`Category limit added! (Simulated)`);
            }
            // Refetch items after successful save/update
            // await fetchCategoryBudgetItems(getCurrentYearMonth()); // Refetch Placeholder
            closeModal();
        } catch (error) {
            console.error("Error saving category budget item:", error);
            setBudgetItemsError(error.message || "Failed to save category limit.");
        } finally {
            setIsLoadingBudgetItems(false);
        }
    };

    // Submit handler for Overall Monthly Budget (MonthlyBudget Collection)
    const handleMonthlyBudgetFormSubmit = async (e) => {
        e.preventDefault();
        setMonthlyBudgetError(null);

        const numericTotal = parseFloat(monthlyBudgetFormData.total_budget_amount) || 0;
        const { start_date, end_date } = monthlyBudgetFormData;

        if (numericTotal < 0) { setMonthlyBudgetError("Total amount cannot be negative."); return; }
        if (!start_date || !end_date) { setMonthlyBudgetError("Start and End dates are required."); return; }
        if (new Date(start_date) >= new Date(end_date)) { setMonthlyBudgetError("End date must be after start date."); return; }

        const payload = {
            total_budget_amount: numericTotal,
            start_date: start_date,
            end_date: end_date,
        };

        setIsLoadingMonthlyBudget(true);
        try {
            let updatedData;
            if (monthlyBudgetData._id) {
                updatedData = await updateMonthlyBudget(monthlyBudgetData._id, payload);
                alert('Monthly budget settings updated!');
            } else {
                updatedData = await createMonthlyBudget(payload);
                alert('Monthly budget settings created!');
            }

            if (updatedData && updatedData._id) {
                 setMonthlyBudgetData({ // Update state with response
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
            setMonthlyBudgetError(error.message || (monthlyBudgetData._id ? "Failed to update budget." : "Failed to create budget."));
        } finally {
             setIsLoadingMonthlyBudget(false);
        }
    };

    // --- Delete Confirmation ---
    // TODO: Implement API call (deleteBudgetItem)
    const confirmDeleteItem = async () => {
        if (deletingBudgetItemId) {
            setBudgetItemsError(null);
            setIsLoadingBudgetItems(true); // Indicate activity
            console.log("TODO: Implement API call for deleting item:", deletingBudgetItemId);
            try {
                // await deleteBudgetItem(deletingBudgetItemId); // API Call Placeholder
                alert(`Category limit deleted! (Simulated)`);
                // Refetch items after successful delete
                // await fetchCategoryBudgetItems(getCurrentYearMonth()); // Refetch Placeholder
                closeModal();
            } catch (error) {
                 console.error("Error deleting category budget item:", error);
                 setBudgetItemsError(error.message || "Failed to delete category limit.");
            } finally {
                 setIsLoadingBudgetItems(false);
            }
        }
    };

    // --- Refresh Handler ---
    const handleRefresh = () => {
        console.log("Refreshing data...");
        setMonthlyBudgetError(null);
        setBudgetItemsError(null);
        setCategoriesError(null);
        fetchMonthlyBudget();
        fetchCategories();
        fetchCategoryBudgetItems(getCurrentYearMonth()); // Or selected month
        alert("Data refresh initiated!");
    };

    // --- Render Logic ---
    const isLoading = isLoadingMonthlyBudget || isLoadingCategories || isLoadingBudgetItems;

    return (
      <>
        <Navbar />
        <div className="budget-page-container">

            {/* --- Top Summary Section (Overall Monthly Budget) --- */}
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
                        <h4>Overall Budget (Simulated Usage)</h4>
                        <p>Usage ({Math.round((monthlyBudgetData.total_budget_amount || 0) * 0.6).toLocaleString()} / {(monthlyBudgetData.total_budget_amount || 0).toLocaleString()})</p>
                    </div>
                     {isLoadingMonthlyBudget ? <p>Loading chart...</p> :
                         <ReactECharts option={budgetChartOptions} style={{ height: '150px', width: '100%' }} notMerge={true} lazyUpdate={true} key={monthlyBudgetData.total_budget_amount} />
                     }
                    <span className="chart-side-text left">0%</span> <span className="chart-side-text right">100%</span>
                </div>
            </motion.section>

            {/* --- Main Content Section (Category Budget Items List) --- */}
            <motion.section className="budget-main-content" initial="hidden" animate="visible" variants={sectionVariants}>
                <motion.button
                    className="add-budget-button"
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    variants={itemVariants}
                    onClick={openAddBudgetItemModal}
                    disabled={isLoadingCategories} // Disable if categories haven't loaded
                >
                    Add Category Budget Item
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

                 {/* Error display for category items or categories fetch */}
                 {budgetItemsError ? <p className="error-message">{budgetItemsError}</p> : null}
                 {categoriesError ? <p className="error-message">{categoriesError}</p> : null}

                {/* Table & Breakdown */}
                <div className="table-breakdown-wrapper">
                    <motion.div className="budget-table-container" variants={itemVariants}>
                         <h4 style={{ textAlign: 'center', marginBottom: '10px' }}>Category Budget Limits</h4>
                         {isLoadingBudgetItems ? <p>Loading category limits...</p> : (
                            <table className="budget-table" aria-label="Category Budget Limits List">
                                <thead><tr><th scope="col">Category</th><th scope="col">Limit Amount</th><th scope="col">Description</th><th scope="col">Action</th></tr></thead>
                                <tbody>
                                    {budgetItems.length > 0 ? (
                                        budgetItems.map((item) => (
                                            // TODO: Update key and data access when API provides real items
                                            <tr key={item._id || item.id}>
                                                {/* Use categoryMap to display name based on category_id */}
                                                <td>{categoryMap[item.category_id] || 'Unknown Category'}</td>
                                                <td>Rs.{item.limit_amount?.toLocaleString() || 0}</td>
                                                <td>{item.description || '-'}</td>
                                                <td className="action-cell">
                                                    <motion.button whileTap={{ scale: 0.9 }} className="icon-button" title={`Edit Item`} onClick={() => openEditBudgetItemModal(item)}><EditIcon size={16} /></motion.button>
                                                    <motion.button whileTap={{ scale: 0.9 }} className="icon-button" title={`Delete Item`} onClick={() => openDeleteBudgetItemModal(item._id || item.id)}><DeleteIcon size={16} /></motion.button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : ( <tr><td colSpan="4" className="no-data-message">No category budget items found.</td></tr> )}
                                </tbody>
                                {/* Optional Footer */}
                                {budgetItems.length > 0 && (
                                    <tfoot><tr><th scope="row">Total Set:</th><td><strong>Rs.{totalCategoryLimitsSet.toLocaleString()}</strong></td><td colSpan="2"></td></tr></tfoot>
                                )}
                            </table>
                         )}
                    </motion.div>
                    <motion.div className="category-breakdown" variants={itemVariants}>
                        <h4>Category Breakdown (Simulated)</h4>
                        {isLoadingCategories || isLoadingBudgetItems ? <p>Loading breakdown...</p> : null}
                         {categoryDataForBreakdown.length > 0 ? (
                            categoryDataForBreakdown.map((cat, index) => (
                                <div className="category-item" key={cat.name || index}>
                                    <div className="category-info"><span>{cat.name}:</span><span>{cat.used.toLocaleString()} / {cat.total.toLocaleString()}</span></div>
                                    <div className="progress-bar-container" title={`Simulated Usage: ${(cat.total > 0 ? (cat.used / cat.total) * 100 : 0).toFixed(1)}%`}>
                                        <motion.div className="progress-bar-filled" initial={{ width: 0 }} animate={{ width: cat.total > 0 ? `${(cat.used / cat.total) * 100}%` : '0%' }} transition={{ duration: 0.8, ease: "easeOut" }}></motion.div>
                                    </div>
                                </div>
                            ))
                         ) : (!isLoadingCategories && !isLoadingBudgetItems ? <p className="no-data-message">No category data.</p> : null)}
                    </motion.div>
                </div>
            </motion.section>

            {/* --- MODALS --- */}

            {/* Modal for Adding/Editing CATEGORY Items */}
            <Modal isOpen={isAddEditModalOpen} onClose={closeModal} title={editingBudgetItem ? "Edit Category Budget Limit" : "Add New Category Budget Limit"}>
                <form onSubmit={handleCategoryItemFormSubmit} className="modal-form">
                    {budgetItemsError && <p className="error-message modal-error">{budgetItemsError}</p>}
                    <div className="form-group">
                        <label htmlFor="category_id">Category</label>
                        <select
                            id="category_id" name="category_id"
                            className="select-field" required
                            value={categoryItemFormData.category_id}
                            onChange={handleCategoryItemFormChange}
                            disabled={isLoadingCategories}
                        >
                             {isLoadingCategories ? <option>Loading...</option> : <option value="" disabled>-- Select Category --</option>}
                             {availableCategories.map(cat => (<option key={cat._id} value={cat._id}>{cat.name}</option>))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="limit_amount">Limit Amount (Rs)</label>
                        <input
                            type="number" id="limit_amount" name="limit_amount"
                            className="input-field" required min="0.01" step="any"
                            value={categoryItemFormData.limit_amount}
                            onChange={handleCategoryItemFormChange}
                            placeholder="e.g., 500"
                         />
                    </div>
                    <div className="form-group">
                        <label htmlFor="description">Description (Optional)</label>
                        <textarea
                            id="description" name="description"
                            className="textarea-field"
                            value={categoryItemFormData.description}
                            onChange={handleCategoryItemFormChange}
                            placeholder="e.g., Monthly grocery limit"
                         />
                    </div>
                    <div className="form-actions">
                        <motion.button type="button" className="secondary-button" onClick={closeModal} disabled={isLoadingBudgetItems}>Cancel</motion.button>
                        <motion.button type="submit" className="primary-button" disabled={isLoadingBudgetItems}>
                             {isLoadingBudgetItems ? "Saving..." : (editingBudgetItem ? "Save Changes" : "Add Limit")}
                        </motion.button>
                    </div>
                </form>
            </Modal>

            {/* Modal for Editing/Creating OVERALL Monthly Budget */}
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
                        <motion.button type="submit" className="primary-button" disabled={isLoadingMonthlyBudget}>
                            {isLoadingMonthlyBudget ? "Saving..." : (monthlyBudgetData._id ? "Save Settings" : "Create Budget")}
                        </motion.button>
                    </div>
                </form>
            </Modal>

            {/* Modal for Deleting CATEGORY Items */}
            <Modal isOpen={isDeleteModalOpen} onClose={closeModal} title="Confirm Deletion">
                 {budgetItemsError && <p className="error-message modal-error">{budgetItemsError}</p>}
                 <div className="confirmation-text">Are you sure you want to delete this category budget limit? This action cannot be undone.</div>
                 <div className="confirmation-actions">
                     <motion.button type="button" className="secondary-button" onClick={closeModal} disabled={isLoadingBudgetItems}>Cancel</motion.button>
                     <motion.button type="button" className="primary-button delete-confirm-button" onClick={confirmDeleteItem} disabled={isLoadingBudgetItems}>
                          {isLoadingBudgetItems ? "Deleting..." : "Confirm Delete"}
                     </motion.button>
                 </div>
            </Modal>

        </div> {/* End budget-page-container */}
        <Footer />
      </>
    );
};

export default BudgetManagementPage;