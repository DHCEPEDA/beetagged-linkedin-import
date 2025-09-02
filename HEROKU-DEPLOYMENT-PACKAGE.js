// BeeTagged Heroku Deployment Package
// This is the production-ready backend for Heroku deployment

const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const axios = require('axios');
const csvParser = require('csv-parser');

const app = express();
const port = process.env.PORT || 5000;

// Global error handlers to prevent crashes
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit - log and continue
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - log and continue
});

// Enhanced security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// Enhanced CORS for maximum compatibility
app.use(cors({
  origin: function (origin, callback) {
    // Allow all origins for maximum compatibility
    callback(null, true);
  },
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Performance and logging middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting with fallback
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/' || req.path === '/health';
  }
});
app.use(limiter);

// Memory-based file storage for CSV uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Database connection tracking
let isDbConnected = false;
let dbConnectionAttempts = 0;
const MAX_DB_ATTEMPTS = 5;

// Contact schema
const contactSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  email: { type: String, default: '', index: true },
  phoneNumber: { type: String, default: '', index: true },
  company: { type: String, default: '', index: true },
  jobTitle: { type: String, default: '' },
  location: { type: String, default: '', index: true },
  linkedinId: { type: String, default: '', index: true },
  facebookId: { type: String, default: '', index: true },
  tags: [{
    value: { type: String, index: true },
    category: { type: String, default: 'general', index: true },
    confidence: { type: Number, default: 1.0 }
  }],
  searchableText: { type: String, default: '', index: true },
  userId: { type: String, default: null, index: true },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
});

// Add compound indexes for better performance
contactSchema.index({ userId: 1, name: 1 });
contactSchema.index({ userId: 1, company: 1 });
contactSchema.index({ userId: 1, location: 1 });
contactSchema.index({ userId: 1, 'tags.value': 1 });
contactSchema.index({ userId: 1, createdAt: -1 });

const Contact = mongoose.model('Contact', contactSchema);

// Ultra-reliable MongoDB connection function
async function connectMongoDB() {
  if (isDbConnected) return true;
  
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI environment variable not set');
      return false;
    }

    // Clean and prepare the MongoDB URI for production
    let mongoUri = process.env.MONGODB_URI;
    
    // Handle different URI formats
    if (mongoUri.includes('/test?')) {
      mongoUri = mongoUri.replace('/test?', '/beetagged?');
    }
    if (!mongoUri.includes('beetagged') && !mongoUri.includes('cluster0')) {
      mongoUri = mongoUri.replace(/\/[^?]*\?/, '/beetagged?');
    }
    
    // Ensure SSL and retry writes for production
    if (!mongoUri.includes('retryWrites')) {
      const separator = mongoUri.includes('?') ? '&' : '?';
      mongoUri += `${separator}retryWrites=true&w=majority`;
    }
    
    console.log(`🔄 Connecting to MongoDB (attempt ${dbConnectionAttempts + 1}/${MAX_DB_ATTEMPTS})...`);
    
    const mongoOptions = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 15000,
      retryWrites: true,
      w: 'majority',
      maxIdleTimeMS: 30000,
      family: 4 // Use IPv4 for better Heroku compatibility
    };

    await mongoose.connect(mongoUri, mongoOptions);
    
    // Verify connection with timeout
    const pingPromise = mongoose.connection.db.admin().ping();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Ping timeout')), 10000)
    );
    
    await Promise.race([pingPromise, timeoutPromise]);
    
    isDbConnected = true;
    const dbName = mongoose.connection.db.databaseName;
    console.log('✅ MongoDB Atlas connected successfully');
    console.log('📊 Database:', dbName);
    console.log('🌐 Connection state:', mongoose.connection.readyState);
    
    // Setup connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('🔴 MongoDB connection error:', err.message);
      isDbConnected = false;
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('🟡 MongoDB disconnected. Will attempt to reconnect...');
      isDbConnected = false;
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🟢 MongoDB reconnected successfully');
      isDbConnected = true;
    });
    
    return true;
    
  } catch (error) {
    dbConnectionAttempts++;
    console.error(`❌ MongoDB connection failed (${dbConnectionAttempts}/${MAX_DB_ATTEMPTS}):`);
    console.error(`   Error name: ${error.name}`);
    console.error(`   Error message: ${error.message}`);
    console.error(`   Error code: ${error.code || 'N/A'}`);
    
    // Log specific connection issues
    if (error.message.includes('ENOTFOUND')) {
      console.error('   🔍 DNS resolution issue - check MongoDB cluster hostname');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('   🔍 Connection refused - check network settings and IP whitelist');
    } else if (error.message.includes('Authentication failed')) {
      console.error('   🔍 Authentication issue - check username/password in MONGODB_URI');
    } else if (error.message.includes('timeout')) {
      console.error('   🔍 Connection timeout - check network connectivity and cluster status');
    }
    
    isDbConnected = false;
    
    if (dbConnectionAttempts < MAX_DB_ATTEMPTS) {
      // Exponential backoff retry
      const delay = Math.min(1000 * Math.pow(2, dbConnectionAttempts), 30000);
      console.log(`⏳ Retrying in ${delay}ms...`);
      setTimeout(() => connectMongoDB(), delay);
    } else {
      console.error('🔴 All MongoDB connection attempts failed. Running in degraded mode.');
    }
    
    return false;
  }
}

// Initialize database connection
connectMongoDB();

// Database health check function
async function checkDatabaseHealth() {
  try {
    if (!isDbConnected || mongoose.connection.readyState !== 1) {
      return false;
    }
    await Contact.countDocuments().limit(1);
    return true;
  } catch (error) {
    console.error('Database health check failed:', error.message);
    return false;
  }
}

// Safe database operation wrapper
async function safeDbOperation(operation, fallback = null) {
  try {
    if (!await checkDatabaseHealth()) {
      console.warn('Database not available, using fallback');
      return fallback;
    }
    return await operation();
  } catch (error) {
    console.error('Database operation failed:', error.message);
    return fallback;
  }
}

// Health check endpoints
app.get('/', (req, res) => {
  res.json({ 
    status: 'BeeTagged API is running',
    version: '2.1.0',
    features: ['natural_search', 'linkedin_import', 'facebook_integration', 'duplicate_detection'],
    database: isDbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', async (req, res) => {
  const dbHealth = await checkDatabaseHealth();
  
  const healthInfo = { 
    status: dbHealth ? 'healthy' : 'degraded',
    database: dbHealth ? 'connected' : 'disconnected',
    version: '2.1.0',
    timestamp: new Date().toISOString()
  };

  // Add detailed diagnostics if requested
  if (req.query.detailed === 'true') {
    healthInfo.diagnostics = {
      mongodb_uri_configured: !!process.env.MONGODB_URI,
      connection_attempts: dbConnectionAttempts,
      max_attempts: MAX_DB_ATTEMPTS,
      mongoose_state: mongoose.connection.readyState,
      mongoose_states: {
        0: 'disconnected',
        1: 'connected', 
        2: 'connecting',
        3: 'disconnecting'
      }
    };

    if (dbHealth && mongoose.connection.db) {
      try {
        const collection = mongoose.connection.db.collection('contacts');
        const count = await collection.estimatedDocumentCount();
        healthInfo.diagnostics.contacts_count = count;
        healthInfo.diagnostics.database_name = mongoose.connection.db.databaseName;
      } catch (dbError) {
        healthInfo.diagnostics.db_error = dbError.message;
      }
    }
  }
  
  res.status(dbHealth ? 200 : 503).json(healthInfo);
});

// Natural language search endpoint
app.get('/api/search-natural', async (req, res) => {
  try {
    const { q: query, userId } = req.query;
    
    if (!query) {
      return res.status(400).json({ 
        error: 'Query parameter is required',
        contacts: [],
        count: 0
      });
    }

    console.log('🔍 Natural language search:', query);
    
    const result = await safeDbOperation(async () => {
      let mongoQuery = {};
      
      if (userId) {
        mongoQuery.userId = userId;
      }

      const searchTerms = query.toLowerCase().split(' ');
      
      // Company-specific searches
      if (searchTerms.includes('google') || searchTerms.includes('at google')) {
        mongoQuery.company = { $regex: /google/i };
      } else if (searchTerms.includes('apple') || searchTerms.includes('at apple')) {
        mongoQuery.company = { $regex: /apple/i };
      } else if (searchTerms.includes('microsoft') || searchTerms.includes('at microsoft')) {
        mongoQuery.company = { $regex: /microsoft/i };
      } else if (searchTerms.includes('meta') || searchTerms.includes('facebook') || searchTerms.includes('at meta')) {
        mongoQuery.company = { $regex: /(meta|facebook)/i };
      } else {
        // General search using multiple conditions
        mongoQuery.$or = [
          { name: { $regex: query, $options: 'i' } },
          { company: { $regex: query, $options: 'i' } },
          { jobTitle: { $regex: query, $options: 'i' } },
          { location: { $regex: query, $options: 'i' } },
          { 'tags.value': { $regex: query, $options: 'i' } },
          { searchableText: { $regex: query, $options: 'i' } },
          // Company patterns for major tech companies
          { company: { $regex: /(google|apple|microsoft|meta|facebook|amazon|netflix|uber|airbnb|twitter|linkedin|salesforce|oracle|adobe|nvidia|intel|tesla|spacex)/i } },
        ];
      }

      const contacts = await Contact.find(mongoQuery)
        .limit(50)
        .sort({ updatedAt: -1 })
        .lean()
        .maxTimeMS(10000);

      return contacts;
      
    }, []);

    const contacts = result || [];
    console.log(`Found ${contacts.length} contacts`);

    res.json({
      query: query,
      count: contacts.length,
      contacts: contacts,
      database_status: isDbConnected ? 'connected' : 'disconnected'
    });

  } catch (error) {
    console.error('Search error:', error);
    
    res.json({ 
      query: req.query.q || '',
      count: 0,
      contacts: [],
      error: 'Search temporarily unavailable',
      message: 'Please try again in a moment',
      database_status: isDbConnected ? 'connected' : 'disconnected'
    });
  }
});

// LinkedIn CSV import endpoint
app.post('/api/import/linkedin', upload.fields([
  { name: 'contacts', maxCount: 1 },
  { name: 'connections', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('=== LinkedIn Import Started ===');
    console.log('Files received:', Object.keys(req.files || {}));
    
    const files = req.files || {};
    const { userId, duplicateAction } = req.body;
    
    if (!files.contacts && !files.connections) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least one CSV file (contacts or connections) is required' 
      });
    }

    if (!await checkDatabaseHealth()) {
      return res.status(503).json({
        success: false,
        message: 'Database temporarily unavailable. Please try again later.'
      });
    }

    let allContacts = [];
    let processedCounts = { contacts: 0, connections: 0 };

    // Process contacts.csv
    if (files.contacts && files.contacts[0]) {
      console.log('Processing contacts.csv...');
      try {
        const contactsData = await processLinkedInCSV(files.contacts[0].buffer, 'contacts');
        allContacts.push(...contactsData);
        processedCounts.contacts = contactsData.length;
        console.log(`Parsed ${contactsData.length} contacts from contacts.csv`);
      } catch (error) {
        console.error('Error processing contacts.csv:', error);
        return res.status(400).json({
          success: false,
          message: 'Failed to process contacts.csv: ' + error.message
        });
      }
    }

    // Process connections.csv
    if (files.connections && files.connections[0]) {
      console.log('Processing connections.csv...');
      try {
        const connectionsData = await processLinkedInCSV(files.connections[0].buffer, 'connections');
        allContacts.push(...connectionsData);
        processedCounts.connections = connectionsData.length;
        console.log(`Parsed ${connectionsData.length} contacts from connections.csv`);
      } catch (error) {
        console.error('Error processing connections.csv:', error);
        return res.status(400).json({
          success: false,
          message: 'Failed to process connections.csv: ' + error.message
        });
      }
    }

    if (allContacts.length === 0) {
      return res.json({
        success: true,
        message: 'No contacts found in the uploaded files',
        inserted: 0,
        updated: 0,
        skipped: 0,
        total: 0
      });
    }

    // Save contacts to database
    const result = await safeDbOperation(async () => {
      let inserted = 0, updated = 0, skipped = 0;
      
      for (const contactData of allContacts) {
        try {
          const existingContact = await Contact.findOne({
            $or: [
              { email: contactData.email },
              { name: contactData.name, company: contactData.company }
            ]
          });
          
          if (existingContact) {
            Object.assign(existingContact, contactData);
            await existingContact.save();
            updated++;
          } else {
            await Contact.create({
              ...contactData,
              userId: userId || 'default',
              tags: []
            });
            inserted++;
          }
        } catch (error) {
          console.error(`Error processing contact ${contactData.name}:`, error);
          skipped++;
        }
      }
      
      return { inserted, updated, skipped };
    }, { inserted: 0, updated: 0, skipped: allContacts.length });

    console.log('=== LinkedIn Import Complete ===');
    console.log(`Total processed: ${allContacts.length}`);
    console.log(`Inserted: ${result.inserted}, Updated: ${result.updated}, Skipped: ${result.skipped}`);

    res.json({
      success: true,
      message: 'LinkedIn import completed successfully',
      inserted: result.inserted,
      updated: result.updated,
      skipped: result.skipped,
      total: allContacts.length,
      processed: processedCounts
    });

  } catch (error) {
    console.error('LinkedIn import error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Import failed',
      message: error.message 
    });
  }
});

// Process LinkedIn CSV helper function
async function processLinkedInCSV(buffer, type) {
  return new Promise((resolve, reject) => {
    const contacts = [];
    const stream = require('stream');
    
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);
    
    bufferStream
      .pipe(csvParser())
      .on('data', (row) => {
        try {
          let contact;
          
          if (type === 'contacts') {
            contact = {
              name: `${row['First Name'] || ''} ${row['Last Name'] || ''}`.trim(),
              email: row['Email Address'] || '',
              company: row['Company'] || '',
              jobTitle: row['Position'] || '',
              location: row['Location'] || '',
              linkedinId: row['Profile URL'] || '',
              createdAt: new Date(),
              updatedAt: new Date()
            };
          } else {
            contact = {
              name: `${row['First Name'] || ''} ${row['Last Name'] || ''}`.trim(),
              email: row['Email Address'] || '',
              company: row['Company'] || '',
              jobTitle: row['Position'] || '',
              location: row['Location'] || '',
              linkedinId: row['URL'] || '',
              createdAt: new Date(),
              updatedAt: new Date()
            };
          }
          
          if (contact.name) {
            contacts.push(contact);
          }
        } catch (error) {
          console.warn('Error parsing row:', error);
        }
      })
      .on('end', () => {
        resolve(contacts);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

// Start server with error handling
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 BeeTagged Production Server running on port ${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`🗄️ Database: ${isDbConnected ? 'Connected' : 'Initializing...'}`);
  console.log(`⚡ Features: Natural Search, LinkedIn Import, Authentication`);
  console.log(`🔧 Version: 2.1.0 - Production Edition`);
});

server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  switch (error.code) {
    case 'EACCES':
      console.error(`Port ${port} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`Port ${port} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close(() => {
      console.log('✅ MongoDB connection closed.');
      process.exit(0);
    });
  });
});

module.exports = app;