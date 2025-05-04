const mongoose = require('mongoose');
const newsletterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true, // if you want to prevent duplicate subscriptions
    },
  },
  { timestamps: true }
);

const Newsletter = mongoose.model('Newsletter', newsletterSchema);

module.exports = Newsletter;
