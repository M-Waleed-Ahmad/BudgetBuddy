const rateLimit = require('express-rate-limit');
const config = require('../config/env');

const limiter = (windowMinutes, limit, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => config.isTest,
    message: { message },
  });

/** Login / signup / password reset: 20 attempts per 15 minutes per IP. */
const authLimiter = limiter(15, 20, 'Too many attempts. Please wait a few minutes and try again.');

/** Contact form and newsletter: 10 submissions per hour per IP. */
const formLimiter = limiter(60, 10, 'Too many submissions. Please try again later.');

module.exports = { authLimiter, formLimiter };
