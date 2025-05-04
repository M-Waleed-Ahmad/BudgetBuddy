// routes/expenseRoutes.js
const express = require('express');
const expenseController = require('../controllers/expenseController');
const verifyToken   = require('../middleware/authMiddleware'); // Your JWT auth middleware

const router = express.Router();

// GET /api/expenses/current-month-plan - Fetch expenses for the current month's plan period
router.get(
    '/current-month-plan',
    verifyToken  ,
    expenseController.getExpensesForCurrentMonthPlan
);

router.get(
    '/current-month/category-wise',
    verifyToken  ,
    expenseController.getCategoryWiseSpendingForCurrentMonth
);

// POST /api/expenses - Add a new expense
router.post('/', verifyToken  , expenseController.addExpense);

// PUT /api/expenses/:id - Update an expense
router.put('/:id', verifyToken  , expenseController.updateExpense);

// DELETE /api/expenses/:id - Delete an expense
router.delete('/:id', verifyToken  , expenseController.deleteExpense);

router.get('/current-month-total', verifyToken, expenseController.getCurrentMonthSpendingTotal);

// GET /api/expenses/trends - Get spending trends data
router.get('/trends', verifyToken, expenseController.getSpendingTrends);

// GET /api/expenses/recent - Fetch recent expenses with a limit
router.get('/recent', verifyToken, expenseController.getRecentExpenses);
// Optional: GET /api/expenses - Fetch expenses with filters (e.g., date range, category) - add later if needed
// router.get('/', authMiddleware, expenseController.getAllExpensesFiltered);

module.exports = router;