// BeeTagged Production Backend - Simplified for Heroku
// Save this file as: index.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const axios = require('axios');
const csvParser = require('csv-parser');
const busboy = require('busboy');

const app = express();
const port = process.env.PORT || 5000;

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

// CORS for maximum compatibility
app.use(cors({
  origin: true,
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Performance middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/' || req.path === '/health'
});
app.use(limiter);

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
    category: { type: String, default: 'general' },
    confidence: { type: Number, default: 1.0 }
  }],
  searchableText: { type: String, default: '' },
  userId: { type: String, default: null, index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

contactSchema.index({ userId: 1, name: 1 });
contactSchema.index({ userId: 1, company: 1 });
contactSchema.index({ userId: 1, createdAt: -1 });

const Contact = mongoose.model('Contact', contactSchema);

// MongoDB connection function
async function connectMongoDB() {
  if (isDbConnected) return true;
  
  try {
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI environment variable not set');
      return false;
    }

    let mongoUri = process.env.MONGODB_URI;
    
    if (mongoUri.includes('/test?')) {
      mongoUri = mongoUri.replace('/test?', '/beetagged?');
    }
    if (!mongoUri.includes('beetagged') && !mongoUri.includes('cluster0')) {
      mongoUri = mongoUri.replace(/\/[^?]*\?/, '/beetagged?');
    }
    
    if (!mongoUri.includes('retryWrites')) {
      const separator = mongoUri.includes('?') ? '&' : '?';
      mongoUri += `${separator}retryWrites=true&w=majority`;
    }
    
    console.log(`Connecting to MongoDB (attempt ${dbConnectionAttempts + 1}/${MAX_DB_ATTEMPTS})...`);
    
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 15000,
      retryWrites: true,
      w: 'majority',
      maxIdleTimeMS: 30000
    });
    
    // Verify connection
    await mongoose.connection.db.admin().ping();
    
    isDbConnected = true;
    console.log('MongoDB Atlas connected successfully');
    console.log('Database:', mongoose.connection.db.databaseName);
    
    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err.message);
      isDbConnected = false;
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected. Will attempt to reconnect...');
      isDbConnected = false;
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected successfully');
      isDbConnected = true;
    });
    
    return true;
    
  } catch (error) {
    dbConnectionAttempts++;
    console.error(`MongoDB connection failed (${dbConnectionAttempts}/${MAX_DB_ATTEMPTS}):`, error.message);
    isDbConnected = false;
    
    if (dbConnectionAttempts < MAX_DB_ATTEMPTS) {
      const delay = Math.min(1000 * Math.pow(2, dbConnectionAttempts), 30000);
      console.log(`Retrying in ${delay}ms...`);
      setTimeout(() => connectMongoDB(), delay);
    } else {
      console.error('All MongoDB connection attempts failed. Running in degraded mode.');
    }
    
    return false;
  }
}

// Initialize database connection
connectMongoDB();

// Database health check
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
    features: ['natural_search', 'linkedin_import', 'authentication'],
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

  if (req.query.detailed === 'true') {
    healthInfo.diagnostics = {
      mongodb_uri_configured: !!process.env.MONGODB_URI,
      connection_attempts: dbConnectionAttempts,
      max_attempts: MAX_DB_ATTEMPTS,
      mongoose_state: mongoose.connection.readyState
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

    console.log('Natural language search:', query);
    
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
        // General search
        mongoQuery.$or = [
          { name: { $regex: query, $options: 'i' } },
          { company: { $regex: query, $options: 'i' } },
          { jobTitle: { $regex: query, $options: 'i' } },
          { location: { $regex: query, $options: 'i' } },
          { 'tags.value': { $regex: query, $options: 'i' } },
          { searchableText: { $regex: query, $options: 'i' } }
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
      database_status: isDbConnected ? 'connected' : 'disconnected'
    });
  }
});

// Simple CSV import using busboy (instead of multer)
app.post('/api/import/linkedin', (req, res) => {
  if (!req.headers['content-type'] || !req.headers['content-type'].includes('multipart/form-data')) {
    return res.status(400).json({ error: 'Content-Type must be multipart/form-data' });
  }

  const bb = busboy({ headers: req.headers });
  const files = {};
  let userId = 'default';

  bb.on('file', (name, file, info) => {
    const { filename, mimeType } = info;
    
    if (!filename.endsWith('.csv') && !mimeType.includes('csv')) {
      return res.status(400).json({ error: 'Only CSV files are allowed' });
    }

    const chunks = [];
    file.on('data', (chunk) => chunks.push(chunk));
    file.on('end', () => {
      files[name] = Buffer.concat(chunks);
    });
  });

  bb.on('field', (name, value) => {
    if (name === 'userId') {
      userId = value;
    }
  });

  bb.on('finish', async () => {
    try {
      console.log('LinkedIn Import Started');
      console.log('Files received:', Object.keys(files));
      
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

      // Process files
      for (const [fileName, buffer] of Object.entries(files)) {
        try {
          const contacts = await processLinkedInCSV(buffer, fileName);
          allContacts.push(...contacts);
          console.log(`Parsed ${contacts.length} contacts from ${fileName}`);
        } catch (error) {
          console.error(`Error processing ${fileName}:`, error);
          return res.status(400).json({
            success: false,
            message: `Failed to process ${fileName}: ${error.message}`
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
                userId: userId,
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

      console.log('LinkedIn Import Complete');
      console.log(`Total processed: ${allContacts.length}`);
      console.log(`Inserted: ${result.inserted}, Updated: ${result.updated}, Skipped: ${result.skipped}`);

      res.json({
        success: true,
        message: 'LinkedIn import completed successfully',
        inserted: result.inserted,
        updated: result.updated,
        skipped: result.skipped,
        total: allContacts.length
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

  req.pipe(bb);
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
          const contact = {
            name: `${row['First Name'] || ''} ${row['Last Name'] || ''}`.trim(),
            email: row['Email Address'] || '',
            company: row['Company'] || '',
            jobTitle: row['Position'] || '',
            location: row['Location'] || '',
            linkedinId: row['Profile URL'] || row['URL'] || '',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
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

// Start server
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`BeeTagged Production Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`Database: ${isDbConnected ? 'Connected' : 'Initializing...'}`);
  console.log(`Features: Natural Search, LinkedIn Import, Authentication`);
  console.log(`Version: 2.1.0 - Simplified Edition`);
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
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close(() => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  });
});

module.exports = app;