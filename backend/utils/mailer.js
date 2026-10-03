const nodemailer = require('nodemailer');
const config = require('../config/env');

const isMailConfigured = Boolean(config.smtp.host);

let transporter = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
    });
  }
  return transporter;
}

/** Sends an email. Resolves to false (and logs) when SMTP is not configured or sending fails. */
async function sendMail({ to, subject, text, html }) {
  if (!isMailConfigured) return false;
  try {
    await getTransporter().sendMail({ from: config.smtp.from, to, subject, text, html });
    return true;
  } catch (error) {
    console.error('Failed to send email:', error.message);
    return false;
  }
}

module.exports = { isMailConfigured, sendMail };
