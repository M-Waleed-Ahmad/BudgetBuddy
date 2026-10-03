const express = require('express');
const budgets = require('../controllers/budgetController');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.route('/').get(budgets.listBudgets).post(budgets.createBudget);
router.route('/:id').put(budgets.updateBudget).delete(budgets.deleteBudget);

module.exports = router;
