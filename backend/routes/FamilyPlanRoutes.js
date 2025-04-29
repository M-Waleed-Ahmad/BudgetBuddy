// routes/familyPlanRoutes.js
const express = require('express');
const familyPlanController = require('../controllers/familyPlanController');
const verifyToken = require('../middleware/authMiddleware'); // Your JWT auth middleware

const router = express.Router();

// --- Family Plan Routes ---

// GET /api/family-plans - Fetch all plans the current user is part of
router.get('/', verifyToken, familyPlanController.getUserPlans);

// POST /api/family-plans - Create a new family plan
router.post('/', verifyToken, familyPlanController.createPlan);

// PUT /api/family-plans/:planId - Update plan settings (name, budget, dates etc.)
router.put('/:planId', verifyToken, familyPlanController.updatePlan);

// DELETE /api/family-plans/:planId - Delete a plan and ALL associated data
router.delete('/:planId', verifyToken, familyPlanController.deletePlan);

// GET /api/family-plans/:planId - Fetch details of a specific plan
router.get('/:planId', verifyToken, familyPlanController.getPlanDetails);


// --- Routes for other plan-related resources (Members, Budgets, Expenses) will go here or in separate files ---
// Example: router.use('/:planId/members', memberRoutes);
// Example: router.use('/:planId/budgets', familyBudgetRoutes);
// Example: router.use('/:planId/expenses', familyExpenseRoutes);


module.exports = router;