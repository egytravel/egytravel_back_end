const express = require('express');
const router = express.Router();
const AuthService = require('../services/authService');
const authController = require('../controllers/authController');
const {
  validateRegistration, validateLogin, validateForgotPassword,
  validateResetPassword, validateRefreshToken, authRateLimit, passwordResetRateLimit
} = require('../middleware/validation');
const { requireAuth } = require('../middleware/auth');
const logger = require('../utils/logger');

// POST /api/auth/register — register + send OTP email
router.post('/register', authRateLimit, validateRegistration, authController.register);

// POST /api/auth/verify-email — verify OTP code
router.post('/verify-email', authController.verifyEmail);

// POST /api/auth/resend-otp — resend verification OTP
router.post('/resend-otp', authController.resendOTP);

// POST /api/auth/forgot-password — send reset code via email
router.post('/forgot-password', passwordResetRateLimit, authController.forgotPassword);

// POST /api/auth/reset-password — verify reset code + set new password
router.post('/reset-password', authController.resetPassword);

// POST /api/auth/login
router.post('/login', authRateLimit, validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    res.json({
      code: 200,
      message: 'LOGIN SUCCESSFUL',
      data: {
        token: result.tokens.accessToken,
        user_id: result.user.user_id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    if (error.message.includes('Invalid email or password')) {
      return res.status(401).json({ code: 401, message: 'INVALID CREDENTIALS', data: null });
    }
    if (error.code === 'EMAIL_NOT_VERIFIED') {
      return res.status(403).json({
        code: 403,
        message: 'EMAIL NOT VERIFIED',
        data: { email: req.body.email, message: error.message }
      });
    }
    res.status(500).json({ code: 500, message: 'LOGIN FAILED', data: null });
  }
});

// POST /api/auth/logout
router.post('/logout', requireAuth, (req, res) => {
  logger.info(`User logged out: ${req.user.email}`);
  res.json({ success: true, message: 'Logged out successfully' });
});

// POST /api/auth/refresh
router.post('/refresh', validateRefreshToken, async (req, res) => {
  try {
    const result = await AuthService.refreshToken(req.body.refreshToken);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(401).json({ success: false, error: { code: 'INVALID_REFRESH_TOKEN', message: 'Invalid or expired refresh token' } });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await AuthService.getUserProfile(req.user.user_id);
    res.json({ success: true, data: { user } });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'GET_USER_FAILED', message: 'Failed to get user profile' } });
  }
});

module.exports = router;
