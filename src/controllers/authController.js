const AuthService = require('../services/authService');
const { sendOTPEmail, sendWelcomeEmail, sendPasswordResetEmail } = require('../services/emailService');
const EmailOTP = require('../models/nosql/EmailOTP');
const logger = require('../utils/logger');

// Generate a 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /api/auth/register
 * Step 1: Register user → send OTP email
 * User is created but marked as unverified until OTP confirmed
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Register the user
    const result = await AuthService.register({ name, email, password, role });

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTP for this email
    await EmailOTP.deleteMany({ email: email.toLowerCase(), type: 'registration' });

    // Save OTP to MongoDB
    await EmailOTP.create({
      email: email.toLowerCase(),
      otp,
      type: 'registration',
      expiresAt
    });

    // Send OTP email (don't await — let it run in background)
    sendOTPEmail(email, name, otp).catch(err =>
      logger.error('OTP email failed', { email, error: err.message })
    );

    // Return response WITHOUT a token — user must verify email before logging in
    res.status(201).json({
      code: 201,
      message: 'REGISTRATION SUCCESSFUL',
      data: {
        user_id: result.user.user_id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        emailVerified: false,
        message: 'A verification code has been sent to your email. Please verify before logging in.'
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    if (error.message.includes('already exists')) {
      return res.status(409).json({ code: 409, message: 'USER ALREADY EXISTS', data: null });
    }
    res.status(500).json({ code: 500, message: 'REGISTRATION FAILED', data: null });
  }
};

/**
 * POST /api/auth/verify-email
 * Step 2: Verify OTP → mark email as verified → send welcome email
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMS', message: 'Email and OTP are required' } });
    }

    const record = await EmailOTP.findOne({
      email: email.toLowerCase(),
      type: 'registration',
      verified: false
    });

    if (!record) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_OTP', message: 'OTP not found or already used' } });
    }

    if (new Date() > record.expiresAt) {
      await record.deleteOne();
      return res.status(400).json({ success: false, error: { code: 'OTP_EXPIRED', message: 'OTP has expired. Please request a new one.' } });
    }

    // Increment attempts
    record.attempts += 1;
    if (record.attempts > 5) {
      await record.deleteOne();
      return res.status(400).json({ success: false, error: { code: 'TOO_MANY_ATTEMPTS', message: 'Too many failed attempts. Please request a new OTP.' } });
    }

    if (record.otp !== otp) {
      await record.save();
      return res.status(400).json({ success: false, error: { code: 'INVALID_OTP', message: 'Incorrect verification code' } });
    }

    // Mark as verified
    record.verified = true;
    await record.save();

    // Mark user as verified in SQL DB + send welcome email
    const { User } = require('../models/sql');
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (user) {
      user.is_verified = true;
      await user.save();
      sendWelcomeEmail(email, user.name).catch(() => {});
    }

    // Generate tokens now that email is verified
    const JWTService = require('../services/jwtService');
    const tokens = user ? JWTService.generateTokenPair(user) : null;

    res.json({
      success: true,
      message: 'Email verified successfully! Welcome to EgyTravel.',
      data: tokens ? {
        token: tokens.accessToken,
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: true
      } : undefined
    });
  } catch (error) {
    logger.error('Verify email error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Verification failed' } });
  }
};

/**
 * POST /api/auth/resend-otp
 * Resend OTP for email verification
 */
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMS', message: 'Email is required' } });
    }

    const { User } = require('../models/sql');
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await EmailOTP.deleteMany({ email: email.toLowerCase(), type: 'registration' });
    await EmailOTP.create({ email: email.toLowerCase(), otp, type: 'registration', expiresAt });

    await sendOTPEmail(email, user.name, otp);

    res.json({ success: true, message: 'Verification code resent to your email' });
  } catch (error) {
    logger.error('Resend OTP error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to resend OTP' } });
  }
};

/**
 * POST /api/auth/forgot-password
 * Send 6-digit reset code via email
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMS', message: 'Email is required' } });
    }

    const { User } = require('../models/sql');
    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    // Always return success (don't reveal if email exists)
    if (!user) {
      return res.json({ success: true, message: 'If this email exists, a reset code has been sent' });
    }

    const resetCode = generateOTP(); // 6-digit code
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await EmailOTP.deleteMany({ email: email.toLowerCase(), type: 'password_reset' });
    await EmailOTP.create({ email: email.toLowerCase(), otp: resetCode, type: 'password_reset', expiresAt });

    await sendPasswordResetEmail(email, user.name, resetCode);

    res.json({ success: true, message: 'If this email exists, a reset code has been sent' });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to process request' } });
  }
};

/**
 * POST /api/auth/reset-password
 * Verify reset code and set new password
 */
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMS', message: 'Email, OTP, and new password are required' } });
    }

    const record = await EmailOTP.findOne({
      email: email.toLowerCase(),
      type: 'password_reset',
      verified: false
    });

    if (!record) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_CODE', message: 'Reset code not found or already used' } });
    }

    if (new Date() > record.expiresAt) {
      await record.deleteOne();
      return res.status(400).json({ success: false, error: { code: 'CODE_EXPIRED', message: 'Reset code has expired. Please request a new one.' } });
    }

    if (record.otp !== otp) {
      record.attempts += 1;
      await record.save();
      return res.status(400).json({ success: false, error: { code: 'INVALID_CODE', message: 'Incorrect reset code' } });
    }

    // Update password
    const { User } = require('../models/sql');
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }

    await user.setPassword(newPassword);
    await user.save();

    // Mark OTP as used
    record.verified = true;
    await record.save();

    logger.info('Password reset successful', { email });
    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to reset password' } });
  }
};
