const mongoose = require('mongoose');
const { HttpError } = require('../utils/httpError');

function notFoundHandler(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, ...(err.errors && { errors: err.errors }) });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.fromEntries(Object.entries(err.errors).map(([field, e]) => [field, e.message]));
    return res.status(400).json({ message: 'Validation failed.', errors });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ message: `Invalid ${err.path}.` });
  }

  if (err?.code === 11000) {
    return res.status(409).json({ message: 'A record with these details already exists.' });
  }

  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Request body must be valid JSON.' });
  }

  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body is too large.' });
  }

  // Other client errors raised by Express / body-parser (e.g. 415 unsupported charset).
  if (err?.expose && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ message: err.message });
  }

  console.error(err);
  return res.status(500).json({ message: 'Something went wrong on our side. Please try again.' });
}

module.exports = { notFoundHandler, errorHandler };
