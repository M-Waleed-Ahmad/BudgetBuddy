const express = require('express');
const plans = require('../controllers/familyPlanController');
const members = require('../controllers/familyMemberController');
const expenses = require('../controllers/familyExpenseController');
const requireAuth = require('../middleware/auth');
const { requirePlanRole } = require('../middleware/planAccess');

const router = express.Router();
const ADMIN = ['admin'];
const CAN_EDIT = ['admin', 'editor'];

router.use(requireAuth);

// Plans
router.route('/').get(plans.listPlans).post(plans.createPlan);
router.get('/:planId', requirePlanRole(), plans.getPlan);
router.put('/:planId', requirePlanRole(ADMIN), plans.updatePlan);
router.delete('/:planId', requirePlanRole(), plans.deletePlan); // owner check in controller
router.get('/:planId/categories', requirePlanRole(), plans.listPlanCategories);

// Members & invites
router.get('/:planId/members', requirePlanRole(), members.listMembers);
router.put('/:planId/members/:userId', requirePlanRole(ADMIN), members.updateMemberRole);
router.delete('/:planId/members/:userId', requirePlanRole(), members.removeMember); // admin or self
router.get('/:planId/invites', requirePlanRole(ADMIN), members.listPlanInvites);
router.post('/:planId/invites', requirePlanRole(ADMIN), members.inviteMember);
router.delete('/:planId/invites/:inviteId', requirePlanRole(ADMIN), members.cancelPlanInvite);

// Expenses
router.get('/:planId/expenses', requirePlanRole(), expenses.listExpenses);
router.post('/:planId/expenses', requirePlanRole(CAN_EDIT), expenses.createExpense);
router.put('/:planId/expenses/:expenseId', requirePlanRole(CAN_EDIT), expenses.updateExpense);
router.delete('/:planId/expenses/:expenseId', requirePlanRole(CAN_EDIT), expenses.deleteExpense);
router.post('/:planId/expenses/:expenseId/approve', requirePlanRole(ADMIN), expenses.approveExpense);
router.post('/:planId/expenses/:expenseId/reject', requirePlanRole(ADMIN), expenses.rejectExpense);

module.exports = router;
