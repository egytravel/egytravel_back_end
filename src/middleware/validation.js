// Input validation middleware
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: errors.array()
      }
    });
  }
  next();
};

// Registration validation rules
const validateRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Email must not exceed 100 characters'),
  
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin'),
  
  handleValidationErrors
];

// Login validation rules
const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Password reset request validation
const validateForgotPassword = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  handleValidationErrors
];

// Password reset validation
const validateResetPassword = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required')
    .isLength({ min: 32, max: 255 })
    .withMessage('Invalid reset token format'),
  
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  handleValidationErrors
];

// Change password validation
const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  handleValidationErrors
];

// Profile update validation
const validateProfileUpdate = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters').matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters and spaces'),
  body('phone').optional().trim().matches(/^[\d\s+\-().]+$/).withMessage('Phone can only contain digits, spaces, +, -, (, )').isLength({ max: 30 }).withMessage('Phone must not exceed 30 characters'),
  body('nationality').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Nationality must be between 2 and 100 characters'),
  body('date_of_birth').optional().isDate({ format: 'YYYY-MM-DD' }).withMessage('Date of birth must be a valid date in YYYY-MM-DD format'),
  body('profile_photo_url').optional().trim().isURL().withMessage('Profile photo must be a valid URL').isLength({ max: 500 }).withMessage('Profile photo URL must not exceed 500 characters'),
  handleValidationErrors
];

// Delete account validation
const validateDeleteAccount = [
  body('password').notEmpty().withMessage('Password confirmation is required'),
  handleValidationErrors
];

// Notification preferences validation
const validateNotificationUpdate = [
  body('push_enabled').optional().isBoolean().withMessage('push_enabled must be a boolean'),
  body('email_enabled').optional().isBoolean().withMessage('email_enabled must be a boolean'),
  handleValidationErrors
];

// Refresh token validation
const validateRefreshToken = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
  
  handleValidationErrors
];

// Rate limiting for authentication endpoints (relaxed for testing)
const authRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // 1000 attempts per window for testing
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests
  skipSuccessfulRequests: true,
  // Custom key generator to rate limit by IP + email combination for login
  keyGenerator: (req) => {
    if (req.body && req.body.email) {
      return `${req.ip}-${req.body.email}`;
    }
    return req.ip;
  }
});

// Relaxed rate limiting for password reset (for testing)
const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 attempts per hour for testing
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many password reset attempts. Please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  validateRegistration, validateLogin, validateForgotPassword, validateResetPassword,
  validateChangePassword, validateProfileUpdate, validateDeleteAccount, validateNotificationUpdate,
  validateRefreshToken, authRateLimit, passwordResetRateLimit, handleValidationErrors
};