const FamilyExpense = require('../models/FamilyExpense');

// Create a new family expense
const createExpense = async (req, res) => {
    try {
        const { plan_id, added_by_user_id, category_id, amount, description, notes, expense_date, status, approved_by_user_id } = req.body;

        const newExpense = new FamilyExpense({
            plan_id,
            added_by_user_id,
            category_id,
            amount,
            description,
            notes,
            expense_date,
            status,
            approved_by_user_id,
        });

        const savedExpense = await newExpense.save();
        res.status(201).json(savedExpense);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all expenses for a specific family plan
const getExpensesByPlan = async (req, res) => {
    try {
        const { plan_id } = req.params;

        const expenses = await FamilyExpense.find({ plan_id }).populate('added_by_user_id category_id approved_by_user_id');
        res.status(200).json(expenses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a single expense by ID
const getExpenseById = async (req, res) => {
    try {
        const { id } = req.params;

        const expense = await FamilyExpense.findById(id).populate('added_by_user_id category_id approved_by_user_id');
        if (!expense) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        res.status(200).json(expense);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update an expense
const updateExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const updatedExpense = await FamilyExpense.findByIdAndUpdate(id, updates, { new: true }).populate('added_by_user_id category_id approved_by_user_id');
        if (!updatedExpense) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        res.status(200).json(updatedExpense);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete an expense
const deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedExpense = await FamilyExpense.findByIdAndDelete(id);
        if (!deletedExpense) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        res.status(200).json({ message: 'Expense deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all expenses for a specific plan and user
const getExpensesByPlanAndUser = async (req, res) => {
    try {
        const { plan_id, user_id } = req.params;

        const expenses = await FamilyExpense.find({ plan_id, added_by_user_id: user_id }).populate('added_by_user_id category_id approved_by_user_id');
        res.status(200).json(expenses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createExpense,
    getExpensesByPlan,
    getExpenseById,
    updateExpense,
    deleteExpense,
    getExpensesByPlanAndUser,
};