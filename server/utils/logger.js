/**
 * Logger Module
 * Provides unified logging for the BeeTagged server
 */

// Simple logger - in production, we would use Winston or similar
const logger = {
  info: (message, data = {}) => {
    console.log(`[${new Date().toISOString()}] INFO: ${message}`, data);
  },
  
  error: (message, data = {}) => {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`, data);
  },
  
  warn: (message, data = {}) => {
    console.warn(`[${new Date().toISOString()}] WARN: ${message}`, data);
  },
  
  debug: (message, data = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${new Date().toISOString()}] DEBUG: ${message}`, data);
    }
  }
};

module.exports = logger;