const express = require('express');

const router = express.Router();
const { 
    getExpenseById, 
    createExpense, 
    updateExpense, 
    deleteExpense ,
    getExpensesByPlanAndUser,
    getExpensesByPlan,
    approveExpense,
    rejectExpense
} = require('../controllers/FamilyExpenseController');
const verifyToken = require('../middleware/authMiddleware'); // Import the middleware

// Route to get all expenses for a specific plan
router.get('/plan/:plan_id', verifyToken, getExpensesByPlan);

// Route to get a single expense by ID
router.get('/:id', verifyToken, getExpenseById);

// Route to get all expenses for a specific plan and user
router.get('/plan/:plan_id/user', verifyToken, getExpensesByPlanAndUser);

// Route to create a new expense
router.post('/', verifyToken, createExpense);

// Route to update an expense by ID
router.put('/:id', verifyToken, updateExpense);

// Route to delete an expense by ID
router.delete('/:id', verifyToken, deleteExpense);
// Route to approve an expense by ID
router.put('/approve/:id', verifyToken, approveExpense);

// Route to reject an expense by ID
router.put('/reject/:id', verifyToken, rejectExpense);

module.exports = router;