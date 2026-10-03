process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-that-is-definitely-long-enough-for-jwt';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CLIENT_URL = 'http://localhost:5173';
// Keep SMTP unset so password reset links are returned as devResetUrl.
delete process.env.SMTP_HOST;
