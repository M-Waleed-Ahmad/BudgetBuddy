const express = require('express');
const publicController = require('../controllers/publicController');
const { formLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'ok' }));
router.post('/contact-us', formLimiter, publicController.submitContactMessage);
router.post('/newsletter', formLimiter, publicController.subscribeNewsletter);

module.exports = router;
