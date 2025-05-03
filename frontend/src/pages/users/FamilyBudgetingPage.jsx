import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import Navbar from '../../components/Navbar';        // Adjust path if needed
import Footer from '../../components/Footer';        // Adjust path if needed
import Modal from '../../components/Modal';        // Adjust path if needed
import '../../styles/FamilyBudgetingPage.css';   // Adjust path if needed
import userAvatarPlaceholder from '../../assets/avatar.png'; // Adjust path if needed

// API Imports
import {
    // Plan Management APIs
     getUserFamilyPlans, addFamilyPlan,
    updatePlanSettings, deleteFamilyPlan,
    // Categories API
     getCategoriesByPlan,
    // Plan Details API
    getPlanDetails, getPlanMembers, inviteMember,
    updateMemberRole, removeMember,
    // Expenses APIs
    getExpensesByPlan, getExpensesByPlanAndUser,
    getExpenseById, createFamilyExpense,
    updateFamilyExpense, deleteFamilyExpense,
    approveFamilyExpense, rejectFamilyExpense,
} from '../../api/api'; // Adjust path if needed


// --- Icons --- (Assuming these are simple span wrappers for emojis/icons)
const EditIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }} title="Edit">✏️</span>;
const DeleteIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }} title="Delete">🗑️</span>;
const RefreshIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }} title="Refresh">🔄</span>;
const AddIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }} title="Add">➕</span>;
const WalletIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px` }}>💰</span>;
const UserIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px` }}>👤</span>;
const SettingsIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }} title="Settings">⚙️</span>;
const ExportIcon = ({ size = 16 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }} title="Export">📤</span>;

const FamilyBudgetingPage = () => {

    // --- Component State ---
    const [userPlansAndRoles, setUserPlansAndRoles] = useState([]);
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [currentPlanDetails, setCurrentPlanDetails] = useState(null);
    const [availableCategories, setAvailableCategories] = useState([]);
    const [categoryMap, setCategoryMap] = useState({});
    const [totalAllocatedBudget, setTotalAllocatedBudget] = useState(0);
    // Loading States
    const [isLoadingPlans, setIsLoadingPlans] = useState(true);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [isLoadingPlanDetails, setIsLoadingPlanDetails] = useState(false);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Error States
    const [plansError, setPlansError] = useState(null);
    const [categoriesError, setCategoriesError] = useState(null);
    const [detailsError, setDetailsError] = useState(null);
    const [membersError, setMembersError] = useState(null);
    const [expensesError, setExpensesError] = useState(null);
    const [submitError, setSubmitError] = useState(null);

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
    const [deletingItemId, setDeletingItemId] = useState(null);const [deletingItemType, setDeletingItemType] = useState(''); // e.g., 'member', 'familyExpense', 'personalExpense', 'plan'

    // Form Data States - Align keys with API payload expectations (snake_case often)
    const [addPlanFormData, setAddPlanFormData] = useState({ plan_name: '' }); // Simple add plan
    const [settingsFormData, setSettingsFormData] = useState({ plan_name: '', total_budget_amount: 0, start_date: '', end_date: '', categories: [] }); // Matches API
    const [addMemberFormData, setAddMemberFormData] = useState({ email: '', role: 'viewer' });
    const [expenseFormData, setExpenseFormData] = useState({ date: new Date().toISOString().split('T')[0], category_id: '', description: '', amount: '', notes: '' }); // Use category_id
    const [exportFormData, setExportFormData] = useState({ format: 'csv', dateRange: 'current_month' });

    // --- Data States ---
    const [familyMembers, setFamilyMembers] = useState([]);
    const [familyExpenses, setFamilyExpenses] = useState([]);
    const [personalExpenses, setPersonalExpenses] = useState([]);

    // --- Derived State ---
    const currentUserRoleForSelectedPlan = useMemo(() => {
        const plan = userPlansAndRoles.find(p => p._id === selectedPlanId);
        return plan?.userRole || 'viewer'; // Derive role from the fetched list
    }, [selectedPlanId, userPlansAndRoles]);

    // TODO: Update these calculations when *actual* expense data is fetched and structured
    const spentAmount = useMemo(() => familyExpenses
        .filter(item => item.status === 'approved')
        .reduce((sum, item) => sum + (item.amount || 0), 0), [familyExpenses]);
    const remainingAmount = useMemo(() => (currentPlanDetails?.total_budget_amount || 0) - spentAmount, [currentPlanDetails, spentAmount]);
    const spentPercentage = useMemo(() => (currentPlanDetails?.total_budget_amount || 0) > 0 ? Math.round((spentAmount / (currentPlanDetails?.total_budget_amount || 1)) * 100) : 0, [currentPlanDetails, spentAmount]);

    const remainingAmountPerCategory = useMemo(() => {
        const budgetMap = currentPlanDetails?.categoryBudgets?.reduce((acc, cat) => {
            acc[cat.categoryId] = cat.limitAmount || 0;
            return acc;
        }, {});
        console.log("Budget Map:", budgetMap); // Debug log
    
        const spentMap = familyExpenses.reduce((acc, expense) => {
            if (expense.status === 'approved') {
                // Fix: Access category_id._id
                const categoryId = expense.category_id._id || expense.category_id; 
                acc[categoryId] = (acc[categoryId] || 0) + (expense.amount || 0);
            }
            return acc;
        }, {});
        console.log("Spent Map:", spentMap); // Debug log
    
        const remainingMap = Object.keys(budgetMap || {}).reduce((acc, catId) => {
            acc[catId] = (budgetMap[catId] || 0) - (spentMap[catId] || 0);
            return acc;
        }, {});
        console.log("Remaining Map:", remainingMap); // Debug log
    
        return remainingMap;
    }, [currentPlanDetails, familyExpenses]);
    
    // --- ECharts Options ---
    // TODO: Update chart data based on fetched expenses and categories
    const mainBarChartOptions = useMemo(() => ({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { data: ['Budget Amount', 'Expense Amount'], bottom: 0, textStyle: { color: '#555' } },
        grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
        xAxis: { 
            type: 'category', 
            data: availableCategories.map(category => category.name), 
            axisTick: { alignWithLabel: true }, 
            axisLabel: { color: '#666' } 
        },
        yAxis: { type: 'value', axisLabel: { formatter: 'Rs {value}', color: '#666' } },
        series: [
            { 
                name: 'Budget Amount', 
                type: 'bar', 
                barWidth: '40%', 
                data: availableCategories.map(category => {
                    const budget = currentPlanDetails?.categoryBudgets?.find(cat => cat.categoryId === category._id)?.limitAmount || 0;
                    return budget;
                }), 
                itemStyle: { color: '#91cc75' } 
            },
            { 
                name: 'Expense Amount', 
                type: 'bar', 
                barWidth: '40%', 
                data: availableCategories.map(category => {
                    const expenses = familyExpenses
                        .filter(expense => expense.category_id?._id === category._id && expense.status === 'approved')
                        .reduce((sum, expense) => sum + (expense.amount || 0), 0);
                    return expenses;
                }), 
                itemStyle: { color: '#fc8452' } 
            }
        ]
    }), [availableCategories, currentPlanDetails, familyExpenses]);

    const personalPieChartOptions = useMemo(() => {
        const personalSpending = personalExpenses
            .filter(expense => expense.status === 'approved')
            .reduce((sum, expense) => sum + (expense.amount || 0), 0);
        const remainingBudget = (currentPlanDetails?.total_budget_amount || 0) - personalSpending;

        return {
            tooltip: { trigger: 'item', formatter: '{b}: Rs {c} ({d}%)' },
            legend: { data: ['Your Spending', 'Remaining Budget'], bottom: 0, textStyle: { color: '#555' } },
            series: [{
                name: 'Contribution', 
                type: 'pie', 
                radius: ['40%', '70%'], 
                avoidLabelOverlap: false,
                label: { show: false }, 
                emphasis: { label: { show: false } }, 
                labelLine: { show: false },
                data: [
                    { value: personalSpending, name: 'Your Spending', itemStyle: { color: '#5470c6' } },
                    { value: remainingBudget > 0 ? remainingBudget : 0, name: 'Remaining Budget', itemStyle: { color: '#ee6666' } }
                ]
            }]
        };
    }, [personalExpenses, currentPlanDetails]);

    const personalBarChartOptions = useMemo(() => {
        const categories = [];
        const budgetData = [];
        const expenseData = [];
    
        availableCategories.forEach(category => {
            categories.push(category.name);
    
            const budget = currentPlanDetails?.categoryBudgets?.find(cat => cat.categoryId === category._id)?.limitAmount || 0;
            budgetData.push(budget);
            console.log("Expense Data:", personalExpenses); // Debug log
            const expenses = personalExpenses
            .filter(expense => expense.category_id?._id === category._id && expense.status === 'approved')
            .reduce((sum, expense) => sum + (expense.amount || 0), 0);
        
            expenseData.push(expenses);
        });
    
        console.log("Personal Bar Chart Data:", { categories, budgetData, expenseData }); // Debug log
    
        return {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: '{b}<br/>{a0}: Rs {c0}<br/>{a1}: Rs {c1}'
            },
            legend: {
                data: ['Budget', 'Expense'],
                bottom: 0,
                textStyle: { color: '#555' }
            },
            grid: {
                top: '15%',
                left: '3%',
                right: '4%',
                bottom: '10%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: categories,
                axisTick: { alignWithLabel: true },
                axisLabel: { color: '#666' }
            },
            yAxis: {
                type: 'value',
                axisLabel: { formatter: 'Rs {value}', color: '#666' }
            },
            series: [
                {
                    name: 'Budget',
                    type: 'bar',
                    barWidth: '30%',
                    data: budgetData,
                    itemStyle: { color: '#5470c6' }
                },
                {
                    name: 'Expense',
                    type: 'bar',
                    barWidth: '30%',
                    data: expenseData,
                    itemStyle: { color: '#ee6666' }
                }
            ]
        };
    }, [availableCategories, currentPlanDetails, personalExpenses]);
    
    // --- Animation Variants ---
    const pageVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
    const itemVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } } };

    // --- Utility ---
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString + 'T00:00:00');
            if (isNaN(date.getTime())) return dateString;
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch (e) {
            console.error("Date format error:", dateString, e);
            return dateString;
        }
    };

    // --- Modal Open/Close Handlers ---
    const openModal = (modalName, item = null, itemType = '') => {
        setSubmitError(null);
        setModalState(prev => Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}));
        setModalState(prev => ({ ...prev, [modalName]: true }));

        setEditingItem(item);

        if (itemType && item) {
            setDeletingItemId(item._id || item.id);
            setDeletingItemType(itemType);
        } else {
            setDeletingItemId(null);
            setDeletingItemType('');
        }

        if (modalName === 'isSettingsOpen' && currentPlanDetails) {
            setSettingsFormData({
                plan_name: currentPlanDetails.plan_name || '',
                total_budget_amount: currentPlanDetails.total_budget_amount?.toString() || '',
                start_date: currentPlanDetails.start_date ? currentPlanDetails.start_date.split('T')[0] : '',
                end_date: currentPlanDetails.end_date ? currentPlanDetails.end_date.split('T')[0] : '',
                categories: availableCategories.map(category => ({
                    category_id: category._id,
                    category_name: category.name,
                    budget:
                        currentPlanDetails.categoryBudgets?.find(cat => cat.categoryId === category._id)?.limitAmount
                        || 0,
                })),
            });
        } else if (modalName === 'isAddPlanOpen') {
            setAddPlanFormData({ plan_name: '' });
        } else if (modalName === 'isAddMemberOpen') {
            setAddMemberFormData({ email: '', role: 'viewer' });
        } else if (modalName === 'isAddPersonalExpenseOpen') {
            setExpenseFormData({
                date: new Date().toISOString().split('T')[0],
                category_id: availableCategories[0]?._id || '',
                description: '',
                amount: '',
                notes: ''
            });
        } else if (modalName === 'isEditPersonalExpenseOpen' && item) {
            setExpenseFormData({
                date: item.date ? item.date.split('T')[0] : '',
                category_id: item.category_id || '',
                description: item.description || '',
                amount: item.amount?.toString() || '',
                notes: item.notes || ''
            });
        } else if (modalName === 'isEditFamilyExpenseOpen' && item) {
            setExpenseFormData({
                date: item.date ? item.date.split('T')[0] : '',
                category_id: item.category_id || '',
                description: item.description || '',
                amount: item.amount?.toString() || '',
                notes: item.notes || ''
            });
        }
    };

    const closeModal = () => {
        setModalState(prev => Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}));
        setSubmitError(null);
        setTimeout(() => {
            setEditingItem(null);
            setDeletingItemId(null);
            setDeletingItemType('');
        }, 300);
        window.location.reload();  // Reload the page from cache

    };

    // --- Form Input Handlers ---
    const handleFormChange = (e, formSetter) => {
        const { name, value } = e.target;
        formSetter(prev => ({ ...prev, [name]: value }));
    };

    // --- Data Fetching Callbacks ---
    const fetchUserPlans = useCallback(async () => {
        setIsLoadingPlans(true);
        setPlansError(null);
        setUserPlansAndRoles([]); // Reset state before fetching
        setSelectedPlanId('');    // Clear selection
        setCurrentPlanDetails(null); // Clear current details
        try {
            const plans = await getUserFamilyPlans(); // API Call
            const validPlans = plans || [];
            setUserPlansAndRoles(validPlans);
            if (validPlans.length > 0) {
                // Select the first plan by default using its actual _id
                setSelectedPlanId(validPlans[0]._id);
                // No need to set details here, the useEffect watching selectedPlanId will trigger fetchPlanData
            } else {
                // No plans found, ensure details remain null/empty
                setCurrentPlanDetails(null);
                // Clear dependent data if needed
                setFamilyMembers([]);
                setFamilyExpenses([]);
                setPersonalExpenses([]);
            }
        } catch (error) {
            console.error("Error fetching user plans:", error);
            setPlansError(error.message || "Failed to load your plans.");
            setUserPlansAndRoles([]); // Ensure empty on error
        } finally {
            setIsLoadingPlans(false);
        }
    }, []);

    const fetchFamilyExpenses = useCallback(async (planId) => {
        if (!planId) return;
        setIsLoadingExpenses(true);
        setExpensesError(null);
        setFamilyExpenses([]); // Reset expenses before fetching
        try {
            const expenses = await getExpensesByPlan(planId); // API Call
            const validExpenses = (expenses || []).filter(expense => expense.status === 'approved' || expense.status === 'pending'); // Filter for approved or pending expenses
            setFamilyExpenses(validExpenses);
            console.log("Fetched family expenses:", expenses); // Debug log
        } catch (error) {
            console.error("Error fetching family expenses:", error);
            setExpensesError(error.message || "Failed to load family expenses.");
            setFamilyExpenses([]);
        } finally {
            setIsLoadingExpenses(false);
        }
    }, []);

    const fetchCategoriesOnce = useCallback(async (planId) => {
        setIsLoadingCategories(true);
        setCategoriesError(null);
        try {
            const categories = await  getCategoriesByPlan(planId); 
            console.log("Fetched categories:", categories); // Debug log 
            const validCategories = categories || [];
            setAvailableCategories(validCategories);
            const catMap = validCategories.reduce((acc, cat) => { acc[cat._id] = cat.name; return acc; }, {});
            setCategoryMap(catMap);
            if (validCategories.length > 0) {
                setExpenseFormData(prev => ({
                    ...prev,
                    category_id: prev.category_id || validCategories[0]._id
                }));
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            setCategoriesError(error.message || "Failed to load categories.");
            setAvailableCategories([]);
            setCategoryMap({});
        } finally {
            setIsLoadingCategories(false);
        }
    }, []); 

    const fetchPlanData = useCallback(async (planId) => {
        if (!planId) {
            setCurrentPlanDetails({}); setFamilyMembers([]); setFamilyExpenses([]); setPersonalExpenses([]);
            return;
        }
        setIsLoadingPlanDetails(true);
        setIsLoadingMembers(true);
        setIsLoadingExpenses(true);
        setPlansError(null); setMembersError(null); setExpensesError(null);

        try {
            const [detailsRes, membersRes] = await Promise.allSettled([
            getPlanDetails(planId),
            getPlanMembers(planId),
            ]);

            if (detailsRes.status === 'fulfilled' && detailsRes.value) {
            setCurrentPlanDetails(detailsRes.value || {});
            } else {
            console.error("Err fetch details:", detailsRes.reason);
            setPlansError(detailsRes.reason?.message || "Failed fetch plan details.");
            setCurrentPlanDetails({});
            throw new Error("Failed to load essential plan details.");
            }
            setIsLoadingPlanDetails(false);

            if (membersRes.status === 'fulfilled' && membersRes.value) {
            setFamilyMembers(membersRes.value || []);
            } else {
            console.error("Err fetch members:", membersRes.reason);
            setMembersError(membersRes.reason?.message || "Failed fetch members.");
            setFamilyMembers([]);
            }
            setIsLoadingMembers(false);

            setIsLoadingExpenses(true);
            await new Promise(res => setTimeout(res, 100));
            setFamilyExpenses([]);
            setPersonalExpenses([]);
            setIsLoadingExpenses(false);

        } catch (error) {
            console.error(`Error fetching data for plan ${planId}:`, error);
            if (!plansError) setPlansError(error.message || `Failed to load plan data.`);
            setIsLoadingPlanDetails(false); setIsLoadingMembers(false); setIsLoadingExpenses(false);
            setCurrentPlanDetails({}); setFamilyMembers([]); setFamilyExpenses([]); setPersonalExpenses([]);
        }
        }, []);

    const fetchPersonalExpenses = useCallback(async (planId) => {
        if (!planId) return;
        setIsLoadingExpenses(true);
        setExpensesError(null);
        setPersonalExpenses([]); // Reset expenses before fetching
        try {
            const expenses = await getExpensesByPlanAndUser(planId); // API Call
            const validExpenses = expenses || [];
            setPersonalExpenses(validExpenses);
            console.log("Fetched personal expenses:", expenses); // Debug log
        } catch (error) {
            console.error("Error fetching personal expenses:", error);
            setExpensesError(error.message || "Failed to load personal expenses.");
            setPersonalExpenses([]);
        } finally {
            setIsLoadingExpenses(false);
        }
    }, []);
    
    // --- Form Submit Handlers ---
    const handleAddPlanSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError(null);
        if (!addPlanFormData.plan_name.trim()) {
             setSubmitError("Plan name cannot be empty.");
             setIsSubmitting(false);
             return;
        }
        try {
            const newPlan = await addFamilyPlan({ plan_name: addPlanFormData.plan_name });
            alert("Plan added successfully!");
            await fetchUserPlans();
      
            closeModal();
        } catch (err) {
            console.error("Add plan failed:", err);
            setSubmitError(err.message || "Failed to create plan.");
            // Keep modal open on error
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleSettingsSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError(null);
        const totalAllocated = settingsFormData.categories.reduce(
            (sum, c) => sum + parseFloat(c.budget || 0),
            0
        );
    
        if (totalAllocated > parseFloat(settingsFormData.total_budget_amount)) {
            setSubmitError(`Allocated category budgets ($${totalAllocated}) exceed total budget ($${settingsFormData.total_budget_amount}).`);
            return;
        }
        // Validate inputs (use state variable names directly)
        const numericTotal = parseFloat(settingsFormData.total_budget_amount);
        if (!settingsFormData.plan_name.trim() || isNaN(numericTotal) || numericTotal < 0 || !settingsFormData.start_date || !settingsFormData.end_date || new Date(settingsFormData.start_date) >= new Date(settingsFormData.end_date)) {
            setSubmitError("Invalid settings. Check name, amount (>= 0), and dates (start < end).");
            setIsSubmitting(false);
            return;
        }

        // Payload uses the same keys as the form state
        const payload = {
            plan_name: settingsFormData.plan_name,
            total_budget_amount: numericTotal,
            start_date: settingsFormData.start_date,
            end_date: settingsFormData.end_date,
            categories: availableCategories.map(category => ({
            category_id: category._id,
            budget: parseFloat(settingsFormData[`category_${category._id}`]) || 0,
            })),
        };
        console.log("Settings Payload:", payload); // Log the data being sent

        try {
            if (!selectedPlanId) throw new Error("No plan selected to update.");
            const updatedPlan = await updatePlanSettings(selectedPlanId, payload); // API Call
            alert("Settings saved successfully!");

            // Update current details state optimistically or with response
            setCurrentPlanDetails(prev => ({ ...prev, ...updatedPlan }));

            // Check if the name changed in the main list and refetch list if necessary
            const planInList = userPlansAndRoles.find(p => p._id === selectedPlanId);
            if (planInList && planInList.name !== updatedPlan.plan_name) {
                // Refetch list to update dropdown name (or update in place)
                setUserPlansAndRoles(prev => prev.map(p => p._id === selectedPlanId ? { ...p, name: updatedPlan.plan_name } : p));
                // await fetchUserPlans(); // Alternative: refetch entire list
            }
            closeModal();
        } catch (err) {
            console.error("Save settings failed:", err);
            setSubmitError(err.message || "Failed to save settings.");
            // Keep modal open on error
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddMemberSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError(null);
        if (!addMemberFormData.email) {
            setSubmitError("Email is required.");
            setIsSubmitting(false);
            return;
        }
        if (!selectedPlanId) {
            setSubmitError("No plan selected.");
            setIsSubmitting(false);
            return;
        }

        try {
            // API Call to invite member
            console.log('Inviting member:', addMemberFormData);
            console.log('Selected Plan ID:', selectedPlanId);
            const invitee_email = addMemberFormData.email.trim().toLowerCase(); // Normalize email
            const role_assigned = addMemberFormData.role || 'viewer'; // Default to 'viewer' if not set
            const addMemberPayload = {  invitee_email,  role_assigned };
            await inviteMember(selectedPlanId, addMemberPayload); // API Call
            alert("Member invited successfully!");
            // TODO: Optionally, update member list immediately if API returns the pending member,
            // or just rely on the next full refresh/fetchPlanData. For simplicity, rely on next refresh.
            // Consider adding a visual indicator for pending invites if needed.
            closeModal();
        } catch (err) {
            console.error("Error inviting member:", err);
            setSubmitError(err.message || "Failed to send invitation.");
            // Keep modal open on error
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleExportSubmit = (e) => { e.preventDefault(); console.log("Exporting:", exportFormData); alert("Exporting Data (Simulated - API Call TODO)"); /* TODO: Call exportPlanData API */ closeModal(); };
 
    const handleAddEditExpenseSubmit = async (e, type) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError(null);
    
        const numericAmount = parseFloat(expenseFormData.amount) || 0;
        if (numericAmount <= 0 || !expenseFormData.category_id || !expenseFormData.date || !expenseFormData.description.trim()) {
            setSubmitError("Please fill date, category, description, and amount (> 0).");
            setIsSubmitting(false);
            return;
        }
    
        // Get remaining budget for this category
        let remainingBudget = remainingAmountPerCategory[expenseFormData.category_id] || 0;
        console.log("Remaining Budget for Category:", remainingBudget); // Debug log
    
        // If editing, add back the old amount of the current expense (since it'll be replaced)
        if (editingItem && editingItem.category_id === expenseFormData.category_id) {
            remainingBudget += editingItem.amount || 0;
        }
    
        if (numericAmount > remainingBudget) {
            setSubmitError(`Amount exceeds the remaining budget for this category. Remaining: Rs ${remainingBudget.toLocaleString()}`);
            setIsSubmitting(false);
            return;
        }
    
        const payload = { ...expenseFormData, amount: numericAmount };
        console.log("Payload:", payload);
    
        try {
            if (editingItem) {
                await updateFamilyExpense(editingItem._id, payload);
                await fetchPlanData(selectedPlanId);
                alert(`${type.charAt(0).toUpperCase() + type.slice(1)} Expense updated!`);
            } else {
                await createFamilyExpense(selectedPlanId, payload);
                await fetchPlanData(selectedPlanId);
                alert(`${type.charAt(0).toUpperCase() + type.slice(1)} Expense added!`);
            }
            closeModal();
        } catch (err) {
            console.error(`Error saving ${type} expense:`, err);
            setSubmitError(err.message || `Failed to save ${type} expense.`);
        } finally {
            setIsSubmitting(false);
        }
    };
    

    
    const handleEditMemberSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError(null);

        if (!editingItem || !editingItem.user?._id) {
            setSubmitError("No member selected for editing.");
            setIsSubmitting(false);
            return;
        }
        if (!selectedPlanId) {
             setSubmitError("No plan selected.");
             setIsSubmitting(false);
             return;
        }

        const memberUserId = editingItem.user._id;
        const newRole = e.target.elements.role.value; // Get role from form

        try {
            // API Call to update member role
            await updateMemberRole(selectedPlanId, memberUserId, { role: newRole });
            alert("Member role updated successfully!");
            await fetchPlanData(selectedPlanId); // Refetch plan data to update the members list
            closeModal();
        } catch (err) {
            console.error("Error updating member role:", err);
            setSubmitError(err.message || "Failed to update member role.");
            // Keep modal open on error
        } finally {
            setIsSubmitting(false);
        }
    };
  
    // --- Delete Confirmation Handler ---
    const confirmDelete = async () => {
        if (!deletingItemId || !deletingItemType) return;
        setIsSubmitting(true);
        setSubmitError(null);
        let itemDescription = deletingItemType.replace(/([A-Z])/g, ' $1').toLowerCase();

        try {
            switch (deletingItemType) {
                case 'member':
                    // API Call to remove member
                    await removeMember(selectedPlanId, deletingItemId);
                    itemDescription = 'member'; // Ensure description is correct
                    break;
                case 'familyExpense':
                    await deleteFamilyExpense(deletingItemId); // API Call integrated
                    itemDescription = 'family expense';
                    break;
                case 'personalExpense':
                    await deleteFamilyExpense(deletingItemId); // API Call integrated
                    itemDescription = 'personal expense';
                    break;
                case 'plan':
                    itemDescription = 'plan';
                    await deleteFamilyPlan(deletingItemId); // API Call integrated
                    break;
                default:
                    throw new Error("Unknown item type to delete");
            }

            alert(`${itemDescription.charAt(0).toUpperCase() + itemDescription.slice(1)} deleted successfully!`);

            // Refetch data
            if (deletingItemType === 'plan') {
                await fetchUserPlans(); // Refresh list if a plan was deleted
            } else {
                await fetchPlanData(selectedPlanId); // Refresh current plan data (members, expenses)
            }
            closeModal();

        } catch (err) {
            console.error(`Error deleting ${deletingItemType}:`, err);
            setSubmitError(err.message || `Failed to delete ${itemDescription}.`);
            // Keep modal open on error
        } finally {
            setIsSubmitting(false);
        }
    };
    // --- Refresh Handler ---
    const handleRefresh = async (section) => {
        alert(`Refreshing ${section}...`);
        setDetailsError(null); setMembersError(null); setExpensesError(null); // Clear previous errors
        switch (section) {
            case 'Plan Details':
            case 'Members':
            case 'Family Expenses':
            case 'Personal Expenses':
                if (selectedPlanId) {
                    await fetchPlanData(selectedPlanId); // Refetch all data for the current plan
                } else {
                     alert("No plan selected to refresh.");
                }
                break;
            case 'Plans List':
                await fetchUserPlans(); // Refetch the list of plans
                break;
            default:
                console.warn("Unknown refresh section:", section);
        }
         alert(`${section} refreshed!`);
    };

    const handleapproval = async (expenseId, action) => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            if (action === 'approve') {
                await approveFamilyExpense( expenseId); // API Call to approve expense
                alert("Expense approved successfully!");
            } else if (action === 'reject') {
                await rejectFamilyExpense( expenseId); // API Call to reject expense
                alert("Expense rejected successfully!");
            }
            await fetchPlanData(selectedPlanId); // Refetch plan data to update the expenses list
            closeModal();
        } catch (err) {
            console.error("Error updating expense approval:", err);
            setSubmitError(err.message || "Failed to update expense approval.");
            // Keep modal open on error
        }
        finally {
            setIsSubmitting(false);
        }
    };

    // --- Effects ---
       // --- Initial Data Load Effects ---
       useEffect(() => {
        fetchUserPlans();
        console.log("Fetched Categories", availableCategories); // Debug log  
    }, [fetchUserPlans, fetchCategoriesOnce]);

    useEffect(() => {
        if (selectedPlanId) {
            fetchPlanData(selectedPlanId).then(() => {
                fetchFamilyExpenses(selectedPlanId);
                fetchPersonalExpenses(selectedPlanId);
                fetchCategoriesOnce(selectedPlanId);

            });
        } else {
            setCurrentPlanDetails(null);
            setFamilyMembers([]);
            setFamilyExpenses([]);
            setPersonalExpenses([]);
            setDetailsError(null);
            setMembersError(null);
            setExpensesError(null);
        }
    }, [selectedPlanId, fetchPlanData, fetchFamilyExpenses , fetchPersonalExpenses ]);
      // --- Render ---
    return (
        <div className="page-container">
            <Navbar />
            <motion.main className="family-budget-page-content" variants={pageVariants} initial="hidden" animate="visible">

                {/* Plan Selector */}
                <motion.div className="plan-selector-container" variants={itemVariants}>
                    <label htmlFor="plan-select">Viewing Plan:</label>
                    <select
                        id="plan-select"
                        value={selectedPlanId}
                        onChange={(e) => setSelectedPlanId(e.target.value)}
                        className="plan-select-dropdown"
                        disabled={isLoadingPlans || userPlansAndRoles.length === 0}
                        aria-label="Select Family Budget Plan"
                    >
                        {isLoadingPlans && <option value="" disabled>Loading plans...</option>}
                        {!isLoadingPlans && plansError && <option value="" disabled>Error loading plans</option>}
                        {!isLoadingPlans && !plansError && userPlansAndRoles.length === 0 && <option value="" disabled>No plans found</option>}
                        {!isLoadingPlans && !plansError && userPlansAndRoles.map(plan => (
                            <option key={plan._id} value={plan._id}>
                                {plan.name} ({plan.userRole})
                            </option>
                        ))}
                    </select>
                    <button onClick={() => openModal('isAddPlanOpen')} className="primary-button small-button" disabled={isSubmitting || isLoadingPlans}>
                       <AddIcon size={14}/> Add New Plan
                    </button>
                     <button onClick={() => handleRefresh('Plans List')} className="refresh-button icon-text-button small-button" title="Refresh Plan List" disabled={isLoadingPlans}>
                        <RefreshIcon size={14}/>
                    </button>
                </motion.div>

                {/* Display Loading/Error/Content based on selected plan */}
                {isLoadingPlanDetails && (
                     <motion.div variants={itemVariants} className="loading-message">Loading plan details...</motion.div>
                )}
                {detailsError && !isLoadingPlanDetails && (
                    <motion.div variants={itemVariants} className="error-message">Error: {detailsError}</motion.div>
                )}
                {!selectedPlanId && !isLoadingPlans && !isLoadingPlanDetails && userPlansAndRoles.length > 0 && (
                     <motion.div variants={itemVariants} className="info-message">Select a plan to view details.</motion.div>
                )}
                 {!selectedPlanId && !isLoadingPlans && !isLoadingPlanDetails && userPlansAndRoles.length === 0 && (
                     <motion.div variants={itemVariants} className="info-message">Create a new plan to get started.</motion.div>
                )}

                {/* Render content only if a plan is selected and loaded without error */}
                {selectedPlanId && currentPlanDetails && !isLoadingPlanDetails && !detailsError && (
                    <>
                        {/* --- Family Budget Overview --- */}
                        <motion.section className="content-section overview-section" variants={itemVariants}>
                             <div className="section-header space-between">
                                <h2>{currentPlanDetails?.plan_name || 'Plan'} Overview</h2>
                                {(currentUserRoleForSelectedPlan === 'admin') && (
                                    <div className="header-actions">
                                        <motion.button onClick={() => openModal('isSettingsOpen')} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="secondary-button small-button" disabled={isSubmitting}><SettingsIcon size={14}/> Plan Settings</motion.button>
                                        <motion.button onClick={() => openModal('isDeletePlanOpen', currentPlanDetails, 'plan')} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="danger-button small-button" disabled={isSubmitting}><DeleteIcon size={14}/> Delete Plan</motion.button>
                                         <button onClick={() => handleRefresh('Plan Details')} className="refresh-button icon-text-button small-button" title="Refresh Plan Data">
                                            <RefreshIcon size={14}/> Refresh Data
                                        </button>
                                    </div>
                                )}
                             </div>
                            <p className="plan-dates">
                                Duration: {formatDate(currentPlanDetails?.start_date)} - {formatDate(currentPlanDetails?.end_date)}
                             </p>
                            <div className="stats-boxes">
                                <div className="stat-box"><span>Total Budget</span>Rs.{currentPlanDetails?.total_budget_amount?.toLocaleString() || 0}</div>
                                <div className="stat-box"><span>Spent Amount</span>Rs.{spentAmount.toLocaleString()}</div>
                                <div className="stat-box"><span>Remaining Amount</span>Rs.{remainingAmount.toLocaleString()}</div>
                            </div>
                            <div className="budget-progress-bar-container pill-progress">
                                <motion.div className="budget-progress-bar-filled primary-fill" initial={{ width: 0 }} animate={{ width: `${spentPercentage}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
                                <span className="progress-percentage inside">{spentPercentage}%</span>
                            </div>
                            <div className="progress-labels"><span>Spent</span><span>Remaining</span></div>
                            {/* TODO: Add loading/error state for chart data */}
                            <div className="chart-container main-chart">
                                <h4>Budget vs. Expense by Category (Example)</h4>
                                <ReactECharts option={mainBarChartOptions} style={{ height: '300px', width: '100%' }} notMerge={true} lazyUpdate={true} />
                            </div>
                        </motion.section>

                        {/* --- Family Members (Admin Only View) --- */}
                            {/* Family Members (Admin Only) */}
                        {currentUserRoleForSelectedPlan === 'admin' && (
                        <motion.section className="content-section" variants={itemVariants}>
                            <div className="section-header"><h2>Family Members</h2></div>
                            <div className="filter-export-bar compact-bar">
                                {/* Placeholder Filters */}
                                <input type="text" placeholder="Search Email" className="filter-input small-input" />
                                <button onClick={() => fetchPlanData(selectedPlanId)} className="refresh-button icon-text-button small-button" disabled={isLoadingMembers || isSubmitting}>Refresh <RefreshIcon size={14}/></button>
                                <button onClick={() => openModal('isAddMemberOpen')} className="primary-button small-button" disabled={isLoadingMembers || isSubmitting}><UserIcon size={14}/> Invite Member</button>
                            </div>
                            {membersError && <p className="error-message small">{membersError}</p>}
                            <div className="data-table-container">
                                {isLoadingMembers ? <p>Loading members...</p> : (
                                    <table className="data-table members-table">
                                        <thead><tr><th></th><th>Name</th><th>Email</th><th>Role</th><th>Action</th></tr></thead>
                                        <tbody>
                                            {/* Loop through fetched familyMembers state */}
                                            {familyMembers.map((member) => (
                                                // Use FamilyMember doc ID as key if available, otherwise user ID
                                                <tr key={member._id || member.user?._id}>
                                                    <td><img src={member.user?.avatar || userAvatarPlaceholder} alt="avatar" className="table-avatar"/></td>
                                                    <td>{member.user?.name || 'Invited User'}</td>
                                                    <td>{member.user?.email || 'N/A'}</td>
                                                    <td>{member.role}</td>
                                                    <td className="action-cell">
                                                        {/* Pass the full member object to edit modal */}
                                                        <button onClick={() => openModal('isEditMemberOpen', member)} title="Edit Member Role" className="icon-button" disabled={isSubmitting}><EditIcon size={14}/></button>
                                                        {/* Pass the user's ID to delete modal */}
                                                        <button onClick={() => openModal('isDeleteMemberOpen', member.user, 'member')} title="Remove Member" className="icon-button" disabled={isSubmitting}><DeleteIcon size={14}/></button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {familyMembers.length === 0 && <tr><td colSpan="5" className="no-data-message">No members in this plan yet.</td></tr>}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </motion.section>
                        )}
                        {/* --- Family Expense Record --- */}
                        <motion.section className="content-section" variants={itemVariants}>
                            <div className="section-header space-between">
                                <h2>Family Expense Record</h2>
                                {(currentUserRoleForSelectedPlan === 'admin' || currentUserRoleForSelectedPlan === 'editor') && (
                                    <button onClick={() => openModal('isAddFamilyExpenseOpen')} className="primary-button small-button" disabled={isLoadingCategories || isSubmitting}>
                                        <AddIcon size={14}/> Add Family Expense
                                    </button>
                                )}
                            </div>
                            <div className="filter-export-bar compact-bar">
                                <div className="filter-controls">
                                    {/* TODO: Implement filtering logic */}
                                    <input type="text" placeholder="Search Description..." className="filter-input small-input" />
                                    <select className="filter-select small-select" disabled={isLoadingCategories}>
                                        <option value="">All Categories</option>
                                        {availableCategories.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                    <select className="filter-select small-select"><option value="date_desc">Date (Newest)</option></select>
                                    <button onClick={() => fetchFamilyExpenses(selectedPlanId)} className="refresh-button icon-text-button small-button" disabled={isLoadingExpenses || isSubmitting || !selectedPlanId}>
                                        Refresh <RefreshIcon size={14}/>
                                    </button>
                                </div>
                                <button onClick={() => openModal('isExportOpen')} title="Export Expenses" className="secondary-button export-button small-button" disabled={isLoadingExpenses || familyExpenses.length === 0}>
                                    <ExportIcon size={14}/> Export
                                </button>
                            </div>
                            {/* Display Loading / Error State */}
                            {isLoadingExpenses && <p className='loading-text small'>Loading family expenses...</p>}
                            {expensesError && <p className="error-message small">{expensesError}</p>}

                            {!isLoadingExpenses && !expensesError && (
                                <div className="data-table-container">
                                    <table className="data-table expense-table">
                                        <thead>
                                            <tr>
                                                {/* Use short ID or remove if not needed */}
                                                {/* <th scope="col">ID</th> */}
                                                <th scope="col">Date</th>
                                                <th scope="col">Added By</th>
                                                <th scope="col">Category</th>
                                                <th scope="col">Description</th>
                                                <th scope="col">Amount</th>
                                                <th scope="col">Status</th>
                                                <th scope="col">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {familyExpenses.length > 0 ? (
                                                familyExpenses.map((item) => (
                                                    <tr key={item._id}>
                                                        {/* <td>{item._id.slice(-6)}</td> */}
                                                        <td>{formatDate(item.expense_date)}</td>
                                                        {/* Access populated user name */}
                                                        <td>{item.added_by_user_id?.name || 'N/A'}</td>
                                                        {/* Access populated category name or use map */}
                                                        <td>{item.category_id?.name || categoryMap[item.category_id] || 'N/A'}</td>
                                                        <td>{item.description}</td>
                                                        <td>Rs.{item.amount?.toLocaleString()}</td>
                                                        <td>
                                                            <span className={`status-badge status-${item.status?.toLowerCase()}`}>
                                                                {item.status || 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td className="action-cell">
                                                            {/* TODO: Implement permission checks for edit/delete based on role AND who added it */}
                                                            {(currentUserRoleForSelectedPlan === 'admin' || currentUserRoleForSelectedPlan === 'editor' /* || item.added_by_user_id?._id === loggedInUserId */) && (
                                                                <>
                                                                    <button onClick={() => openModal('isEditFamilyExpenseOpen', item)} title="Edit Expense" className="icon-button" disabled={isSubmitting}><EditIcon size={14}/></button>
                                                                    <button onClick={() => openModal('isDeleteFamilyExpenseOpen', item, 'familyExpense')} title="Delete Expense" className="icon-button" disabled={isSubmitting}><DeleteIcon size={14}/></button>
                                                                </>
                                                            )}
                                                           {/* Admin-only approve/reject buttons */}
                                                            {currentUserRoleForSelectedPlan === 'admin' && item.status === 'pending' && (
                                                                <>
                                                                <button onClick={() => handleapproval(item._id, 'approve')} title="Approve Expense" className="icon-button" disabled={isSubmitting}>
                                                                    ✅
                                                                </button>
                                                                <button onClick={() => handleapproval(item._id, 'reject')} title="Disapprove Expense" className="icon-button" disabled={isSubmitting}>
                                                                    ❌
                                                                </button>
                                                                </>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr><td colSpan="7" className="no-data-message">No family expenses recorded for this plan period.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </motion.section>
                        {/* --- Your Personal Record --- */}
                        <motion.section className="content-section" variants={itemVariants}>
                         
                            <div className="section-header"><h2>Your Personal Record (within this Plan)</h2></div>
                            {/* TODO: Add loading/error states for personal charts */}
                            <div className="personal-charts-container">
                                <div className="chart-container personal-chart">
                                    <h4>Your Contribution (Example)</h4>
                                    <ReactECharts option={personalPieChartOptions} style={{ height: '250px', width: '100%' }} notMerge={true} lazyUpdate={true} />
                                </div>
                                <div className="chart-container personal-chart">
                                    <h4>Expense Overview (Example)</h4>
                                    <ReactECharts option={personalBarChartOptions} style={{ height: '250px', width: '100%' }} notMerge={true} lazyUpdate={true} />
                                </div>
                            </div>
                            <div className="filter-export-bar compact-bar">
                                <div className="filter-controls">
                                    {/* TODO: Implement filtering/sorting */}
                                    <input type="text" placeholder="Search By Description" className="filter-input small-input" />
                                    <div className="filter-group"><label>Filter By Category:</label><select className="filter-select small-select" disabled={isLoadingCategories || availableCategories.length === 0}><option value="">All</option>{availableCategories.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
                                    <div className="filter-group"><label>Sort By Amount:</label><select className="filter-select small-select"><option value="desc">Descending</option><option value="asc">Ascending</option></select></div>
                                </div>
                                <motion.button onClick={() => openModal('isAddPersonalExpenseOpen')} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="primary-button small-button" disabled={isSubmitting}><AddIcon size={14}/> Add My Expense</motion.button>
                            </div>
                             {isLoadingExpenses && <div className="loading-message small">Loading personal expenses...</div>}
                             {expensesError && <div className="error-message small">Error loading personal expenses: {expensesError}</div>}
                             {!isLoadingExpenses && !expensesError && (
                                <div className="data-table-container">
                                    <table className="data-table expense-table personal-expense-table">
                                        <thead><tr><th>ID</th><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
                                        <tbody>
                                            {personalExpenses.map((item) => (
                                                <tr key={item._id}>
                                                    {/* Use _id from DB */}
                                                    <td>{item._id.slice(-6)}</td>
                                                    <td>{formatDate(item.created_at)}</td>
                                                    <td>{item.category_id.name || 'Unknown'}</td> {/* Use map */}
                                                    <td>{item.description}</td><td>Rs.{item.amount?.toLocaleString()}</td><td>{item.status}</td>
                                                    <td className="action-cell">
                                                        <motion.button onClick={() => openModal('isEditPersonalExpenseOpen', item)} title="Edit My Expense" whileTap={{ scale: 0.9 }} className="icon-button" disabled={isSubmitting}><EditIcon size={14}/></motion.button>
                                                        <motion.button onClick={() => openModal('isDeletePersonalExpenseOpen', item, 'personalExpense')} title="Delete My Expense" whileTap={{ scale: 0.9 }} className="icon-button" disabled={isSubmitting}><DeleteIcon size={14}/></motion.button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {personalExpenses.length === 0 && <tr><td colSpan="7" className="no-data-message">You haven't added any personal expenses to this plan yet.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                             )}
                        </motion.section>
                    </>
                 )}

            </motion.main>

            {/* --- MODALS --- */}
            {/* Add New Global Plan Modal */}
            <Modal isOpen={modalState.isAddPlanOpen} onClose={closeModal} title="Add New Family Plan">
                <form onSubmit={handleAddPlanSubmit} className="modal-form">
                    {submitError && <p className="error-message modal-error">{submitError}</p>}
                    <div className="form-group">
                        <label htmlFor="plan_name_add">Plan Name</label>
                        <input type="text" id="plan_name_add" name="plan_name" required className="input-field" value={addPlanFormData.plan_name} onChange={(e) => handleFormChange(e, setAddPlanFormData)} placeholder="e.g., Summer Vacation Fund"/>
                    </div>
                    {/* Add fields for initial budget, dates etc. if needed by addFamilyPlan API */}
                    <div className="form-actions">
                        <button type="button" className="secondary-button" onClick={closeModal} disabled={isSubmitting}>Cancel</button>
                        <button type="submit" className="primary-button" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Plan'}</button>
                    </div>
                </form>
            </Modal>

            {/* Plan Settings Modal */}
            <Modal isOpen={modalState.isSettingsOpen} onClose={closeModal} title="Plan Settings">
                <form onSubmit={handleSettingsSubmit} className="modal-form">
                    {submitError && <p className="error-message modal-error">{submitError}</p>}

                    {/* Plan Name */}
                    <div className="form-group">
                    <label htmlFor="plan_name_set">Plan Name</label>
                    <input
                        type="text"
                        id="plan_name_set"
                        name="plan_name"
                        required
                        className="input-field"
                        value={settingsFormData.plan_name}
                        onChange={(e) => handleFormChange(e, setSettingsFormData)}
                    />
                    </div>

                    {/* Total Budget */}
                    <div className="form-group">
                    <label htmlFor="total_budget_amount_set">Total Budget (Rs)</label>
                    <input
                        type="number"
                        id="total_budget_amount_set"
                        name="total_budget_amount"
                        required
                        min="0"
                        step="any"
                        className="input-field"
                        value={settingsFormData.total_budget_amount}
                        onChange={(e) => handleFormChange(e, setSettingsFormData)}
                    />
                    </div>

                    {/* Start Date */}
                    <div className="form-group">
                    <label htmlFor="start_date_set">Start Date</label>
                    <input
                        type="date"
                        id="start_date_set"
                        name="start_date"
                        required
                        className="input-field"
                        value={settingsFormData.start_date}
                        onChange={(e) => handleFormChange(e, setSettingsFormData)}
                    />
                    </div>

                    {/* End Date */}
                    <div className="form-group">
                    <label htmlFor="end_date_set">End Date</label>
                    <input
                        type="date"
                        id="end_date_set"
                        name="end_date"
                        required
                        className="input-field"
                        value={settingsFormData.end_date}
                        onChange={(e) => handleFormChange(e, setSettingsFormData)}
                    />
                    </div>

                    {/* Category-wise Budget Allocation */}
                    <div className="form-group">
                    <label>Category-wise Budget Allocation</label>
                    {availableCategories.length > 0 ? (
                        availableCategories.map((category) => (
                        <div key={category._id} className="category-budget-row">
                            <label htmlFor={`category_${category._id}`}>{category.name}</label>
                            <input
                            type="number"
                            id={`category_${category._id}`}
                            name={`category_${category._id}`}
                            min="0"
                            step="any"
                            className="input-field"
                            value={
                                settingsFormData.categories.find(c => c.category_id === category._id)?.budget || ''
                            }
                            onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;

                                // Update category budget
                                setSettingsFormData(prev => {
                                const updatedCategories = prev.categories.map(c =>
                                    c.category_id === category._id ? { ...c, budget: value } : c
                                );
                                return {
                                    ...prev,
                                    categories: updatedCategories,
                                };
                                });

                                // Recalculate total allocated after category budget change
                                setTimeout(() => {
                                const total = settingsFormData.categories.reduce((sum, c) => {
                                    return c.category_id === category._id
                                    ? sum + value
                                    : sum + parseFloat(c.budget || 0);
                                }, 0);
                                setTotalAllocatedBudget(total);
                                }, 0);
                            }}
                            />
                        </div>
                        ))
                    ) : (
                        <p className="info-message small">No categories available for budget allocation.</p>
                    )}

                    {/* Total allocated info */}
                    <p className="info-message small">
                        Total Allocated: Rs {totalAllocatedBudget} / Rs {settingsFormData.total_budget_amount}
                    </p>

                    {/* Overbudget warning */}
                    {totalAllocatedBudget > parseFloat(settingsFormData.total_budget_amount) && (
                        <p className="error-message">⚠️ Allocated budget exceeds total budget!</p>
                    )}
                    </div>

                    {/* Save Button */}
                    <button
                    type="submit"
                    className="primary-button"
                    disabled={
                        isSubmitting ||
                        totalAllocatedBudget > parseFloat(settingsFormData.total_budget_amount)
                    }
                    >
                    {isSubmitting ? 'Saving...' : 'Save Settings'}
                    </button>
                </form>
                </Modal>

             {/* Add Member Modal */}
             <Modal isOpen={modalState.isAddMemberOpen} onClose={closeModal} title="Add New Member">
                 <form onSubmit={handleAddMemberSubmit} className="modal-form">
                     {submitError && <p className="error-message modal-error">{submitError}</p>}
                     <div className="form-group"><label htmlFor="email_add">Member Email</label><input type="email" id="email_add" name="email" required className="input-field" placeholder="Enter email address" value={addMemberFormData.email} onChange={(e) => handleFormChange(e, setAddMemberFormData)}/></div>
                     <div className="form-group"><label htmlFor="role_add">Assign Role</label><select id="role_add" name="role" required className="select-field" value={addMemberFormData.role} onChange={(e) => handleFormChange(e, setAddMemberFormData)}><option value="viewer">Viewer</option><option value="editor">Editor</option><option value="admin">Admin</option></select></div>
                     <p className="info-message small">Note: Adding members is currently simulated. API integration needed.</p>
                     <div className="form-actions"><button type="button" className="secondary-button" onClick={closeModal}>Cancel</button><button type="submit" className="primary-button">Add Member</button></div>
                 </form>
             </Modal>

              {/* Export Modal */}
              <Modal isOpen={modalState.isExportOpen} onClose={closeModal} title="Export Expenses">
                  <form onSubmit={handleExportSubmit} className="modal-form">
                       {submitError && <p className="error-message modal-error">{submitError}</p>}
                       <div className="form-group"><label htmlFor="exp-dateRange_exp">Date Range:</label><select id="exp-dateRange_exp" name="dateRange" className="select-field" required value={exportFormData.dateRange} onChange={(e) => handleFormChange(e, setExportFormData)}><option value="current_month">Current Month</option><option value="last_month">Last Month</option><option value="last_3_months">Last 3 Months</option><option value="year_to_date">Year to Date</option><option value="all_time">All Time</option></select></div>
                       <div className="form-group"><label htmlFor="exp-format_exp">Format:</label><select id="exp-format_exp" name="format" className="select-field" required value={exportFormData.format} onChange={(e) => handleFormChange(e, setExportFormData)}><option value="csv">CSV</option><option value="pdf">PDF</option></select></div>
                       <p className="info-message small">Note: Exporting is currently simulated. API integration needed.</p>
                       <div className="form-actions"><button type="button" className="secondary-button" onClick={closeModal}>Cancel</button><button type="submit" className="primary-button">Export Data</button></div>
                  </form>
              </Modal>

             {/* Add/Edit Personal Expense Modal */}
             <Modal isOpen={modalState.isAddPersonalExpenseOpen || modalState.isEditPersonalExpenseOpen} onClose={closeModal} title={editingItem ? "Edit Personal Expense" : "Add Personal Expense"}>
                 <form onSubmit={(e) => handleAddEditExpenseSubmit(e, 'personal')} className="modal-form">
                     {submitError && <p className="error-message modal-error">{submitError}</p>}
                     {editingItem && (<div className="form-group"><label>Expense ID</label><input type="text" value={editingItem._id} className="input-field read-only" readOnly disabled/></div>)}
                     {/* Use names matching expenseFormData state keys */}
                     <div className="form-group"><label htmlFor="pexp-date_form">Date</label><input type="date" id="pexp-date_form" name="date" required className="input-field" value={expenseFormData.date} onChange={(e) => handleFormChange(e, setExpenseFormData)}/></div>
                     <div className="form-group">
                        <label htmlFor="pexp-category_id_form">Category</label>
                        <select id="pexp-category_id_form" name="category_id" required className="select-field" value={expenseFormData.category_id} onChange={(e) => handleFormChange(e, setExpenseFormData)} disabled={isLoadingCategories || availableCategories.length === 0}>
                           <option value="" disabled>-- Select --</option>
                           {isLoadingCategories && <option disabled>Loading...</option>}
                           {availableCategories.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
                           {!isLoadingCategories && availableCategories.length === 0 && <option disabled>No categories available</option>}
                        </select>
                     </div>
                     <div className="form-group"><label htmlFor="pexp-description_form">Description</label><input type="text" id="pexp-description_form" name="description" required className="input-field" value={expenseFormData.description} onChange={(e) => handleFormChange(e, setExpenseFormData)}/></div>
                     <div className="form-group"><label htmlFor="pexp-amount_form">Amount (Rs)</label><input type="number" id="pexp-amount_form" name="amount" required min="0.01" step="any" className="input-field" value={expenseFormData.amount} onChange={(e) => handleFormChange(e, setExpenseFormData)}/></div>
                     <div className="form-group"><label htmlFor="pexp-notes_form">Notes (Optional)</label><textarea id="pexp-notes_form" name="notes" className="textarea-field" value={expenseFormData.notes} onChange={(e) => handleFormChange(e, setExpenseFormData)}></textarea></div>
                     <p className="info-message small">Note: Adding/Editing expenses is currently simulated. API integration needed.</p>
                     <div className="form-actions">
                        <button type="button" className="secondary-button" onClick={closeModal} disabled={isSubmitting}>Cancel</button>
                        <button type="submit" className="primary-button" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : (editingItem ? "Save Changes" : "Add Expense")}</button>
                     </div>
                 </form>
             </Modal>

             {/* Edit Family Expense Modal */}
             <Modal isOpen={modalState.isEditFamilyExpenseOpen} onClose={closeModal} title="Edit Family Expense">
                 <form onSubmit={(e) => handleAddEditExpenseSubmit(e, 'family')} className="modal-form">
                    {submitError && <p className="error-message modal-error">{submitError}</p>}
                     {editingItem && (<div className="form-group"><label>Expense ID</label><input type="text" value={editingItem._id} className="input-field read-only" readOnly disabled/></div>)}
                      {/* Use names matching expenseFormData state keys */}
                     <div className="form-group"><label htmlFor="fexp-date_form">Date</label><input type="date" id="fexp-date_form" name="date" required className="input-field" value={expenseFormData.date} onChange={(e) => handleFormChange(e, setExpenseFormData)}/></div>
                     <div className="form-group">
                        <label htmlFor="fexp-category_id_form">Category</label>
                        <select id="fexp-category_id_form" name="category_id" required className="select-field" value={expenseFormData.category_id} onChange={(e) => handleFormChange(e, setExpenseFormData)} disabled={isLoadingCategories || availableCategories.length === 0}>
                            <option value="" disabled>-- Select --</option>
                           {isLoadingCategories && <option disabled>Loading...</option>}
                            {availableCategories.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
                             {!isLoadingCategories && availableCategories.length === 0 && <option disabled>No categories available</option>}
                        </select>
                     </div>
                     <div className="form-group"><label htmlFor="fexp-description_form">Description</label><input type="text" id="fexp-description_form" name="description" required className="input-field" value={expenseFormData.description} onChange={(e) => handleFormChange(e, setExpenseFormData)}/></div>
                     <div className="form-group"><label htmlFor="fexp-amount_form">Amount (Rs)</label><input type="number" id="fexp-amount_form" name="amount" required min="0.01" step="any" className="input-field" value={expenseFormData.amount} onChange={(e) => handleFormChange(e, setExpenseFormData)}/></div>
                     <div className="form-group"><label htmlFor="fexp-notes_form">Notes (Optional)</label><textarea id="fexp-notes_form" name="notes" className="textarea-field" value={expenseFormData.notes} onChange={(e) => handleFormChange(e, setExpenseFormData)}></textarea></div>
                     <p className="info-message small">Note: Editing family expenses is currently simulated. API integration needed.</p>
                     <div className="form-actions">
                        <button type="button" className="secondary-button" onClick={closeModal} disabled={isSubmitting}>Cancel</button>
                        <button type="submit" className="primary-button" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</button>
                     </div>
                 </form>
             </Modal>

            {/* Edit Member Modal Placeholder */}
             {/* Edit Member Modal */}
             <Modal isOpen={modalState.isEditMemberOpen} onClose={closeModal} title={`Edit Member: ${editingItem?.user?.name || ''}`}>
                  <form onSubmit={handleEditMemberSubmit} className="modal-form">
                      {submitError && <p className="error-message modal-error">{submitError}</p>}
                       {/* Display user email (read-only) */}
                       <div className="form-group">
                           <label>Email:</label>
                           <input type="email" readOnly disabled value={editingItem?.user?.email || ''} className="input-field"/>
                       </div>
                       {/* Allow changing role */}
                       <div className="form-group">
                           <label htmlFor="edit_mem_role">Role</label>
                           <select
                              id="edit_mem_role"
                              name="role"
                              className="select-field"
                              // Set default value based on the member's current role
                              defaultValue={editingItem?.role?.toLowerCase()}
                           >
                               <option value="viewer">Viewer</option>
                               <option value="editor">Editor</option>
                               {/* Optionally allow promoting to admin, be careful */}
                               {/* <option value="admin">Admin</option> */}
                           </select>
                       </div>
                       <div className="form-actions">
                            <button type="button" className="secondary-button" onClick={closeModal} disabled={isSubmitting}>Cancel</button>
                            <button type="submit" className="primary-button" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Role'}</button>
                       </div>
                  </form>
             </Modal>

             {/* Universal Delete Confirmation Modal */}
             <Modal isOpen={modalState.isDeleteMemberOpen || modalState.isDeleteFamilyExpenseOpen || modalState.isDeletePersonalExpenseOpen || modalState.isDeletePlanOpen} onClose={closeModal} title={`Confirm Deletion: ${deletingItemType.replace(/([A-Z])/g, ' $1').trim()}`}>
                {submitError && <p className="error-message modal-error">{submitError}</p>}
                <div className="confirmation-text">
                   Are you sure you want to delete this {deletingItemType.replace(/([A-Z])/g, ' $1').toLowerCase()}
                   {deletingItemId ? ` (ID ending with: ...${deletingItemId.slice(-6)})` : ''}?
                   {deletingItemType === 'plan' && ' This will remove the plan and all associated data.'}
                   This action cannot be undone.
                 </div>
                 {/* Display more info if available, e.g., item name */}
                 {editingItem && editingItem.name && <div><strong>Name:</strong> {editingItem.name}</div>}
                 {editingItem && editingItem.description && <div><strong>Description:</strong> {editingItem.description}</div>}
                 <p className="info-message small">Note: Deleting members/expenses is currently simulated. API integration needed for these types.</p>
                <div className="confirmation-actions">
                    <motion.button type="button" className="secondary-button" onClick={closeModal} whileTap={{ scale: 0.95 }} disabled={isSubmitting}>Cancel</motion.button>
                    <motion.button type="button" className="primary-button delete-confirm-button" onClick={confirmDelete} whileTap={{ scale: 0.95 }} disabled={isSubmitting}>
                         {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
                    </motion.button>
                </div>
            </Modal>

            <Footer />
        </div>
    );
};

export default FamilyBudgetingPage;