// JWT Token Service
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

class JWTService {
  /**
   * Generate access token
   * @param {Object} payload - User data to include in token
   * @returns {string} JWT access token
   */
  static generateAccessToken(payload) {
    const tokenPayload = {
      user_id: payload.user_id,
      email: payload.email,
      role: payload.role,
      name: payload.name
    };

    return jwt.sign(tokenPayload, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
      algorithm: jwtConfig.algorithm,
      issuer: 'egytravel-auth',
      audience: 'egytravel-app'
    });
  }

  /**
   * Generate refresh token
   * @param {Object} payload - User data to include in token
   * @returns {string} JWT refresh token
   */
  static generateRefreshToken(payload) {
    const tokenPayload = {
      user_id: payload.user_id,
      email: payload.email,
      type: 'refresh'
    };

    return jwt.sign(tokenPayload, jwtConfig.refreshSecret, {
      expiresIn: jwtConfig.refreshExpiresIn,
      algorithm: jwtConfig.algorithm,
      issuer: 'egytravel-auth',
      audience: 'egytravel-app'
    });
  }

  /**
   * Generate both access and refresh tokens
   * @param {Object} user - User object
   * @returns {Object} Object containing access and refresh tokens
   */
  static generateTokenPair(user) {
    const payload = {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      name: user.name
    };

    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
      expiresIn: jwtConfig.expiresIn
    };
  }

  /**
   * Verify access token
   * @param {string} token - JWT token to verify
   * @returns {Object} Decoded token payload
   * @throws {Error} If token is invalid or expired
   */
  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, jwtConfig.secret, {
        algorithms: [jwtConfig.algorithm],
        issuer: 'egytravel-auth',
        audience: 'egytravel-app'
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Access token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid access token');
      } else {
        throw new Error('Token verification failed');
      }
    }
  }

  /**
   * Verify refresh token
   * @param {string} token - JWT refresh token to verify
   * @returns {Object} Decoded token payload
   * @throws {Error} If token is invalid or expired
   */
  static verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, jwtConfig.refreshSecret, {
        algorithms: [jwtConfig.algorithm],
        issuer: 'egytravel-auth',
        audience: 'egytravel-app'
      });

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid refresh token');
      } else {
        throw new Error('Refresh token verification failed');
      }
    }
  }

  /**
   * Decode token without verification (for debugging)
   * @param {string} token - JWT token to decode
   * @returns {Object} Decoded token payload
   */
  static decodeToken(token) {
    return jwt.decode(token);
  }

  /**
   * Get token expiration time
   * @param {string} token - JWT token
   * @returns {Date} Expiration date
   */
  static getTokenExpiration(token) {
    const decoded = this.decodeToken(token);
    return new Date(decoded.exp * 1000);
  }

  /**
   * Check if token is expired
   * @param {string} token - JWT token
   * @returns {boolean} True if token is expired
   */
  static isTokenExpired(token) {
    try {
      const expiration = this.getTokenExpiration(token);
      return new Date() > expiration;
    } catch (error) {
      return true;
    }
  }

  /**
   * Extract token from Authorization header
   * @param {string} authHeader - Authorization header value
   * @returns {string|null} JWT token or null if not found
   */
  static extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}

module.exports = JWTService;