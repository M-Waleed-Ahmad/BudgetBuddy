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
        console.log('New Budget:', newBudget); // Log the new budget object
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

module.exports = { 
    getAllBudgets,
    getBudgetById,
    createBudget,
    updateBudget,
    deleteBudget,
};