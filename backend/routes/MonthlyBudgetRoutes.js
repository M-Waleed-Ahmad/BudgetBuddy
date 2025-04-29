const express = require('express');

const router = express.Router();
const {
    getAllMonthlyBudgets,
    createMonthlyBudget,
    updateMonthlyBudget,
    deleteMonthlyBudget,
    getCurrentMonthBudget,
} = require('../controllers/MonthlyBudgetController');
const verifyToken = require('../middleware/authMiddleware');

// Route to get all monthly budgets
router.get('/', verifyToken, getAllMonthlyBudgets);

// Route to create a new monthly budget
router.post('/', verifyToken, createMonthlyBudget);

// Route to update a specific monthly budget
router.put('/:id', verifyToken, updateMonthlyBudget);

// Route to delete a specific monthly budget
router.delete('/:id', verifyToken, deleteMonthlyBudget);

// Route to get the current month's budget
router.get('/current', verifyToken, getCurrentMonthBudget);

module.exports = router;