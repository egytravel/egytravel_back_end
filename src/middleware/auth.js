// JWT authentication middleware
const JWTService = require('../services/jwtService');
const { User } = require('../models/sql');
const logger = require('../utils/logger');

/**
 * Middleware to authenticate JWT tokens
 * Adds user data to req.user if token is valid
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = JWTService.extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Access token is required'
        }
      });
    }

    // Verify token
    const decoded = JWTService.verifyAccessToken(token);

    // Get user from database to ensure they still exist and are active
    const user = await User.findByPk(decoded.user_id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User associated with token not found'
        }
      });
    }

    // Add user data to request object
    req.user = {
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);

    let errorCode = 'AUTHENTICATION_FAILED';
    let errorMessage = 'Authentication failed';

    if (error.message.includes('expired')) {
      errorCode = 'TOKEN_EXPIRED';
      errorMessage = 'Access token has expired';
    } else if (error.message.includes('invalid')) {
      errorCode = 'INVALID_TOKEN';
      errorMessage = 'Invalid access token';
    }

    return res.status(401).json({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage
      }
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user data to req.user if token is valid, but doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = JWTService.extractTokenFromHeader(authHeader);

    if (!token) {
      return next(); // No token provided, continue without authentication
    }

    // Verify token
    const decoded = JWTService.verifyAccessToken(token);

    // Get user from database
    const user = await User.findByPk(decoded.user_id);
    if (user) {
      req.user = {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role
      };
    }

    next();
  } catch (error) {
    // Log error but don't fail the request
    logger.warn('Optional authentication failed:', error);
    next();
  }
};

/**
 * Middleware to check if user is authenticated and active
 */
const requireAuth = [authenticateToken];

/**
 * Middleware to extract user info from token without database lookup
 * Faster but less secure - use only for non-critical operations
 */
const extractUserFromToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = JWTService.extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Access token is required'
        }
      });
    }

    // Verify and decode token
    const decoded = JWTService.verifyAccessToken(token);

    // Add user data from token to request object
    req.user = {
      user_id: decoded.user_id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role
    };

    next();
  } catch (error) {
    logger.error('Token extraction error:', error);

    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired access token'
      }
    });
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAuth,
  extractUserFromToken
};