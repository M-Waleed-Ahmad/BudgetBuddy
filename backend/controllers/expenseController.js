// controllers/expenseController.js
const Expense = require('../models/Expense');
const MonthlyBudget = require('../models/MonthlyBudget');
const mongoose = require('mongoose');
const { startOfMonth, endOfMonth, format } = require('date-fns'); // Use date-fns for reliable date handling

// Helper to get current YYYY-MM string
const getCurrentYearMonth = () => format(new Date(), 'yyyy-MM');

// --- Fetch Expenses for Current Month's Plan ---
const  getExpensesForCurrentMonthPlan = async (req, res) => {
    try {
        const userId = req.user.userId; // Assuming JWT middleware adds userId to req.user
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const currentMonthYear = getCurrentYearMonth();

        // 1. Find the current monthly budget plan to get the date range
        const currentPlan = await MonthlyBudget.findOne({
            user_id: userId,
            month_year: currentMonthYear
        });

        if (!currentPlan) {
            // If no plan exists for the current month, return empty results
            console.log(`No monthly budget plan found for user ${userId} for month ${currentMonthYear}`);
            return res.status(200).json({ expenses: [], totalSpent: 0 });
            // Or return 404: return res.status(404).json({ message: 'No monthly budget plan found for the current month.' });
        }

        // Use the precise start and end dates from the plan
        const startDate = currentPlan.start_date;
        const endDate = currentPlan.end_date;

        console.log(`Fetching expenses for user ${userId} between ${startDate} and ${endDate}`);

        // 2. Find expenses within the date range for the user
        const expenses = await Expense.find({
            user_id: userId,
            expense_date: {
                $gte: startDate, // Greater than or equal to start date
                $lte: endDate    // Less than or equal to end date
            }
        })
        .populate('category_id', 'name') // Populate category name
        .sort({ expense_date: -1 });    // Sort by date, newest first

        // 3. Calculate total amount spent within the range
        let totalSpent = 0;
        expenses.forEach(expense => {
            totalSpent += expense.amount || 0;
        });

        res.status(200).json({
            expenses: expenses || [],
            totalSpent: totalSpent
        });

    } catch (error) {
        console.error('Error fetching expenses for current month plan:', error);
        res.status(500).json({ message: 'Server error while fetching expenses', error: error.message });
    }
};

// --- Add New Expense ---
const  addExpense = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { category_id, amount, description, expense_date ,notes} = req.body;
        console.log(`Adding expense for user ${userId}:`, notes);

        // Basic Validation
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        if (!category_id || !amount || !expense_date) {
            return res.status(400).json({ message: 'Missing required fields (category_id, amount, expense_date)' });
        }
        if (typeof amount !== 'number' || amount <= 0) {
             return res.status(400).json({ message: 'Amount must be a positive number' });
        }
        // Consider adding more validation (e.g., category exists, date format)

        const newExpense = new Expense({
            user_id: userId,
            category_id,
            amount,
            description,
            expense_date: new Date(expense_date), // Ensure it's stored as a Date object
            notes: notes || '', // Optional field, default to empty string if not provided
        });

        const savedExpense = await newExpense.save();
        // Optionally populate category name for the response
        await savedExpense.populate('category_id', 'name');

        res.status(201).json(savedExpense);

    } catch (error) {
        console.error('Error adding expense:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation Error', errors: error.errors });
        }
        res.status(500).json({ message: 'Server error while adding expense', error: error.message });
    }
};

// --- Update Existing Expense ---
const  updateExpense = async (req, res) => {
    try {
        const userId = req.user.userId;
        const expenseId = req.params.id; // Get expense ID from URL parameter
        const { category_id, amount, description, expense_date ,notes} = req.body;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        if (!mongoose.Types.ObjectId.isValid(expenseId)) {
            return res.status(400).json({ message: 'Invalid expense ID format' });
        }

        // Validation for update data
        if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
            return res.status(400).json({ message: 'Amount must be a positive number' });
        }
        // Add other validations as needed (valid category_id if provided, valid date format)

        // Find the expense by ID and ensure it belongs to the logged-in user
        const expense = await Expense.findOne({ _id: expenseId, user_id: userId });

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found or user not authorized' });
        }

        // Update fields if they are provided in the request body
        if (category_id !== undefined) expense.category_id = category_id;
        if (amount !== undefined) expense.amount = amount;
        if (description !== undefined) expense.description = description;
        if (notes !== undefined) expense.notes = notes; // Optional field
        if (expense_date !== undefined) expense.expense_date = new Date(expense_date);

        const updatedExpense = await expense.save();
        // Optionally populate category name for the response
        await updatedExpense.populate('category_id', 'name');

        res.status(200).json(updatedExpense);

    } catch (error) {
        console.error('Error updating expense:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation Error', errors: error.errors });
        }
        res.status(500).json({ message: 'Server error while updating expense', error: error.message });
    }
};

// --- Delete Expense ---
const  deleteExpense = async (req, res) => {
    try {
        const userId = req.user.userId;
        const expenseId = req.params.id;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        if (!mongoose.Types.ObjectId.isValid(expenseId)) {
            return res.status(400).json({ message: 'Invalid expense ID format' });
        }

        // Find and delete the expense, ensuring it belongs to the user
        const deletedExpense = await Expense.findOneAndDelete({ _id: expenseId, user_id: userId });

        if (!deletedExpense) {
            return res.status(404).json({ message: 'Expense not found or user not authorized' });
        }

        res.status(200).json({ message: 'Expense deleted successfully' }); // Or use status 204 No Content

    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ message: 'Server error while deleting expense', error: error.message });
    }
};
// --- Get Amounts Spent Per Category for Current Month ---
const getCategoryWiseSpendingForCurrentMonth = async (req, res) => {
    try {
        const userId = req.user.userId; // Assuming JWT middleware adds userId to req.user
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const currentMonthYear = getCurrentYearMonth();

        // Find the current monthly budget plan to get the date range
        const currentPlan = await MonthlyBudget.findOne({
            user_id: userId,
            month_year: currentMonthYear
        });

        if (!currentPlan) {
            console.log(`No monthly budget plan found for user ${userId} for month ${currentMonthYear}`);
            return res.status(200).json({ categoryWiseSpending: [] });
        }

        const startDate = currentPlan.start_date;
        const endDate = currentPlan.end_date;

        console.log(`Fetching category-wise spending for user ${userId} between ${startDate} and ${endDate}`);

        // Aggregate expenses to calculate total amount spent per category
        const categoryWiseSpending = await Expense.aggregate([
            {
                $match: {
                    user_id: mongoose.Types.ObjectId(userId),
                    expense_date: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    }
                }
            },
            {
                $group: {
                    _id: "$category_id",
                    totalSpent: { $sum: "$amount" }
                }
            },
            {
                $lookup: {
                    from: "categories", // Assuming the collection name for categories is 'categories'
                    localField: "_id",
                    foreignField: "_id",
                    as: "category"
                }
            },
            {
                $unwind: "$category"
            },
            {
                $project: {
                    categoryName: "$category.name",
                    totalSpent: 1
                }
            }
        ]);

        res.status(200).json({ categoryWiseSpending });

    } catch (error) {
        console.error('Error fetching category-wise spending for current month:', error);
        res.status(500).json({ message: 'Server error while fetching category-wise spending', error: error.message });
    }
};

module.exports = {
    getExpensesForCurrentMonthPlan,
    addExpense,
    updateExpense,
    deleteExpense,
    getCategoryWiseSpendingForCurrentMonth
};
