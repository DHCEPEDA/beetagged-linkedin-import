/**
 * BeeTagged Robust Logging System
 * Provides structured logging with different levels and formats
 */

// Logging levels with corresponding colors for console output
const LOG_LEVELS = {
  ERROR: { value: 0, color: '\x1b[31m', label: 'ERROR' },    // Red
  WARN: { value: 1, color: '\x1b[33m', label: 'WARN' },      // Yellow
  INFO: { value: 2, color: '\x1b[36m', label: 'INFO' },      // Cyan
  DEBUG: { value: 3, color: '\x1b[32m', label: 'DEBUG' },    // Green
  TRACE: { value: 4, color: '\x1b[35m', label: 'TRACE' }     // Magenta
};

// Reset color code
const RESET = '\x1b[0m';

// Current log level, defaulting to INFO in production and DEBUG in development
const currentLevel = process.env.NODE_ENV === 'production' 
  ? LOG_LEVELS.INFO.value 
  : LOG_LEVELS.DEBUG.value;

/**
 * Format a log message with timestamp, level, and metadata
 * 
 * @param {string} level - Log level label
 * @param {string} message - Log message
 * @param {Object} metadata - Additional data to log
 * @returns {string} Formatted log string
 */
function formatLog(level, message, metadata = {}) {
  const timestamp = new Date().toISOString();
  const levelInfo = Object.values(LOG_LEVELS).find(l => l.label === level);
  
  let logString = `[${timestamp}] ${levelInfo.color}${level}${RESET}: ${message}`;
  
  // Add metadata if present
  if (Object.keys(metadata).length > 0) {
    try {
      logString += `\n${JSON.stringify(metadata, null, 2)}`;
    } catch (err) {
      logString += `\n[Error serializing metadata: ${err.message}]`;
    }
  }
  
  return logString;
}

/**
 * Log a message if its level is less than or equal to the current level
 * 
 * @param {number} levelValue - Numerical log level
 * @param {string} levelLabel - Text label for the log level
 * @param {string} message - Log message
 * @param {Object} metadata - Additional data to log
 */
function log(levelValue, levelLabel, message, metadata = {}) {
  if (levelValue <= currentLevel) {
    console.log(formatLog(levelLabel, message, metadata));
  }
}

// Public logger API
const logger = {
  error: (message, metadata = {}) => {
    log(LOG_LEVELS.ERROR.value, LOG_LEVELS.ERROR.label, message, metadata);
  },
  
  warn: (message, metadata = {}) => {
    log(LOG_LEVELS.WARN.value, LOG_LEVELS.WARN.label, message, metadata);
  },
  
  info: (message, metadata = {}) => {
    log(LOG_LEVELS.INFO.value, LOG_LEVELS.INFO.label, message, metadata);
  },
  
  debug: (message, metadata = {}) => {
    log(LOG_LEVELS.DEBUG.value, LOG_LEVELS.DEBUG.label, message, metadata);
  },
  
  trace: (message, metadata = {}) => {
    log(LOG_LEVELS.TRACE.value, LOG_LEVELS.TRACE.label, message, metadata);
  },
  
  /**
   * HTTP request logger
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  request: (req, res, next) => {
    const startTime = Date.now();
    
    // Log request details
    logger.info(`${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      query: req.query,
      headers: {
        host: req.get('Host'),
        referer: req.get('Referer'),
        origin: req.get('Origin')
      }
    });
    
    // Capture response details
    const originalSend = res.send;
    res.send = function(body) {
      res.responseBody = body;
      return originalSend.apply(res, arguments);
    };
    
    // Log response on request completion
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      // Determine log level based on status code
      const logMethod = res.statusCode >= 500 ? 'error' :
                        res.statusCode >= 400 ? 'warn' : 'info';
      
      // Log response details
      logger[logMethod](`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`, {
        ip: req.ip,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        contentLength: res.get('Content-Length'),
        contentType: res.get('Content-Type')
      });
    });
    
    next();
  },
  
  /**
   * Error logger middleware
   * @param {Error} err - Error object
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  errorHandler: (err, req, res, next) => {
    logger.error(`Error processing ${req.method} ${req.path}`, {
      error: {
        message: err.message,
        stack: err.stack,
        code: err.code
      },
      request: {
        method: req.method,
        path: req.path,
        query: req.query,
        ip: req.ip
      }
    });
    
    // Send error response
    res.status(err.status || 500).json({
      error: {
        message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
      }
    });
  }
};

module.exports = logger;