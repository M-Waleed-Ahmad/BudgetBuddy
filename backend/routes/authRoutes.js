const express = require('express');
const router = express.Router();
const { signup, login } = require('../controllers/authcontroller');
const verifyToken = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);

router.get('/protected', verifyToken, (req, res) => {
  res.json({ message: 'Access granted!', user: req.user });
});

module.exports = router;
