const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;
if (config.smtp.user && config.smtp.pass) {
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
  });
}

const sendMail = async ({ to, subject, html }) => {
  if (!transporter) {
    console.log(`[email disabled] to=${to} subject="${subject}"`);
    return { skipped: true };
  }
  const info = await transporter.sendMail({
    from: config.smtp.from,
    to,
    subject,
    html,
  });
  return info;
};

const sendVerificationEmail = (user, token) =>
  sendMail({
    to: user.email,
    subject: 'Verify your EstateHub email',
    html: `<h2>Welcome to EstateHub, ${user.name}!</h2>
      <p>Click the link below to verify your email address:</p>
      <p><a href="${config.clientURL}/verify-email/${token}">Verify Email</a></p>
      <p>This link expires in 24 hours.</p>`,
  });

const sendResetPasswordEmail = (user, token) =>
  sendMail({
    to: user.email,
    subject: 'Reset your EstateHub password',
    html: `<h2>Hi ${user.name},</h2>
      <p>Click the link below to reset your password:</p>
      <p><a href="${config.clientURL}/reset-password/${token}">Reset Password</a></p>
      <p>This link expires in 30 minutes.</p>`,
  });

const sendOTPEmail = (user, otp) =>
  sendMail({
    to: user.email,
    subject: 'Your EstateHub OTP',
    html: `<h2>Hi ${user.name},</h2>
      <p>Your login OTP is:</p>
      <h1 style="letter-spacing:4px">${otp}</h1>
      <p>It expires in 10 minutes.</p>`,
  });

module.exports = { sendMail, sendVerificationEmail, sendResetPasswordEmail, sendOTPEmail };
