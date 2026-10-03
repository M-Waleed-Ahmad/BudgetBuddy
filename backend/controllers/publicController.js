const ContactUs = require('../models/ContactUs');
const Newsletter = require('../models/Newsletter');
const v = require('../utils/validation');
const { conflict } = require('../utils/httpError');

// POST /api/contact-us
async function submitContactMessage(req, res) {
  const name = v.string(req.body.name, 'name', { required: true, max: 100 });
  const email = v.email(req.body.email);
  const message = v.string(req.body.message, 'message', { required: true, max: 5000 });

  await ContactUs.create({ name, email, message });
  res.status(201).json({ message: "Thanks for reaching out! We'll get back to you soon." });
}

// POST /api/newsletter
async function subscribeNewsletter(req, res) {
  const email = v.email(req.body.email);
  if (await Newsletter.exists({ email })) throw conflict('This email is already subscribed.');

  await Newsletter.create({ email });
  res.status(201).json({ message: 'Subscribed! Watch your inbox for budgeting tips.' });
}

module.exports = { submitContactMessage, subscribeNewsletter };
