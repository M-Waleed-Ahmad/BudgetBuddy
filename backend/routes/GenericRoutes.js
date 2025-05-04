const express = require('express');
const {submitContactMessage, subscribeNewsletter} =require( '../controllers/GenericController.js');

const router = express.Router();

// @desc    Submit a new contact message

// @route   POST /api/contact-us

router.post('/contact-us', submitContactMessage);
router.post('/newsletter', subscribeNewsletter);

module.exports = router;