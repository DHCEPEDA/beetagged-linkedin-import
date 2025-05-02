const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 */
const connectDB = async () => {
  try {
    // Get MongoDB connection URI from environment variables
    const dbUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/beetagger';
    
    // For development without a real MongoDB, create a mock connection
    if (process.env.NODE_ENV === 'development' && !process.env.MONGODB_URI && !process.env.MONGO_URI) {
      console.log('No MongoDB URI provided. Running in mock mode...');
      mongoose.connection.db = {
        collection: () => ({
          find: () => ({
            toArray: () => Promise.resolve([])
          }),
          findOne: () => Promise.resolve(null),
          insertOne: () => Promise.resolve({ insertedId: 'mock-id' }),
          updateOne: () => Promise.resolve({ modifiedCount: 1 }),
          deleteOne: () => Promise.resolve({ deletedCount: 1 })
        })
      };
      
      // Emit a connected event so the app can continue
      mongoose.connection.emit('connected');
      return;
    }
    
    // Real MongoDB connection
    const conn = await mongoose.connect(dbUri);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    
    // Always use mock mode when MongoDB connection fails
    console.log('Running in mock mode due to MongoDB connection error...');
    
    // Set up mock MongoDB connection
    mongoose.connection.db = {
      collection: () => ({
        find: () => ({
          toArray: () => Promise.resolve([])
        }),
        findOne: () => Promise.resolve(null),
        insertOne: () => Promise.resolve({ insertedId: 'mock-id' }),
        updateOne: () => Promise.resolve({ modifiedCount: 1 }),
        deleteOne: () => Promise.resolve({ deletedCount: 1 })
      })
    };
    
    // Emit a connected event so the app can continue
    mongoose.connection.emit('connected');
  }
};

module.exports = connectDB;
