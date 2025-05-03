// controllers/expenseController.js
const Expense = require('../models/Expense');
const MonthlyBudget = require('../models/MonthlyBudget');
const mongoose = require('mongoose');
const { format, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval } = require('date-fns');
const sendNotification = require('../utils/sendNotifications'); // Assuming you have a utility for sending notifications

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
const addExpense = async (req, res) => {
    try {
      const userId = req.user.userId;
      const { category_id, amount, description, expense_date, notes } = req.body;
  
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      if (!category_id || !amount || !expense_date) {
        return res.status(400).json({ message: 'Missing required fields (category_id, amount, expense_date)' });
      }
      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: 'Amount must be a positive number' });
      }
  
      const newExpense = new Expense({
        user_id: userId,
        category_id,
        amount,
        description,
        expense_date: new Date(expense_date),
        notes: notes || '',
      });
  
      const savedExpense = await newExpense.save();
      await savedExpense.populate('category_id', 'name');
  
      // ✅ Send notification
      await sendNotification({
        recipient_user_id: userId,
        type: 'expense_added',
        message: `You added a new expense of $${amount} in category "${savedExpense.category_id.name}".`,
        actor_user_id: userId,
        related_entity: {
          id: savedExpense._id,
          model_type: 'Expense',
        },
        link: `/expenses/${savedExpense._id}`,
      });
  
      res.status(201).json(savedExpense);
  
    } catch (error) {
      console.error('Error adding expense:', error);
      res.status(500).json({ message: 'Server error while adding expense', error: error.message });
    }
  };
  
// --- Update Existing Expense ---
const updateExpense = async (req, res) => {
    try {
      const userId = req.user.userId;
      const expenseId = req.params.id;
      const { category_id, amount, description, expense_date, notes } = req.body;
  
      if (!userId) return res.status(401).json({ message: 'User not authenticated' });
      if (!mongoose.Types.ObjectId.isValid(expenseId)) {
        return res.status(400).json({ message: 'Invalid expense ID format' });
      }
  
      const expense = await Expense.findOne({ _id: expenseId, user_id: userId });
      if (!expense) return res.status(404).json({ message: 'Expense not found or user not authorized' });
  
      if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
        return res.status(400).json({ message: 'Amount must be a positive number' });
      }
  
      if (category_id !== undefined) expense.category_id = category_id;
      if (amount !== undefined) expense.amount = amount;
      if (description !== undefined) expense.description = description;
      if (notes !== undefined) expense.notes = notes;
      if (expense_date !== undefined) expense.expense_date = new Date(expense_date);
  
      const updatedExpense = await expense.save();
      await updatedExpense.populate('category_id', 'name');
  
      // ✅ Send notification
      await sendNotification({
        recipient_user_id: userId,
        type: 'generic_message',
        message: `You updated your expense: $${updatedExpense.amount} in category "${updatedExpense.category_id.name}".`,
        actor_user_id: userId,
        related_entity: {
          id: updatedExpense._id,
          model_type: 'Expense',
        },
        link: `/expenses/${updatedExpense._id}`,
      });
  
      res.status(200).json(updatedExpense);
  
    } catch (error) {
      console.error('Error updating expense:', error);
      res.status(500).json({ message: 'Server error while updating expense', error: error.message });
    }
  };
  
// --- Delete Expense ---
const deleteExpense = async (req, res) => {
    try {
      const userId = req.user.userId;
      const expenseId = req.params.id;
  
      if (!userId) return res.status(401).json({ message: 'User not authenticated' });
      if (!mongoose.Types.ObjectId.isValid(expenseId)) {
        return res.status(400).json({ message: 'Invalid expense ID format' });
      }
  
      const deletedExpense = await Expense.findOneAndDelete({ _id: expenseId, user_id: userId });
      if (!deletedExpense) return res.status(404).json({ message: 'Expense not found or user not authorized' });
  
      // ✅ Send notification
      await sendNotification({
        recipient_user_id: userId,
        type: 'generic_message',
        message: `You deleted an expense of $${deletedExpense.amount}.`,
        actor_user_id: userId,
        related_entity: {
          id: deletedExpense._id,
          model_type: 'Expense',
        },
        link: `/expenses`,
      });
  
      res.status(200).json({ message: 'Expense deleted successfully' });
  
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
const getPersonalExpenses = async (req, res) => { // Can reuse/extend existing GET /api/expenses
    try {
        const userId = req.user.userId;
        if (!userId) return res.status(401).json({ message: 'Auth required.' });

        const limit = parseInt(req.query.limit, 10) || 5; // Default limit
        const sortQuery = req.query.sort || '-expense_date'; // Default sort

        // Basic sort validation (prevent injection)
        const allowedSortFields = ['expense_date', 'amount', 'created_at'];
        let sortOptions = {};
        if (typeof sortQuery === 'string') {
            const direction = sortQuery.startsWith('-') ? -1 : 1;
            const field = sortQuery.replace('-', '');
            if (allowedSortFields.includes(field)) {
                sortOptions[field] = direction;
            } else {
                sortOptions = { expense_date: -1 }; // Default fallback
            }
        } else {
             sortOptions = { expense_date: -1 }; // Default fallback
        }


        const expenses = await Expense.find({ user_id: userId }) // Filter by user
            .sort(sortOptions)
            .limit(limit)
            .populate('category_id', 'name') // Populate category name
            .lean();

        res.status(200).json(expenses || []);

    } catch (error) {
        console.error("Error fetching personal expenses:", error);
        res.status(500).json({ message: "Server error fetching expenses.", error: error.message });
    }
};

// --- Get Current Month's Total Personal Spending ---
// GET /api/expenses/current-month-total
const getCurrentMonthSpendingTotal = async (req, res) => {
    try {
        const userId = req.user.userId;
        if (!userId) return res.status(401).json({ message: 'Auth required.' });

        const now = new Date();
        const startDate = startOfMonth(now);
        const endDate = endOfMonth(now);

        const result = await Expense.aggregate([
            {
                $match: {
                    user_id: new mongoose.Types.ObjectId(userId), // Convert string ID to ObjectId
                    expense_date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: null, // Group all matching documents
                    totalSpent: { $sum: "$amount" }
                }
            }
        ]);

        const totalSpent = result.length > 0 ? result[0].totalSpent : 0;
        res.status(200).json({ totalSpent });

    } catch (error) {
        console.error("Error fetching current month spending total:", error);
        res.status(500).json({ message: "Server error calculating spending total.", error: error.message });
    }
};

// --- Get Spending Trends by Category over N Months ---
// GET /api/expenses/trends?months=9
const getSpendingTrends = async (req, res) => {
    try {
        const userId = req.user.userId;
        if (!userId) return res.status(401).json({ message: 'Auth required.' });

        const monthsToFetch = parseInt(req.query.months, 10) || 9;
        if (monthsToFetch <= 0 || monthsToFetch > 24) {
            return res.status(400).json({ message: 'Invalid number of months requested.' });
        }

        const now = new Date();
        const endDate = endOfMonth(now);
        const startDate = startOfMonth(subMonths(now, monthsToFetch - 1));

        const monthLabels = eachMonthOfInterval({ start: startDate, end: endDate })
            .map(date => format(date, 'yyyy-MM'));

        const results = await Expense.aggregate([
            // 1. Match user and date range
            { $match: {
                user_id: new mongoose.Types.ObjectId(userId),
                expense_date: { $gte: startDate, $lte: endDate }
            }},
            // 2. Project month string and category ID - REMOVED timeZone
            { $project: {
                // Use $dateToString WITHOUT the timeZone option
                month: { $dateToString: { format: "%Y-%m", date: "$expense_date" } },
                category_id: 1,
                amount: 1
            }},
            // 3. Group by month and category, sum amount
            { $group: {
                _id: { month: "$month", category: "$category_id" },
                monthlyCategoryTotal: { $sum: "$amount" }
            }},
            // 4. Group again by category, pushing monthly data
            { $group: {
                _id: "$_id.category", // Group by category ID
                monthlyData: {
                    $push: {
                        month: "$_id.month",
                        total: "$monthlyCategoryTotal"
                    }
                }
            }},
            // 5. Lookup category name
            { $lookup: {
                from: 'categories', // Ensure this matches your collection name
                localField: '_id',
                foreignField: '_id',
                as: 'categoryInfo'
            }},
            // 6. Project the final shape
            { $project: {
                _id: 0,
                name: { $ifNull: [{ $arrayElemAt: ["$categoryInfo.name", 0] }, "Uncategorized"] },
                data: "$monthlyData"
            }},
            // 7. Sort by category name (optional)
            { $sort: { name: 1 } }
        ]);

        // Post-processing: Ensure each category has data for all months
        const processedCategories = results.map(category => {
            const monthlyDataMap = category.data.reduce((map, item) => {
                map[item.month] = item.total;
                return map;
            }, {});
            const fullData = monthLabels.map(month => monthlyDataMap[month] || 0); // Fill missing months with 0
            return { name: category.name, data: fullData };
        });

        res.status(200).json({
            months: monthLabels,
            categories: processedCategories
        });

    } catch (error) {
        console.error("Error fetching spending trends:", error);
        // Check for the specific MongoServerError related to $dateToString if needed for debugging
        if (error.codeName === 'Location18534' || error.message.includes('$dateToString')) {
             console.error("Potential MongoDB version issue with $dateToString timezone.");
        }
        res.status(500).json({ message: "Server error fetching spending trends.", error: error.message });
    }
};
const getRecentExpenses = async (req, res) => {
    try {
        const userId = req.user.userId;
        if (!userId) return res.status(401).json({ message: 'Auth required.' });

        const limit = parseInt(req.query.limit, 10) || 5; // Default limit
        const sortQuery = req.query.sort || '-expense_date'; // Default sort

        // Basic sort validation (prevent injection)
        const allowedSortFields = ['expense_date', 'amount', 'created_at'];
        let sortOptions = {};
        if (typeof sortQuery === 'string') {
            const direction = sortQuery.startsWith('-') ? -1 : 1;
            const field = sortQuery.replace('-', '');
            if (allowedSortFields.includes(field)) {
                sortOptions[field] = direction;
            } else {
                sortOptions = { expense_date: -1 }; // Default fallback
            }
        } else {
             sortOptions = { expense_date: -1 }; // Default fallback
        }


        const expenses = await Expense.find({ user_id: userId }) // Filter by user
            .sort(sortOptions)
            .limit(limit)
            .populate('category_id', 'name') // Populate category name
            .lean();

        res.status(200).json(expenses || []);

    } catch (error) {
        console.error("Error fetching recent expenses:", error);
        res.status(500).json({ message: "Server error fetching recent expenses.", error: error.message });
    }
};

module.exports = {
    getExpensesForCurrentMonthPlan,
    addExpense,
    updateExpense,
    deleteExpense,
    getCategoryWiseSpendingForCurrentMonth,
    getPersonalExpenses,
    getCurrentMonthSpendingTotal,
    getSpendingTrends,
    getRecentExpenses
};
