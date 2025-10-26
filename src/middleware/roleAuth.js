// Role-based authorization middleware
const logger = require('../utils/logger');

/**
 * Middleware to check if user has required role
 * Must be used after authentication middleware
 * @param {string|Array} allowedRoles - Single role or array of allowed roles
 * @returns {Function} Express middleware function
 */
const requireRole = (allowedRoles) => {
  // Normalize to array
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required to access this resource'
        }
      });
    }

    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      logger.warn(`Access denied for user ${req.user.email} with role ${req.user.role}. Required roles: ${roles.join(', ')}`);
      
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to access this resource'
        }
      });
    }

    next();
  };
};

/**
 * Middleware to require admin role
 */
const requireAdmin = requireRole('admin');

/**
 * Middleware to require user role (regular user)
 */
const requireUser = requireRole('user');

/**
 * Middleware to allow both admin and user roles
 */
const requireUserOrAdmin = requireRole(['user', 'admin']);

/**
 * Middleware to check if user can access their own resource or is admin
 * @param {string} userIdParam - Name of the parameter containing user ID (default: 'userId')
 * @returns {Function} Express middleware function
 */
const requireOwnershipOrAdmin = (userIdParam = 'userId') => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required to access this resource'
        }
      });
    }

    const targetUserId = parseInt(req.params[userIdParam]);
    const currentUserId = req.user.user_id;
    const userRole = req.user.role;

    // Allow if user is admin or accessing their own resource
    if (userRole === 'admin' || currentUserId === targetUserId) {
      return next();
    }

    logger.warn(`Access denied for user ${req.user.email} trying to access resource for user ID ${targetUserId}`);

    return res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'You can only access your own resources'
      }
    });
  };
};

/**
 * Middleware to check if user can modify their own resource or is admin
 * Similar to requireOwnershipOrAdmin but with different error message
 */
const requireOwnershipOrAdminForModification = (userIdParam = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required to modify this resource'
        }
      });
    }

    const targetUserId = parseInt(req.params[userIdParam]);
    const currentUserId = req.user.user_id;
    const userRole = req.user.role;

    if (userRole === 'admin' || currentUserId === targetUserId) {
      return next();
    }

    logger.warn(`Modification denied for user ${req.user.email} trying to modify resource for user ID ${targetUserId}`);

    return res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'You can only modify your own resources'
      }
    });
  };
};

/**
 * Middleware to check if user is accessing their own profile
 */
const requireOwnProfile = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required to access profile'
      }
    });
  }

  // For profile endpoints, we typically don't have a userId param
  // The user can only access their own profile
  next();
};

/**
 * Utility function to check if user has specific role
 * @param {Object} user - User object with role property
 * @param {string|Array} requiredRoles - Required role(s)
 * @returns {boolean} True if user has required role
 */
const hasRole = (user, requiredRoles) => {
  if (!user || !user.role) {
    return false;
  }

  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return roles.includes(user.role);
};

/**
 * Utility function to check if user is admin
 * @param {Object} user - User object
 * @returns {boolean} True if user is admin
 */
const isAdmin = (user) => {
  return hasRole(user, 'admin');
};

/**
 * Utility function to check if user owns resource or is admin
 * @param {Object} user - User object
 * @param {number} resourceUserId - User ID of resource owner
 * @returns {boolean} True if user owns resource or is admin
 */
const canAccessResource = (user, resourceUserId) => {
  if (!user) {
    return false;
  }
  return isAdmin(user) || user.user_id === resourceUserId;
};

module.exports = {
  requireRole,
  requireAdmin,
  requireUser,
  requireUserOrAdmin,
  requireOwnershipOrAdmin,
  requireOwnershipOrAdminForModification,
  requireOwnProfile,
  hasRole,
  isAdmin,
  canAccessResource
};