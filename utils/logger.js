/**
 * Logger utility for BeeTagged application
 * Provides structured logging for debugging and monitoring
 */

const logger = {
  info: (message, data = {}) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] INFO: ${message}`, JSON.stringify(data, null, 2));
  },

  error: (message, data = {}) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR: ${message}`, JSON.stringify(data, null, 2));
  },

  warn: (message, data = {}) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] WARN: ${message}`, JSON.stringify(data, null, 2));
  },

  debug: (message, data = {}) => {
    const timestamp = new Date().toISOString();
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${timestamp}] DEBUG: ${message}`, JSON.stringify(data, null, 2));
    }
  }
};

module.exports = logger;