const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const isTest = nodeEnv === 'test';

const required = ['MONGO_URI', 'JWT_SECRET'];
const missing = isTest ? [] : required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}. See backend/.env.example.`);
  process.exit(1);
}

if (!isTest && process.env.JWT_SECRET.length < 32) {
  console.warn('JWT_SECRET is shorter than 32 characters. Use a long random value in production.');
}

const clientUrls = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((url) => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

module.exports = {
  nodeEnv,
  isTest,
  isProduction: nodeEnv === 'production',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET || 'test-secret-that-is-long-enough-for-tests',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrls,
  // First CLIENT_URL entry is used to build links in emails (password reset).
  clientUrl: clientUrls[0],
  trustProxy: process.env.TRUST_PROXY === 'true',
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM || 'BudgetBuddy <no-reply@budgetbuddy.app>',
  },
};
