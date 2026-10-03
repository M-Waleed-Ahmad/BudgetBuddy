const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const { unauthorized } = require('../utils/httpError');
const { isObjectId } = require('../utils/validation');

/**
 * Requires a valid `Authorization: Bearer <token>` header. Rejects tokens for users that no
 * longer exist or whose token version is outdated (the password changed since it was issued).
 * Sets `req.user = { userId }`.
 */
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw unauthorized('Authentication required.');

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw unauthorized('Your session is invalid or has expired. Please log in again.');
  }

  if (!isObjectId(payload.userId)) throw unauthorized('Your session is invalid. Please log in again.');

  const user = await User.findById(payload.userId).select('token_version').lean();
  if (!user) throw unauthorized('Your account no longer exists.');
  if ((payload.tv ?? 0) !== (user.token_version ?? 0)) {
    throw unauthorized('Your password was changed. Please log in again.');
  }

  req.user = { userId: String(user._id) };
  next();
}

module.exports = requireAuth;
