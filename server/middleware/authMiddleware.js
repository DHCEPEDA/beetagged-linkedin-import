/**
 * Advanced Authentication Middleware
 * Provides middleware functions for protecting routes and verifying authentication
 */
const { authService } = require('../services/AuthService');

/**
 * Middleware to verify if a user is authenticated
 * Decodes the auth token from header and attaches user to request
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const isAuthenticated = (req, res, next) => {
  // Get token from Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;
    
  // Also try to get token from x-auth-token header (for compatibility)
  const xAuthToken = req.headers['x-auth-token'];
  
  // Or from query parameter (for non-standard clients)
  const queryToken = req.query.token;
  
  // Use the first available token
  const token = bearerToken || xAuthToken || queryToken;
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required' 
    });
  }
  
  // Verify token and get session
  const session = authService.getSession(token);
  
  if (!session) {
    return res.status(401).json({ 
      success: false,
      message: 'Invalid or expired token' 
    });
  }
  
  // Attach user and token to request
  req.user = session.user;
  req.authToken = token;
  req.authSession = session;
  
  next();
};

/**
 * Optional authentication middleware
 * Works like isAuthenticated but doesn't return 401 if no token
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const optionalAuth = (req, res, next) => {
  // Get token from Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;
    
  // Also try to get token from x-auth-token header (for compatibility)
  const xAuthToken = req.headers['x-auth-token'];
  
  // Or from query parameter (for non-standard clients)
  const queryToken = req.query.token;
  
  // Use the first available token
  const token = bearerToken || xAuthToken || queryToken;
  
  if (token) {
    // Verify token and get session
    const session = authService.getSession(token);
    
    if (session) {
      // Attach user and token to request
      req.user = session.user;
      req.authToken = token;
      req.authSession = session;
    }
  }
  
  next();
};

/**
 * Role-based authorization middleware
 * @param {string|string[]} roles - Role or array of roles allowed to access
 * @returns {function} Middleware function
 */
const hasRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }
    
    const userRoles = req.user.roles || [];
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    // Check if user has at least one of the required roles
    const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      return res.status(403).json({ 
        success: false,
        message: 'Insufficient permissions' 
      });
    }
    
    next();
  };
};

module.exports = {
  isAuthenticated,
  optionalAuth,
  hasRole
};