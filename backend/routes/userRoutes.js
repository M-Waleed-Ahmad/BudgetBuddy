const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middleware/authMiddleware');  // our JWT middleware

// Update profile
router.put('/profile', authenticateToken, userController.updateProfile);

module.exports = router;
