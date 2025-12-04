const express = require('express');
const router = express.Router();
const { signup, login , logoutUser , forgetPassword, refresh } = require('../controllers/authcontroller');
const verifyToken = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.post('/refresh', refresh);

router.post('/logout', verifyToken, logoutUser); 
router.get('/protected', verifyToken, (req, res) => {
  res.json({ message: 'Access granted!', user: req.user });
});

router.post('/forgetPassword', forgetPassword); // Add this line to handle password reset requests


module.exports = router;
