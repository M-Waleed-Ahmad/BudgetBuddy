const express = require('express');
const auth = require('../controllers/authController');
const requireAuth = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/signup', authLimiter, auth.signup);
router.post('/login', authLimiter, auth.login);
router.post('/logout', requireAuth, auth.logout);
router.post('/forgot-password', authLimiter, auth.forgotPassword);
router.post('/reset-password', authLimiter, auth.resetPassword);

module.exports = router;
