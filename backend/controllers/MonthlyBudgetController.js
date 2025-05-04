const MonthlyBudget = require('../models/MonthlyBudget');
const getCurrentYearMonth = () => format(new Date(), 'yyyy-MM');
const { format } = require('date-fns'); // Import date-fns for date formatting
// Get all monthly budgets
const getAllMonthlyBudgets = async (req, res) => {
    try {
        const budgets = await MonthlyBudget.find();
        res.status(200).json(budgets);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Get a single monthly budget by ID
const getMonthlyBudgetById = async (req, res) => {
    try {
        const budget = await MonthlyBudget.findById(req.params.id);
        if (!budget) {
            return res.status(404).json({ message: 'Budget not found' });
        }
        res.status(200).json(budget);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Create a new monthly budget
const createMonthlyBudget = async (req, res) => {
    try {
        // Validate start and end dates
        const start_date = req.body.start_date || new Date(); // Default to current date if not provided
        const end_date = req.body.end_date || new Date(); // Default to current date if not provided
        const user_id = req.user.userId; // Assuming you have user ID from the token
        const month_year = start_date.substring(0, 7); // Extract 'YYYY-MM' from start_date
        const total_budget_amount = req.body.totalAmount || 0; // Default to 0 if not provided

        if (new Date(start_date) > new Date(end_date)) {
            return res.status(400).json({ message: 'Start date cannot be after end date' });
        }
        const newBudget = new MonthlyBudget({
            start_date: start_date,
            end_date: end_date,
            user_id: user_id,
            total_budget_amount: total_budget_amount,
            month_year: month_year,
        });
        const savedBudget = await newBudget.save();
        res.status(201).json(savedBudget);
    } catch (error) {
        res.status(400).json({ message: 'Invalid data', error });
    }
};

// Update a monthly budget by ID
const updateMonthlyBudget = async (req, res) => {
    try {
        const updatedBudget = await MonthlyBudget.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedBudget) {
            return res.status(404).json({ message: 'Budget not found' });
        }
        res.status(200).json(updatedBudget);
    }
    catch (error) {
        res.status(400).json({ message: 'Error updating budget', error });
    }
};
// Delete a monthly budget by ID
const deleteMonthlyBudget = async (req, res) => {
    try {
        const deletedBudget = await MonthlyBudget.findByIdAndDelete(req.params.id);
        if (!deletedBudget) {
            return res.status(404).json({ message: 'Budget not found' });
        }
        res.status(200).json({ message: 'Budget deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Get the monthly budget for the current month
const getCurrentMonthBudget = async (req, res) => {
    try {
        const currentDate = new Date();
        const budget = await MonthlyBudget.findOne({
            user_id: req.user.userId,
            month_year: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
        });
        if (!budget) {
            return res.status(200).json({ message: 'Budget for the current month not found' });
        }

        res.status(200).json(budget);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

const getCurrentUserMonthlyBudget = async (req, res) => {
    try {
        const userId = req.user.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required.' });
        }

        const currentMonthYear = getCurrentYearMonth();

        const budget = await MonthlyBudget.findOne({
            user_id: userId,
            month_year: currentMonthYear
        }).lean(); // Use lean for performance

        if (!budget) {
            // It's not an error if no budget is set, return appropriate response
            // Option 1: Return 404
             return res.status(404).json({ message: 'No monthly budget set for the current month.' });
            // Option 2: Return 200 with null or empty object
            // return res.status(200).json(null);
        }

        res.status(200).json(budget);

    } catch (error) {
        console.error("Error fetching current monthly budget:", error);
        res.status(500).json({ message: "Server error fetching monthly budget.", error: error.message });
    }
};


module.exports = {
    getAllMonthlyBudgets,
    getMonthlyBudgetById,
    createMonthlyBudget,
    updateMonthlyBudget,
    deleteMonthlyBudget,
    getCurrentMonthBudget,
    getCurrentUserMonthlyBudget
};
