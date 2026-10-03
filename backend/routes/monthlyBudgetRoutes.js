const express = require('express');
const monthlyBudgets = require('../controllers/monthlyBudgetController');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.get('/current', monthlyBudgets.getCurrentMonthlyBudget);
router.route('/').get(monthlyBudgets.listMonthlyBudgets).post(monthlyBudgets.createMonthlyBudget);
router.route('/:id').put(monthlyBudgets.updateMonthlyBudget).delete(monthlyBudgets.deleteMonthlyBudget);

module.exports = router;
