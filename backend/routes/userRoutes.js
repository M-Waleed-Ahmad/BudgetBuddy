const express = require('express');
const users = require('../controllers/userController');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.route('/profile').get(users.getProfile).put(users.updateProfile);

module.exports = router;
