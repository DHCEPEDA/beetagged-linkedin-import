/**
 * BeeTagged MongoDB Connection Utility
 * Provides a robust MongoDB connection with error handling and reconnection
 */
const mongoose = require('mongoose');
const logger = require('./logger');

// Default connection options
const defaultOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  autoIndex: true,
  maxPoolSize: 10,
  socketTimeoutMS: 45000,
  family: 4 // Use IPv4, skip trying IPv6
};

/**
 * Connect to MongoDB with error handling and logging
 * @param {string} uri - MongoDB connection URI
 * @param {object} options - Additional Mongoose connection options
 * @returns {Promise<mongoose.Connection>} Mongoose connection object
 */
async function connect(uri, options = {}) {
  try {
    // Merge default options with user provided options
    const connectionOptions = { ...defaultOptions, ...options };
    
    // Check if we have a valid connection URI
    if (!uri) {
      if (process.env.MONGODB_URI) {
        uri = process.env.MONGODB_URI;
        logger.info('Using MongoDB URI from environment variable');
      } else {
        const mockMode = process.env.MOCK_MODE === 'true';
        if (mockMode) {
          logger.warn('No MongoDB URI provided, running in mock mode');
          return null;
        } else {
          throw new Error('MongoDB URI is required. Set MONGODB_URI in environment variables or pass to connect()');
        }
      }
    }
    
    logger.info('Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(uri, connectionOptions);
    
    logger.info('MongoDB connected successfully', {
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    });
    
    // Set up connection event handlers
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
    
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err.message });
    });
    
    return mongoose.connection;
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { 
      error: error.message,
      code: error.code,
      name: error.name
    });
    
    throw error;
  }
}

/**
 * Disconnect from MongoDB
 * @returns {Promise<void>}
 */
async function disconnect() {
  try {
    logger.info('Disconnecting from MongoDB...');
    await mongoose.disconnect();
    logger.info('MongoDB disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB', { error: error.message });
    throw error;
  }
}

/**
 * Get connection status
 * @returns {Object} Connection status information
 */
function getStatus() {
  const connection = mongoose.connection;
  return {
    connected: connection.readyState === 1,
    readyState: connection.readyState,
    host: connection.host,
    port: connection.port,
    name: connection.name
  };
}

module.exports = {
  connect,
  disconnect,
  getStatus,
  connection: mongoose.connection
};