const Newsletter = require('../models/Newsletter');
const ContactUs = require('../models/ContactUs');

// @desc    Submit a new contact message
// @route   POST /api/contact-us
const submitContactMessage = async (req, res) => {
  try {
    const { email, name, message } = req.body;

    if (!email || !name || !message) {
      res.status(400);
      throw new Error('All fields are required');
    }
    console.log('Received contact message:', { email, name, message });

    const contactMessage = await ContactUs.create({ email, name, message });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: contactMessage,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Subscribe to newsletter
// @route   POST /api/newsletter
const subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400);
      throw new Error('Email is required');
    }

    // Check if already subscribed
    const existingSubscription = await Newsletter.findOne({ email });
    if (existingSubscription) {
      res.status(400);
      throw new Error('Email is already subscribed');
    }

    const subscription = await Newsletter.create({ email });

    res.status(201).json({
      success: true,
      message: 'Subscribed successfully',
      data: subscription,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  submitContactMessage,
  subscribeNewsletter,
};