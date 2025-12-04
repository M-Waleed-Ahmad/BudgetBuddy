const express = require('express');
const verifyToken = require('../middleware/authMiddleware');
const { createCheckoutSession, handleWebhook } = require('../controllers/billingController');

const router = express.Router();

router.post('/create-checkout-session', verifyToken, createCheckoutSession);
// Stripe sends webhook without JWT; signature handled inside controller
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

module.exports = router;
