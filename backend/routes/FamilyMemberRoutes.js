// routes/familyPlanRoutes.js
const express = require('express');
const familyPlanController = require('../controllers/familyPlanController');
const familyMemberController = require('../controllers/FamilyMemberController'); // Assuming controller is separate
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

// --- Plan Routes (Already defined) ---
router.get('/', verifyToken, familyPlanController.getUserPlans);
router.post('/', verifyToken, familyPlanController.createPlan);
router.get('/:planId/details', verifyToken, familyPlanController.getPlanDetails); // Added GET for details
router.put('/:planId', verifyToken, familyPlanController.updatePlan);
router.delete('/:planId', verifyToken, familyPlanController.deletePlan);

// --- Member Routes ---
router.get('/:planId/members', verifyToken, familyMemberController.getPlanMembers);

router.put('/:planId/members/:memberUserId', verifyToken, familyMemberController.updateMemberRole);

router.delete('/:planId/members/:memberUserId', verifyToken, familyMemberController.removeMember);

// --- Invite Route ---
router.post('/:planId/invites', verifyToken, familyMemberController.inviteMember);



module.exports = router;