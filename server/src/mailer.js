/**
 * mailer.js
 *
 * We use Nodemailer to send emails.
 * In development, many people use MailHog (fake SMTP server) so emails go to a local inbox.
 *
 * For now: we will TRY to send, but if SMTP isn't running we won't crash the whole app.
 */

const nodemailer = require("nodemailer");

function makeTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),

    // Only include auth if SMTP_USER is set
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
}

module.exports = { makeTransport };
