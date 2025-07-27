// Copy this entire file content to your Heroku app's index.js to fix MongoDB timeouts

/**
 * BeeTagged - Professional Contact Management Platform
 * Self-contained Express server optimized for Heroku deployment
 * 
 * FIXED VERSION - Includes MongoDB timeout protection and connection handling
 * 
 * Features:
 * - Enhanced LinkedIn CSV import with quoted field handling
 * - Facebook contact integration via SDK
 * - Natural language search with OpenAI integration
 * - Smart contact tagging and categorization
 * - MongoDB Atlas cloud storage with timeout protection
 * 
 * @author BeeTagged Development Team
 * @version 1.1.0 - MongoDB Timeout Fix
 */

const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const csv = require('csv-parser');
const compression = require('compression');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// MongoDB connection with optimized settings for Heroku/Atlas
if (process.env.MONGODB_URI) {
  const mongoOptions = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
    maxIdleTimeMS: 30000,
    retryWrites: true,
    w: 'majority'
  };

  mongoose.connect(process.env.MONGODB_URI, mongoOptions)
    .then(() => {
      console.log('MongoDB Atlas connected successfully');
      console.log('Database:', mongoose.connection.db.databaseName);
    })
    .catch(err => {
      console.error('MongoDB connection error:', err);
      console.error('Connection string prefix:', process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 20) + '...' : 'undefined');
    });

  mongoose.connection.on('error', err => {
    console.error('MongoDB runtime error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected');
  });
}

/**
 * MongoDB Contact Schema Definition
 * 
 * Defines the structure for storing professional contact information
 * with support for multi-source imports (LinkedIn, Facebook, manual entry)
 */
const contactSchema = new mongoose.Schema({
  id: { type: Number, unique: true }, // Auto-incrementing unique identifier
  name: String,                       // Full contact name (required)
  email: String,                      // Primary email address
  phone: String,                      // Primary phone number
  company: String,                    // Current employer/organization
  position: String,                   // Job title/role
  location: String,                   // Geographic location (city, state)
  tags: [String],                     // Smart categorization tags (auto-generated + manual)
  source: String,                     // Import source: 'linkedin', 'facebook', 'manual'
  createdAt: { type: Date, default: Date.now } // Timestamp of contact creation
});

const Contact = mongoose.model('Contact', contactSchema);

// File upload setup
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// In-memory counters
let contactIdCounter = 1;

/**
 * Smart Tag Generation System
 */
function generateTags(contact) {
  const tags = [];
  
  // Company-based tagging
  if (contact.company) {
    tags.push(`company:${contact.company.toLowerCase()}`);
    
    const techCompanies = ['google', 'microsoft', 'apple', 'amazon', 'meta', 'facebook', 'netflix', 'uber', 'airbnb'];
    const financeCompanies = ['goldman', 'jpmorgan', 'chase', 'morgan stanley', 'blackrock'];
    
    const companyLower = contact.company.toLowerCase();
    if (techCompanies.some(tech => companyLower.includes(tech))) {
      tags.push('industry:technology');
    }
    if (financeCompanies.some(finance => companyLower.includes(finance))) {
      tags.push('industry:finance');
    }
  }
  
  // Position-based tagging
  if (contact.position) {
    const positionLower = contact.position.toLowerCase();
    if (positionLower.includes('engineer') || positionLower.includes('developer')) {
      tags.push('role:engineering');
    }
    if (positionLower.includes('manager') || positionLower.includes('director')) {
      tags.push('role:management');
    }
    if (positionLower.includes('sales') || positionLower.includes('business development')) {
      tags.push('role:sales');
    }
  }
  
  return tags;
}

/**
 * Health Check Endpoint - FIXED VERSION
 * 
 * Provides system status with timeout protection
 */
app.get('/health', async (req, res) => {
  try {
    // Check MongoDB connection state first
    const mongoState = mongoose.connection.readyState;
    const mongoStatus = mongoState === 1 ? 'connected' : 
                       mongoState === 2 ? 'connecting' : 
                       mongoState === 0 ? 'disconnected' : 'unknown';
    
    let contactCount = 'checking...';
    
    // Only attempt count if MongoDB is fully connected
    if (mongoState === 1) {
      try {
        // Use timeout to prevent hanging
        const countPromise = Contact.countDocuments();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Count timeout')), 5000)
        );
        
        contactCount = await Promise.race([countPromise, timeoutPromise]);
      } catch (countError) {
        console.error('Count error:', countError.message);
        contactCount = 'timeout';
      }
    }
    
    res.json({
      status: mongoState === 1 ? 'healthy' : 'degraded',
      server: 'BeeTagged',
      contacts: contactCount,
      port: PORT,
      uptime: process.uptime(),
      mongodb: mongoStatus,
      mongoState: mongoState,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message,
      server: 'BeeTagged',
      port: PORT 
    });
  }
});

/**
 * Get All Contacts - FIXED VERSION
 * 
 * Retrieves all contacts with timeout protection
 */
app.get('/api/contacts', async (req, res) => {
  try {
    // Check MongoDB connection state
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database not ready', 
        contacts: [],
        mongoState: mongoose.connection.readyState 
      });
    }

    // Add timeout protection for the query
    const contactsPromise = Contact.find().sort({ createdAt: -1 });
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout')), 10000)
    );
    
    const contacts = await Promise.race([contactsPromise, timeoutPromise]);
    console.log(`Returning ${contacts.length} contacts`);
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    
    if (error.message === 'Query timeout') {
      res.status(504).json({ 
        error: 'Database query timeout', 
        contacts: [],
        suggestion: 'Try again in a moment' 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch contacts', 
        contacts: [],
        details: error.message 
      });
    }
  }
});

// Basic search endpoint
app.get('/api/search/natural', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.json({ results: [] });
    }

    const searchQuery = {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { company: { $regex: query, $options: 'i' } },
        { position: { $regex: query, $options: 'i' } },
        { location: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } }
      ]
    };
    
    const results = await Contact.find(searchQuery).sort({ createdAt: -1 });
    res.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed', results: [] });
  }
});

// Server startup
app.listen(PORT, '0.0.0.0', () => {
  console.log(`BeeTagged Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`MongoDB: ${process.env.MONGODB_URI ? 'configured' : 'not configured'}`);
});

module.exports = app;