const express = require('express');
const verifyToken = require('../middleware/authMiddleware');
const { getRecommendations } = require('../controllers/insights/recommendationController');

const router = express.Router();

router.get('/recommendations', verifyToken, getRecommendations);

module.exports = router;
