const express = require('express');
const verifyToken = require('../middleware/authMiddleware');
const { getCashflow } = require('../controllers/reports/cashflowController');

const router = express.Router();

router.get('/cashflow', verifyToken, getCashflow);

module.exports = router;
