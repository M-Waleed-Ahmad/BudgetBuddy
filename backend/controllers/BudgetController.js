const Budget = require('../models/Budget');

// Get all budgets
const getAllBudgets = async (req, res) => {
    try {
        const budgets = await Budget.find();
        res.status(200).json(budgets);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Get a single budget by ID
const getBudgetById = async (req, res) => {
    try {
        const budget = await Budget.findById(req.params.id);
        if (!budget) {
            return res.status(404).json({ message: 'Budget not found' });
        }
        res.status(200).json(budget);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Create a new budget
const createBudget = async (req, res) => {
    try {
        const newBudget = new Budget(req.body);
        const userId = req.user.userId; // Or req.user._id, depending on your JWT setup
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        newBudget.user_id = userId; // Set the user_id from the authenticated user
        const savedBudget = await newBudget.save();
        res.status(201).json(savedBudget);
    } catch (error) {
        res.status(400).json({ message: 'Error creating budget', error });
    }
};

// Update a budget by ID
const updateBudget = async (req, res) => {
    try {
        const updatedBudget = await Budget.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedBudget) {
            return res.status(404).json({ message: 'Budget not found' });
        }
        res.status(200).json(updatedBudget);
    } catch (error) {
        res.status(400).json({ message: 'Error updating budget', error });
    }
};

// Delete a budget by ID
const deleteBudget = async (req, res) => {
    try {
        const deletedBudget = await Budget.findByIdAndDelete(req.params.id);
        if (!deletedBudget) {
            return res.status(404).json({ message: 'Budget not found' });
        }
        res.status(200).json({ message: 'Budget deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
// controllers/budgetController.js

// Get all budgets for the logged-in user for a specific month
const getUserBudgetsForMonth = async (req, res) => {
    try {

        const userId = req.user.userId; // Or req.user._id, depending on your JWT setup
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Get monthYear from query parameters (e.g., /api/budgets?monthYear=2024-08)
        const { monthYear } = req.query;
        if (!monthYear || !/^\d{4}-\d{2}$/.test(monthYear)) {
             // Send empty array or error if monthYear is missing/invalid? Let's send empty for now.
             console.warn('MonthYear query parameter missing or invalid:', monthYear);
            return res.status(200).json([]);
            // Alternatively: return res.status(400).json({ message: 'Valid monthYear query parameter (YYYY-MM) is required' });
        }


         const budgets = await Budget.find({
            user_id: userId,
            month_year: monthYear
        }).populate('category_id', 'name'); // Populate category name
        let returnedBudgets = [];
        returnedBudgets = budgets.map(budget => {
            return {
                ...budget._doc,
                category_name: budget.category_id.name // Add category name to the returned object
            };
        });
       
        console.log('Fetched budgets for month:', monthYear, 'Budgets:', returnedBudgets);
        res.status(200).json(returnedBudgets || []); // Return found budgets or empty array

    } catch (error) {
        console.error('Error fetching user budgets for month:', error);
        res.status(500).json({ message: 'Server error while fetching budgets', error: error.message });
    }
};



module.exports = { 
    getAllBudgets,
    getBudgetById,
    createBudget,
    updateBudget,
    deleteBudget,
    getUserBudgetsForMonth,
};