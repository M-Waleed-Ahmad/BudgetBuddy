const mongoose = require('mongoose');
const { badRequest } = require('./httpError');

const CURRENCIES = ['USD', 'EUR', 'GBP', 'PKR', 'INR', 'AED', 'SAR', 'CAD', 'AUD', 'JPY'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const MIN_PASSWORD_LENGTH = 8;

const isObjectId = (value) => typeof value === 'string' && mongoose.Types.ObjectId.isValid(value) && /^[a-f\d]{24}$/i.test(value);

/** Validates an id and returns it in canonical (lower-case) form so string comparisons are safe. */
function assertObjectId(value, label = 'id') {
  if (!isObjectId(value)) throw badRequest(`Invalid ${label}.`);
  return value.toLowerCase();
}

/** Trimmed non-empty string with a maximum length. Returns undefined for optional empty input. */
function string(value, field, { required = false, max = 200 } = {}) {
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    if (required) throw badRequest(`${field} is required.`, { [field]: 'Required' });
    return undefined;
  }
  if (typeof value !== 'string') throw badRequest(`${field} must be text.`, { [field]: 'Must be text' });
  const trimmed = value.trim();
  if (trimmed.length > max) throw badRequest(`${field} must be at most ${max} characters.`, { [field]: 'Too long' });
  return trimmed;
}

function email(value, field = 'email', { required = true } = {}) {
  const str = string(value, field, { required, max: 254 });
  if (str === undefined) return undefined;
  const normalized = str.toLowerCase();
  if (!EMAIL_RE.test(normalized)) throw badRequest('Please provide a valid email address.', { [field]: 'Invalid email' });
  return normalized;
}

function password(value, field = 'password') {
  if (typeof value !== 'string' || value.length < MIN_PASSWORD_LENGTH) {
    throw badRequest(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`, { [field]: 'Too short' });
  }
  if (value.length > 128) throw badRequest('Password must be at most 128 characters long.', { [field]: 'Too long' });
  return value;
}

/** A finite number >= min (accepts numeric strings). */
function amount(value, field = 'amount', { required = true, min = 0.01 } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw badRequest(`${field} is required.`, { [field]: 'Required' });
    return undefined;
  }
  if (typeof value === 'string' && !/^\d+(\.\d+)?$/.test(value.trim())) {
    throw badRequest(`${field} must be a number.`, { [field]: 'Invalid amount' });
  }
  const num = typeof value === 'string' ? Number(value) : value;
  if (typeof num !== 'number' || !Number.isFinite(num) || num < min) {
    const rule = min > 0 ? 'a positive number' : `a number of at least ${min}`;
    throw badRequest(`${field} must be ${rule}.`, { [field]: 'Invalid amount' });
  }
  if (num > 1e12) throw badRequest(`${field} is too large.`, { [field]: 'Too large' });
  return Math.round(num * 100) / 100;
}

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})(T[\d:.]+(Z|[+-]\d{2}:?\d{2})?)?$/;

/**
 * Parses a calendar date given as `YYYY-MM-DD` (or a full ISO timestamp, whose date part is
 * used). Returns UTC midnight of that day so stored dates are always comparable. Impossible
 * dates such as 2026-02-31 are rejected.
 */
function date(value, field = 'date', { required = true } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw badRequest(`${field} is required.`, { [field]: 'Required' });
    return undefined;
  }
  const invalid = () => badRequest(`${field} must be a valid date (YYYY-MM-DD).`, { [field]: 'Invalid date' });
  const match = typeof value === 'string' ? ISO_DATE_RE.exec(value.trim()) : null;
  if (!match) throw invalid();

  const [year, month, day] = match.slice(1, 4).map(Number);
  const result = new Date(Date.UTC(year, month - 1, day));
  if (result.getUTCFullYear() !== year || result.getUTCMonth() !== month - 1 || result.getUTCDate() !== day) {
    throw invalid();
  }
  return result;
}

function monthYear(value, field = 'month_year') {
  if (typeof value !== 'string' || !MONTH_RE.test(value)) {
    throw badRequest(`${field} must be in YYYY-MM format.`, { [field]: 'Invalid month' });
  }
  return value;
}

function currency(value, field = 'currency') {
  if (value === undefined || value === null || value === '') return undefined;
  const code = String(value).toUpperCase();
  if (!CURRENCIES.includes(code)) {
    throw badRequest(`${field} must be one of ${CURRENCIES.join(', ')}.`, { [field]: 'Unsupported currency' });
  }
  return code;
}

function boolean(value, field) {
  if (value === undefined) return undefined;
  if (typeof value !== 'boolean') throw badRequest(`${field} must be true or false.`, { [field]: 'Invalid value' });
  return value;
}

/** Escapes a string for use inside a RegExp. */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = {
  CURRENCIES,
  MIN_PASSWORD_LENGTH,
  isObjectId,
  assertObjectId,
  string,
  email,
  password,
  amount,
  date,
  monthYear,
  currency,
  boolean,
  escapeRegex,
};
