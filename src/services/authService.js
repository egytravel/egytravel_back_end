// Authentication Service
const { User, PasswordResetToken } = require('../models/sql');
const JWTService = require('./jwtService');
const crypto = require('crypto');
const logger = require('../utils/logger');

class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Object} Created user and tokens
   */
  static async register(userData) {
    try {
      // Check if user already exists
      const existingUser = await User.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create new user (password will be hashed automatically)
      const user = await User.createUser({
        name: userData.name,
        email: userData.email.toLowerCase(),
        password: userData.password,
        role: userData.role || 'user'
      });

      // Generate tokens
      const tokens = JWTService.generateTokenPair(user);

      logger.info(`New user registered: ${user.email}`);

      return {
        user: user.toJSON(),
        tokens
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Authenticate user login
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Object} User data and tokens
   */
  static async login(email, password) {
    try {
      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Validate password
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        throw new Error('Invalid email or password');
      }

      // Generate tokens
      const tokens = JWTService.generateTokenPair(user);

      logger.info(`User logged in: ${user.email}`);

      return {
        user: user.toJSON(),
        tokens
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Valid refresh token
   * @returns {Object} New access token
   */
  static async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = JWTService.verifyRefreshToken(refreshToken);

      // Find user
      const user = await User.findByPk(decoded.user_id);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate new access token
      const accessToken = JWTService.generateAccessToken(user);

      logger.info(`Token refreshed for user: ${user.email}`);

      return {
        accessToken,
        expiresIn: require('../config/jwt').expiresIn
      };
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Initiate password reset process
   * @param {string} email - User email
   * @returns {Object} Reset token information
   */
  static async forgotPassword(email) {
    try {
      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not for security
        return {
          message: 'If the email exists, a password reset link has been sent'
        };
      }

      // Create password reset token
      const resetToken = await PasswordResetToken.createToken(user.user_id, 1); // 1 hour expiration

      logger.info(`Password reset requested for user: ${user.email}`);

      return {
        message: 'If the email exists, a password reset link has been sent',
        token: resetToken.token, // In production, this would be sent via email
        expires_at: resetToken.expires_at
      };
    } catch (error) {
      logger.error('Forgot password error:', error);
      throw error;
    }
  }

  /**
   * Reset password using reset token
   * @param {string} token - Password reset token
   * @param {string} newPassword - New password
   * @returns {Object} Success message
   */
  static async resetPassword(token, newPassword) {
    try {
      // Find and validate reset token
      const resetToken = await PasswordResetToken.findValidToken(token);
      if (!resetToken) {
        throw new Error('Invalid or expired reset token');
      }

      // Update user password
      const user = await User.findByPk(resetToken.user_id);
      await user.setPassword(newPassword);
      await user.save();

      // Mark token as used
      await resetToken.markAsUsed();

      logger.info(`Password reset completed for user: ${user.email}`);

      return {
        message: 'Password has been reset successfully'
      };
    } catch (error) {
      logger.error('Reset password error:', error);
      throw error;
    }
  }

  /**
   * Validate user session
   * @param {string} accessToken - JWT access token
   * @returns {Object} User data
   */
  static async validateSession(accessToken) {
    try {
      // Verify token
      const decoded = JWTService.verifyAccessToken(accessToken);

      // Find user
      const user = await User.findByPk(decoded.user_id);
      if (!user) {
        throw new Error('User not found');
      }

      return user.toJSON();
    } catch (error) {
      logger.error('Session validation error:', error);
      throw error;
    }
  }

  /**
   * Change user password
   * @param {number} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Object} Success message
   */
  static async changePassword(userId, currentPassword, newPassword) {
    try {
      // Find user
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Validate current password
      const isValidPassword = await user.validatePassword(currentPassword);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      await user.setPassword(newPassword);
      await user.save();

      logger.info(`Password changed for user: ${user.email}`);

      return {
        message: 'Password changed successfully'
      };
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Get user profile
   * @param {number} userId - User ID
   * @returns {Object} User profile data
   */
  static async getUserProfile(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return user.toJSON();
    } catch (error) {
      logger.error('Get user profile error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {number} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated user data
   */
  static async updateUserProfile(userId, updateData) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Only allow certain fields to be updated
      const allowedFields = ['name'];
      const filteredData = {};
      
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      });

      await user.update(filteredData);

      logger.info(`Profile updated for user: ${user.email}`);

      return user.toJSON();
    } catch (error) {
      logger.error('Update user profile error:', error);
      throw error;
    }
  }
}

module.exports = AuthService;