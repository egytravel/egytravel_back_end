// Authentication routes
const express = require('express');
const router = express.Router();
const AuthService = require('../services/authService');
const { 
  validateRegistration, 
  validateLogin, 
  validateForgotPassword, 
  validateResetPassword, 
  validateRefreshToken,
  authRateLimit,
  passwordResetRateLimit
} = require('../middleware/validation');
const { requireAuth } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authRateLimit, validateRegistration, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const result = await AuthService.register({
      name,
      email,
      password,
      role
    });

    // Return response in your desired format
    res.status(201).json({
      code: 201,
      message: 'REGISTRATION SUCCESSFUL',
      data: {
        token: result.tokens.accessToken,
        user_id: result.user.user_id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role
      }
    });
  } catch (error) {
    logger.error('Registration endpoint error:', error);

    if (error.message.includes('already exists')) {
      return res.status(409).json({
        code: 409,
        message: 'USER ALREADY EXISTS',
        data: null
      });
    }

    res.status(500).json({
      code: 500,
      message: 'REGISTRATION FAILED',
      data: null
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return tokens
 * @access  Public
 */
router.post('/login', authRateLimit, validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await AuthService.login(email, password);

    // Return response in your desired format
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
    logger.error('Login endpoint error:', error);

    if (error.message.includes('Invalid email or password')) {
      return res.status(401).json({
        code: 401,
        message: 'INVALID CREDENTIALS',
        data: null
      });
    }

    res.status(500).json({
      code: 500,
      message: 'LOGIN FAILED',
      data: null
    });
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh', validateRefreshToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    const result = await AuthService.refreshToken(refreshToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: result
    });
  } catch (error) {
    logger.error('Token refresh endpoint error:', error);

    if (error.message.includes('expired') || error.message.includes('invalid')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid or expired refresh token'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'TOKEN_REFRESH_FAILED',
        message: 'Token refresh failed. Please try again.'
      }
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
router.post('/logout', requireAuth, async (req, res) => {
  try {
    // In a stateless JWT system, logout is typically handled client-side
    // by removing the tokens from storage. We just log the event.
    logger.info(`User logged out: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout endpoint error:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'LOGOUT_FAILED',
        message: 'Logout failed. Please try again.'
      }
    });
  }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', passwordResetRateLimit, validateForgotPassword, async (req, res) => {
  try {
    const { email } = req.body;

    const result = await AuthService.forgotPassword(email);

    res.json({
      success: true,
      message: result.message,
      // In production, don't return the token - send it via email instead
      ...(process.env.NODE_ENV === 'development' && { 
        data: { 
          token: result.token, 
          expires_at: result.expires_at 
        } 
      })
    });
  } catch (error) {
    logger.error('Forgot password endpoint error:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'FORGOT_PASSWORD_FAILED',
        message: 'Password reset request failed. Please try again.'
      }
    });
  }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using reset token
 * @access  Public
 */
router.post('/reset-password', passwordResetRateLimit, validateResetPassword, async (req, res) => {
  try {
    const { token, password } = req.body;

    const result = await AuthService.resetPassword(token, password);

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    logger.error('Reset password endpoint error:', error);

    if (error.message.includes('Invalid or expired')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_RESET_TOKEN',
          message: 'Invalid or expired reset token'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'PASSWORD_RESET_FAILED',
        message: 'Password reset failed. Please try again.'
      }
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await AuthService.getUserProfile(req.user.user_id);

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    logger.error('Get current user endpoint error:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'GET_USER_FAILED',
        message: 'Failed to get user profile'
      }
    });
  }
});

module.exports = router;