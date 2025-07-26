const { getCurrentUser, extractTokenFromHeader } = require('../utils/auth');
const logger = require('../utils/logger');

/**
 * Authentication middleware
 * Adds user to request object if valid token is provided
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const user = await getCurrentUser(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    logger.debug(`User authenticated: ${user.email}`);
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Optional authentication middleware
 * Adds user to request object if valid token is provided, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const user = await getCurrentUser(token);
      if (user) {
        req.user = user;
        logger.debug(`Optional auth - User authenticated: ${user.email}`);
      }
    }

    next();
  } catch (error) {
    logger.error('Optional authentication error:', error);
    // Continue without authentication
    next();
  }
};

/**
 * Role-based authorization middleware
 * @param {String|Array} roles - Required role(s)
 */
const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRoles = Array.isArray(roles) ? roles : [roles];
    if (!userRoles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt by user ${req.user.email} for roles: ${userRoles}`);
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    logger.debug(`User ${req.user.email} authorized for roles: ${userRoles}`);
    next();
  };
};

/**
 * Admin authorization middleware
 */
const requireAdmin = authorize('admin');

/**
 * Owner authorization middleware
 * @param {Function} getResourceUserId - Function to get resource user ID from request
 */
const requireOwner = (getResourceUserId) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const resourceUserId = getResourceUserId(req);
    if (!resourceUserId) {
      return res.status(400).json({ error: 'Resource not found' });
    }

    if (req.user._id.toString() !== resourceUserId.toString() && req.user.role !== 'admin') {
      logger.warn(`Unauthorized access attempt by user ${req.user.email} for resource owned by ${resourceUserId}`);
      return res.status(403).json({ error: 'Access denied' });
    }

    logger.debug(`User ${req.user.email} authorized as owner for resource: ${resourceUserId}`);
    next();
  };
};

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  requireAdmin,
  requireOwner
}; 