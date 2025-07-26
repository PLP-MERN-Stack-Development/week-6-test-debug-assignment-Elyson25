const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('./logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  try {
    const payload = {
      id: user._id,
      email: user.email,
      username: user.username,
      role: user.role
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    logger.info(`Token generated for user: ${user.email}`);
    return token;
  } catch (error) {
    logger.error('Error generating token:', error);
    throw new Error('Failed to generate token');
  }
};

/**
 * Verify JWT token
 * @param {String} token - JWT token
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    logger.debug(`Token verified for user: ${decoded.email}`);
    return decoded;
  } catch (error) {
    logger.error('Token verification failed:', error.message);
    throw new Error('Invalid token');
  }
};

/**
 * Extract token from authorization header
 * @param {String} authHeader - Authorization header
 * @returns {String|null} Token or null
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

/**
 * Get current user from token
 * @param {String} token - JWT token
 * @returns {Object|null} User object or null
 */
const getCurrentUser = async (token) => {
  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user || !user.isActive) {
      return null;
    }

    return user;
  } catch (error) {
    logger.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Check if user has required role
 * @param {Object} user - User object
 * @param {String|Array} requiredRoles - Required role(s)
 * @returns {Boolean} True if user has required role
 */
const hasRole = (user, requiredRoles) => {
  if (!user) return false;
  
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return roles.includes(user.role);
};

/**
 * Check if user is admin
 * @param {Object} user - User object
 * @returns {Boolean} True if user is admin
 */
const isAdmin = (user) => {
  return hasRole(user, 'admin');
};

/**
 * Check if user is owner of resource
 * @param {Object} user - User object
 * @param {String} resourceUserId - Resource user ID
 * @returns {Boolean} True if user is owner
 */
const isOwner = (user, resourceUserId) => {
  if (!user || !resourceUserId) return false;
  return user._id.toString() === resourceUserId.toString();
};

module.exports = {
  generateToken,
  verifyToken,
  extractTokenFromHeader,
  getCurrentUser,
  hasRole,
  isAdmin,
  isOwner
}; 