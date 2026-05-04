`const { Resend } = require('resend');
const logger = require('../utils/logger');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'EgyTravel <onboarding@resend.dev>';

// ─── HTML Templates ───────────────────────────────────────────────────────────

const BASE_URL = process.env.APP_URL || 'https://egy-travel-89eca3b6683d.herokuapp.com';
const LOGO_URL = `${BASE_URL}/logo.png`;

function baseTemplate(content) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EgyTravel</title>
</head>
<body style="margin:0;padding:0;background-color:#0d1b2a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d1b2a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header with Logo -->
          <tr>
            <td align="center" style="padding:30px 0 20px;">
              <img src="${LOGO_URL}" alt="EgyTravel" width="160" style="display:block;border:0;max-width:160px;" />
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background-color:#1a2d42;border-radius:16px;padding:40px;border:1px solid #2a3f5a;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 0 0;color:#5a7a9a;font-size:13px;">
              <p style="margin:0;">© 2026 EgyTravel. Discover Amazing Egypt.</p>
              <p style="margin:8px 0 0;">If you didn't request this email, you can safely ignore it.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function otpTemplate(name, otp) {
  return baseTemplate(`
    <h2 style="color:#f5a623;margin:0 0 8px;font-size:24px;">Verify Your Email</h2>
    <p style="color:#8aa8c8;margin:0 0 28px;font-size:15px;">Welcome to EgyTravel, ${name}!</p>
    
    <p style="color:#c8d8e8;font-size:15px;line-height:1.6;margin:0 0 28px;">
      Use the verification code below to confirm your email address. 
      This code expires in <strong style="color:#f5a623;">10 minutes</strong>.
    </p>
    
    <div style="text-align:center;margin:32px 0;">
      <div style="background:linear-gradient(135deg,#1e3a5a,#0d2a42);border:2px solid #f5a623;border-radius:12px;padding:24px;display:inline-block;">
        <span style="font-size:42px;font-weight:bold;letter-spacing:12px;color:#f5a623;font-family:monospace;">${otp}</span>
      </div>
    </div>
    
    <p style="color:#5a7a9a;font-size:13px;text-align:center;margin:0;">
      Do not share this code with anyone.
    </p>
  `);
}

function welcomeTemplate(name) {
  return baseTemplate(`
    <h2 style="color:#f5a623;margin:0 0 8px;font-size:24px;">Welcome to EgyTravel! 🎉</h2>
    <p style="color:#8aa8c8;margin:0 0 28px;font-size:15px;">Your account is ready, ${name}!</p>
    
    <p style="color:#c8d8e8;font-size:15px;line-height:1.6;margin:0 0 24px;">
      You're now part of the EgyTravel community. Start exploring the wonders of Egypt — 
      from the ancient Pyramids of Giza to the stunning Red Sea coast.
    </p>
    
    <div style="background:#0d2a42;border-radius:10px;padding:20px;margin:24px 0;">
      <p style="color:#f5a623;font-weight:bold;margin:0 0 12px;font-size:14px;">✨ What you can do:</p>
      <p style="color:#8aa8c8;margin:4px 0;font-size:14px;">🏺 Explore Egyptian destinations</p>
      <p style="color:#8aa8c8;margin:4px 0;font-size:14px;">✈️ Search flights & hotels</p>
      <p style="color:#8aa8c8;margin:4px 0;font-size:14px;">🤖 Get AI-powered trip plans</p>
      <p style="color:#8aa8c8;margin:4px 0;font-size:14px;">📸 Share your travel experiences</p>
    </div>
    
    <p style="color:#c8d8e8;font-size:15px;line-height:1.6;margin:24px 0 0;">
      Happy travels! 🌍
    </p>
  `);
}

function passwordResetTemplate(name, resetCode) {
  return baseTemplate(`
    <h2 style="color:#f5a623;margin:0 0 8px;font-size:24px;">Reset Your Password</h2>
    <p style="color:#8aa8c8;margin:0 0 28px;font-size:15px;">Hi ${name},</p>
    
    <p style="color:#c8d8e8;font-size:15px;line-height:1.6;margin:0 0 28px;">
      We received a request to reset your password. Use the code below to create a new password.
      This code expires in <strong style="color:#f5a623;">1 hour</strong>.
    </p>
    
    <div style="text-align:center;margin:32px 0;">
      <div style="background:linear-gradient(135deg,#1e3a5a,#0d2a42);border:2px solid #f5a623;border-radius:12px;padding:24px;display:inline-block;">
        <span style="font-size:42px;font-weight:bold;letter-spacing:12px;color:#f5a623;font-family:monospace;">${resetCode}</span>
      </div>
    </div>
    
    <div style="background:#2a1a1a;border:1px solid #8b3a3a;border-radius:8px;padding:14px;margin:24px 0;">
      <p style="color:#e88;margin:0;font-size:13px;">
        ⚠️ If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
      </p>
    </div>
  `);
}

// ─── Send Functions ───────────────────────────────────────────────────────────

async function sendOTPEmail(to, name, otp) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `${otp} — Your EgyTravel verification code`,
      html: otpTemplate(name, otp)
    });

    if (error) throw new Error(error.message);
    logger.info('OTP email sent', { to, messageId: data?.id });
    return { success: true, messageId: data?.id };
  } catch (error) {
    logger.error('Failed to send OTP email', { to, error: error.message });
    throw error;
  }
}

async function sendWelcomeEmail(to, name) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `Welcome to EgyTravel, ${name}! 🏺`,
      html: welcomeTemplate(name)
    });

    if (error) throw new Error(error.message);
    logger.info('Welcome email sent', { to, messageId: data?.id });
    return { success: true, messageId: data?.id };
  } catch (error) {
    logger.error('Failed to send welcome email', { to, error: error.message });
    // Don't throw — welcome email failure shouldn't block registration
    return { success: false, error: error.message };
  }
}

async function sendPasswordResetEmail(to, name, resetCode) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `Reset your EgyTravel password`,
      html: passwordResetTemplate(name, resetCode)
    });

    if (error) throw new Error(error.message);
    logger.info('Password reset email sent', { to, messageId: data?.id });
    return { success: true, messageId: data?.id };
  } catch (error) {
    logger.error('Failed to send password reset email', { to, error: error.message });
    throw error;
  }
}

module.exports = { sendOTPEmail, sendWelcomeEmail, sendPasswordResetEmail };
