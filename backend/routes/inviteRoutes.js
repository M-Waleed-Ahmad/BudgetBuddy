const express = require('express');
const invites = require('../controllers/inviteController');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.get('/pending', invites.listPendingInvites);
router.post('/:inviteId/accept', invites.acceptInvite);
router.post('/:inviteId/reject', invites.rejectInvite);

module.exports = router;
