const express = require('express');
const verifyToken = require('../middleware/authMiddleware');
 
const {
    getAllBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
} = require('../controllers/BudgetController');

const router = express.Router();

// Get all budgets
router.get('/', verifyToken, getAllBudgets);

// Create a new budget
router.post('/', verifyToken, createBudget);

// Update an existing budget
router.put('/:id', verifyToken, updateBudget);

// Delete a budget
router.delete('/:id', verifyToken, deleteBudget);

module.exports = router;