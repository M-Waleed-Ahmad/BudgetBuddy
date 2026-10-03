const express = require('express');
const expenses = require('../controllers/expenseController');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.get('/current-month-plan', expenses.getCurrentPeriodExpenses);
router.get('/current-month/category-wise', expenses.getCategoryWiseSpending);
router.get('/current-month-total', expenses.getCurrentPeriodTotal);
router.get('/trends', expenses.getSpendingTrends);
router.get('/recent', expenses.getRecentExpenses);
router.route('/').get(expenses.listExpenses).post(expenses.createExpense);
router.route('/:id').put(expenses.updateExpense).delete(expenses.deleteExpense);

module.exports = router;
