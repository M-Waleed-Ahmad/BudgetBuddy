// routes/inviteRoutes.js
const express = require('express');
const router = express.Router();
const {
    getPendingInvites,
    acceptInvite,
    rejectInvite
} = require('../controllers/InvitesController');
const verifyToken = require('../middleware/authMiddleware'); // Your auth middleware

// Apply verifyToken middleware to all invite routes as they require logged-in user context
router.use(verifyToken);

// --- Invitee Routes ---
router.get('/pending', getPendingInvites);          // Get invites FOR me
router.post('/:inviteId/accept', acceptInvite);     // Accept an invite sent TO me
router.post('/:inviteId/reject', rejectInvite);     // Reject an invite sent TO me

// --- Inviter Routes (Example - Add later if needed) ---
// router.post('/', createInvite);                 // Create/send a new invite
// router.get('/sent', getSentInvites);            // Get invites I have sent
// router.delete('/sent/:inviteId', cancelInvite); // Cancel an invite I sent

module.exports = router;