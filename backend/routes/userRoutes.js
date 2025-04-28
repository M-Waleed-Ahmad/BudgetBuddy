// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile, updateCurrencyPreference
    , updateUI
 } = require('../controllers/userController');
const verifyToken = require('../middleware/authMiddleware'); // Your auth middleware

// --- Profile Routes ---
// Both routes require the user to be logged in
router.route('/profile')
    .get(verifyToken, getUserProfile)    // GET to fetch profile
    .put(verifyToken, updateUserProfile); // PUT to update profile

router.route('/profile/currency')
    .put(verifyToken, updateCurrencyPreference); // PUT to update currency preference

router.route('/profile/ui')
    .put(verifyToken, updateUI); // PUT to update UI preferences

// Add other user-related routes here later (e.g., change password specifically, etc.)

module.exports = router;