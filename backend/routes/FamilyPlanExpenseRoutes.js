const express = require('express');

const router = express.Router();
const { 
    getExpenseById, 
    createExpense, 
    updateExpense, 
    deleteExpense ,
    getExpensesByPlanAndUser,
    getExpensesByPlan
} = require('../controllers/FamilyExpenseController');
const verifyToken = require('../middleware/authMiddleware'); // Import the middleware

// Route to get all expenses for a specific plan
router.get('/plan/:plan_id', verifyToken, getExpensesByPlan);

// Route to get a single expense by ID
router.get('/:id', verifyToken, getExpenseById);

// Route to get all expenses for a specific plan and user
router.get('/plan/:plan_id/user/:user_id', verifyToken, getExpensesByPlanAndUser);

// Route to create a new expense
router.post('/', verifyToken, createExpense);

// Route to update an expense by ID
router.put('/:id', verifyToken, updateExpense);

// Route to delete an expense by ID
router.delete('/:id', verifyToken, deleteExpense);


module.exports = router;