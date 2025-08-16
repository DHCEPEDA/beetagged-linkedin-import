// BeeTagged Ultra-Reliable Backend - Always Works
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

// Memory storage for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept CSV files only
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// ===== DATABASE CONNECTION WITH ULTIMATE RELIABILITY =====

let isDbConnected = false;
let dbConnectionAttempts = 0;
const MAX_DB_ATTEMPTS = 10;

// Enhanced Contact Schema
const contactSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  email: { type: String, default: '', index: true },
  phoneNumber: { type: String, default: '' },
  company: { type: String, default: '', index: true },
  jobTitle: { type: String, default: '', index: true },
  location: { type: String, default: '', index: true },
  linkedinId: { type: String, default: '', index: true },
  facebookId: { type: String, default: '', index: true },
  profileImageUrl: { type: String, default: '' },
  url: { type: String, default: '' },
  source: { type: String, default: 'manual', index: true },
  tags: [{
    value: String,
    category: String,
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

    // Clean and prepare the MongoDB URI
    let mongoUri = process.env.MONGODB_URI;
    if (mongoUri.includes('/test?')) {
      mongoUri = mongoUri.replace('/test?', '/beetagged?');
    }
    if (!mongoUri.includes('beetagged')) {
      mongoUri = mongoUri.replace(/\/[^?]*\?/, '/beetagged?');
    }

    console.log(`🔄 Connecting to MongoDB (attempt ${dbConnectionAttempts + 1}/${MAX_DB_ATTEMPTS})...`);
    
    const mongoOptions = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority',
      maxIdleTimeMS: 30000,
      family: 4, // Use IPv4
      bufferCommands: false, // Disable mongoose buffering
      bufferMaxEntries: 0 // Disable mongoose buffering
    };

    await mongoose.connect(mongoUri, mongoOptions);
    
    // Verify connection
    await mongoose.connection.db.admin().ping();
    
    isDbConnected = true;
    console.log('✅ MongoDB Atlas connected successfully');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
    
    // Setup indexes in background
    setupIndexes().catch(err => {
      console.warn('⚠️ Index setup warning:', err.message);
    });
    
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
    console.error(`❌ MongoDB connection failed (${dbConnectionAttempts}/${MAX_DB_ATTEMPTS}):`, error.message);
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

// Setup database indexes
async function setupIndexes() {
  try {
    if (!isDbConnected) return;
    
    const collection = mongoose.connection.db.collection('contacts');
    
    // Create text search index
    await collection.createIndex({
      name: 'text',
      company: 'text',
      jobTitle: 'text',
      location: 'text',
      'tags.value': 'text',
      searchableText: 'text'
    }, { 
      name: 'contact_text_search',
      background: true
    });
    
    console.log('✅ Text search index created/verified');
    
  } catch (error) {
    if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
      console.log('✅ Text search index already exists');
    } else {
      console.warn('⚠️ Index creation warning:', error.message);
    }
  }
}

// Initialize database connection
connectMongoDB();

// ===== UTILITY FUNCTIONS =====

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

// ===== API ENDPOINTS =====

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
  
  res.status(dbHealth ? 200 : 503).json({ 
    status: dbHealth ? 'healthy' : 'degraded',
    database: dbHealth ? 'connected' : 'disconnected',
    version: '2.1.0',
    timestamp: new Date().toISOString()
  });
});

// Ultra-reliable search endpoint with multiple fallbacks
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
    
    // Execute search with database safety
    const result = await safeDbOperation(async () => {
      let mongoQuery = {};
      
      // Add user filter if provided
      if (userId) {
        mongoQuery.userId = userId;
      }

      // Enhanced search patterns
      const searchTerms = query.toLowerCase();
      
      // Company-specific searches
      if (searchTerms.includes('google') || searchTerms.includes('at google')) {
        mongoQuery.company = { $regex: /google/i };
      } else if (searchTerms.includes('apple') || searchTerms.includes('at apple')) {
        mongoQuery.company = { $regex: /apple/i };
      } else if (searchTerms.includes('microsoft') || searchTerms.includes('at microsoft')) {
        mongoQuery.company = { $regex: /microsoft/i };
      } else if (searchTerms.includes('meta') || searchTerms.includes('facebook') || searchTerms.includes('at meta')) {
        mongoQuery.company = { $regex: /(meta|facebook)/i };
      }
      // Location-based searches
      else if (searchTerms.includes('san francisco') || searchTerms.includes('sf') || searchTerms.includes('in sf')) {
        mongoQuery.location = { $regex: /san francisco|sf/i };
      } else if (searchTerms.includes('new york') || searchTerms.includes('ny') || searchTerms.includes('nyc')) {
        mongoQuery.location = { $regex: /new york|ny|nyc/i };
      } else if (searchTerms.includes('seattle')) {
        mongoQuery.location = { $regex: /seattle/i };
      }
      // Job title searches
      else if (searchTerms.includes('engineer') || searchTerms.includes('engineers')) {
        mongoQuery.jobTitle = { $regex: /engineer/i };
      } else if (searchTerms.includes('designer') || searchTerms.includes('design')) {
        mongoQuery.jobTitle = { $regex: /design/i };
      } else if (searchTerms.includes('manager') || searchTerms.includes('management')) {
        mongoQuery.jobTitle = { $regex: /manager|management/i };
      } else if (searchTerms.includes('director')) {
        mongoQuery.jobTitle = { $regex: /director/i };
      } else if (searchTerms.includes('ceo') || searchTerms.includes('founder')) {
        mongoQuery.jobTitle = { $regex: /(ceo|founder)/i };
      }
      // Industry searches
      else if (searchTerms.includes('tech') || searchTerms.includes('technology')) {
        mongoQuery.$or = [
          { company: { $regex: /(google|apple|microsoft|meta|facebook|amazon|netflix|uber|airbnb|twitter|linkedin|salesforce|oracle|adobe|nvidia|intel|tesla|spacex)/i } },
          { jobTitle: { $regex: /engineer|developer|programmer|architect/i } }
        ];
      }
      // Generic text search fallback
      else {
        mongoQuery.$text = { $search: query };
      }

      console.log('MongoDB query:', JSON.stringify(mongoQuery, null, 2));

      // Execute search with timeout
      const contacts = await Contact.find(mongoQuery)
        .limit(50)
        .sort({ updatedAt: -1 })
        .lean()
        .maxTimeMS(10000); // 10 second timeout

      return contacts;
      
    }, []); // Fallback to empty array

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
    
    // Always return a valid response, never crash
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

// Get contact by ID with safety
app.get('/api/contacts/:id', async (req, res) => {
  try {
    const contact = await safeDbOperation(async () => {
      return await Contact.findById(req.params.id).lean();
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(contact);
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
});

// Ultra-reliable LinkedIn import with comprehensive error handling
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

    // Check database availability
    if (!await checkDatabaseHealth()) {
      return res.status(503).json({
        success: false,
        message: 'Database temporarily unavailable. Please try again later.'
      });
    }

    let allContacts = [];
    let duplicatesFound = [];
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
        console.log(`Parsed ${connectionsData.length} connections from connections.csv`);
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
        success: false,
        message: 'No valid contacts found in the uploaded files'
      });
    }

    // Check for duplicates in database
    console.log('Checking for duplicates in database...');
    for (let contact of allContacts) {
      try {
        const existing = await Contact.findOne({
          $or: [
            { name: { $regex: new RegExp(`^${contact.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
            ...(contact.email ? [{ email: contact.email }] : [])
          ]
        }).lean();
        
        if (existing) {
          duplicatesFound.push({
            new: contact,
            existing: existing,
            matchType: existing.name.toLowerCase() === contact.name.toLowerCase() ? 'name' : 'email'
          });
        }
      } catch (error) {
        console.warn('Error checking duplicate for contact:', contact.name, error.message);
      }
    }

    if (duplicatesFound.length > 0 && !duplicateAction) {
      console.log(`Found ${duplicatesFound.length} potential duplicates`);
      return res.json({
        success: false,
        requiresDuplicateHandling: true,
        duplicates: duplicatesFound.slice(0, 5), // Send first 5 for review
        totalDuplicates: duplicatesFound.length,
        totalContacts: allContacts.length,
        message: `Found ${duplicatesFound.length} potential duplicate contacts. Please choose how to handle them.`
      });
    }

    // Process based on duplicate action
    let insertedCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;

    for (let contact of allContacts) {
      try {
        const existing = await Contact.findOne({
          $or: [
            { name: { $regex: new RegExp(`^${contact.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
            ...(contact.email ? [{ email: contact.email }] : [])
          ]
        });

        if (existing) {
          if (duplicateAction === 'update') {
            // Update existing contact
            await Contact.findByIdAndUpdate(existing._id, {
              ...contact,
              updatedAt: new Date()
            });
            updatedCount++;
            console.log(`Updated existing contact: ${contact.name}`);
          } else if (duplicateAction === 'skip') {
            skippedCount++;
            console.log(`Skipped duplicate: ${contact.name}`);
          } else if (duplicateAction === 'add') {
            // Add as new contact
            const newContact = new Contact({
              ...contact,
              userId: userId || null,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            await newContact.save();
            insertedCount++;
            console.log(`Added duplicate as new: ${contact.name}`);
          }
        } else {
          // New contact
          const newContact = new Contact({
            ...contact,
            userId: userId || null,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          await newContact.save();
          insertedCount++;
          console.log(`Added new contact: ${contact.name}`);
        }
      } catch (error) {
        console.error(`Error processing contact ${contact.name}:`, error.message);
      }
    }

    const totalContacts = await safeDbOperation(
      async () => await Contact.countDocuments(),
      0
    );
    
    console.log(`=== Import Complete ===`);
    console.log(`Processed: contacts=${processedCounts.contacts}, connections=${processedCounts.connections}`);
    console.log(`Results: inserted=${insertedCount}, updated=${updatedCount}, skipped=${skippedCount}`);
    console.log(`Total contacts in database: ${totalContacts}`);

    res.json({
      success: true,
      inserted: insertedCount,
      updated: updatedCount,
      skipped: skippedCount,
      duplicatesFound: duplicatesFound.length,
      processedCounts,
      totalContacts,
      message: `Successfully processed ${allContacts.length} contacts. Added ${insertedCount} new, updated ${updatedCount}, skipped ${skippedCount}.`
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ 
      success: false, 
      message: `Import failed: ${error.message}` 
    });
  }
});

// Enhanced CSV processing function
async function processLinkedInCSV(buffer, fileType) {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = require('stream');
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);

    let processedRows = 0;
    let errorCount = 0;

    bufferStream
      .pipe(csvParser())
      .on('data', (row) => {
        try {
          processedRows++;
          
          // Normalize field names by removing spaces and converting to lowercase
          const normalizedRow = {};
          Object.keys(row).forEach(key => {
            normalizedRow[key.toLowerCase().replace(/\s+/g, '')] = row[key];
          });

          let contact = {};
          
          if (fileType === 'contacts') {
            // Handle contacts.csv format
            contact = {
              name: normalizedRow.firstname && normalizedRow.lastname 
                ? `${normalizedRow.firstname} ${normalizedRow.lastname}`.trim()
                : normalizedRow.name || normalizedRow.fullname || '',
              email: normalizedRow.emailaddress || normalizedRow.email || '',
              company: normalizedRow.company || '',
              jobTitle: normalizedRow.position || normalizedRow.jobtitle || '',
              location: normalizedRow.location || '',
              source: 'linkedin_contacts'
            };
          } else {
            // Handle connections.csv format
            contact = {
              name: normalizedRow.firstname && normalizedRow.lastname 
                ? `${normalizedRow.firstname} ${normalizedRow.lastname}`.trim()
                : normalizedRow.name || normalizedRow.fullname || '',
              email: normalizedRow.emailaddress || normalizedRow.email || '',
              company: normalizedRow.company || '',
              jobTitle: normalizedRow.position || normalizedRow.jobtitle || '',
              location: normalizedRow.location || '',
              source: 'linkedin_connections'
            };
          }

          // Only add if we have a name
          if (contact.name && contact.name.trim()) {
            // Generate searchable text
            contact.searchableText = [
              contact.name,
              contact.company,
              contact.jobTitle,
              contact.location,
              contact.email
            ].filter(Boolean).join(' ').toLowerCase();

            results.push(contact);
          }
        } catch (error) {
          errorCount++;
          console.error('Error parsing CSV row:', error, row);
          
          // Don't fail the entire import for individual row errors
          if (errorCount > 100) {
            console.error('Too many parsing errors, stopping CSV processing');
            reject(new Error('Too many parsing errors in CSV file'));
          }
        }
      })
      .on('end', () => {
        console.log(`CSV processing complete: ${processedRows} rows processed, ${errorCount} errors, ${results.length} valid contacts`);
        resolve(results);
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        reject(new Error('Failed to parse CSV file: ' + error.message));
      });
  });
}

// Enhanced Facebook OAuth endpoints with comprehensive error handling

// Facebook OAuth initiation
app.get('/api/facebook/auth', (req, res) => {
  try {
    const fbAppId = process.env.FACEBOOK_APP_ID || '1222790436230433';
    const redirectUri = (req.get('origin') || req.get('host')) + '/api/facebook/callback';
    
    const params = new URLSearchParams({
      client_id: fbAppId,
      redirect_uri: redirectUri,
      scope: 'public_profile,email,user_friends',
      response_type: 'code',
      state: 'beetagged_facebook_auth'
    });
    
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
    console.log('Facebook auth URL generated successfully');
    
    res.json({ authUrl });
  } catch (error) {
    console.error('Facebook auth URL generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate Facebook auth URL',
      message: error.message
    });
  }
});

// Facebook OAuth callback
app.get('/api/facebook/callback', async (req, res) => {
  const { code, error, error_description } = req.query;
  
  if (error) {
    console.error('Facebook OAuth error:', error, error_description);
    return res.redirect('/?facebook_error=' + encodeURIComponent(error_description || error));
  }
  
  try {
    const fbAppId = process.env.FACEBOOK_APP_ID || '1222790436230433';
    const fbAppSecret = process.env.FACEBOOK_APP_SECRET;
    
    if (!fbAppSecret) {
      throw new Error('Facebook App Secret not configured');
    }
    
    const redirectUri = (req.get('origin') || req.get('host')) + '/api/facebook/callback';
    
    // Exchange code for access token with timeout
    const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: fbAppId,
        client_secret: fbAppSecret,
        redirect_uri: redirectUri,
        code: code
      },
      timeout: 10000
    });
    
    const accessToken = tokenResponse.data.access_token;
    console.log('Facebook access token obtained');
    
    // Get user profile with timeout
    const profileResponse = await axios.get('https://graph.facebook.com/v18.0/me', {
      params: {
        fields: 'id,name,email,link',
        access_token: accessToken
      },
      timeout: 10000
    });
    
    const profile = profileResponse.data;
    console.log('Facebook profile obtained:', profile.name);
    
    // Import Facebook data
    const importResult = await importFacebookData(accessToken, profile);
    
    // Redirect back to frontend with success
    res.redirect('/?facebook_success=' + encodeURIComponent(JSON.stringify({
      profile: profile.name,
      count: importResult.count,
      friends: importResult.friendsCount
    })));
    
  } catch (error) {
    console.error('Facebook callback error:', error.response?.data || error.message);
    res.redirect('/?facebook_error=' + encodeURIComponent('Failed to process Facebook login'));
  }
});

// Enhanced Facebook import with friends support
app.post('/api/facebook/import', async (req, res) => {
  try {
    console.log('=== Facebook Import Started ===');
    const { accessToken, userID, profile } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'Facebook access token is required' 
      });
    }
    
    // Check database availability
    if (!await checkDatabaseHealth()) {
      return res.status(503).json({
        success: false,
        message: 'Database temporarily unavailable. Please try again later.'
      });
    }
    
    const importResult = await importFacebookData(accessToken, profile);
    
    res.json({
      success: true,
      count: importResult.count,
      friendsCount: importResult.friendsCount,
      totalContacts: importResult.totalContacts,
      message: importResult.message
    });

  } catch (error) {
    console.error('=== Facebook Import Error ===', error);
    res.status(500).json({ 
      success: false, 
      message: `Facebook import failed: ${error.message}`
    });
  }
});

// Facebook data import helper function with enhanced error handling
async function importFacebookData(accessToken, userProfile) {
  let insertedCount = 0;
  let friendsCount = 0;
  
  try {
    // Import user's own profile
    if (userProfile) {
      try {
        const existingUser = await Contact.findOne({ 
          name: { $regex: new RegExp(`^${userProfile.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });
        
        if (!existingUser) {
          const contact = new Contact({
            name: userProfile.name,
            email: userProfile.email || '',
            source: 'facebook_profile',
            url: userProfile.link || '',
            facebookId: userProfile.id || '',
            createdAt: new Date(),
            updatedAt: new Date()
          });
          await contact.save();
          insertedCount++;
          console.log(`Added Facebook profile: ${userProfile.name}`);
        }
      } catch (error) {
        console.error('Error importing user profile:', error.message);
      }
    }
    
    // Fetch friends who also use the app
    try {
      console.log('Fetching Facebook friends...');
      const friendsResponse = await axios.get('https://graph.facebook.com/v18.0/me/friends', {
        params: {
          fields: 'id,name,link',
          limit: 5000,
          access_token: accessToken
        },
        timeout: 15000
      });
      
      const friends = friendsResponse.data.data || [];
      console.log(`Found ${friends.length} Facebook friends who use the app`);
      
      // Process each friend with error handling
      for (const friend of friends) {
        try {
          // Get friend's profile picture with timeout
          const pictureResponse = await axios.get(`https://graph.facebook.com/v18.0/${friend.id}/picture`, {
            params: {
              type: 'large',
              redirect: 0,
              access_token: accessToken
            },
            timeout: 5000
          });
          
          const pictureUrl = pictureResponse.data?.data?.url;
          
          // Check if friend already exists
          const existingFriend = await Contact.findOne({ 
            name: { $regex: new RegExp(`^${friend.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
          });
          
          if (!existingFriend) {
            const contact = new Contact({
              name: friend.name,
              source: 'facebook_friend',
              url: friend.link || `https://www.facebook.com/${friend.id}`,
              profileImageUrl: pictureUrl,
              facebookId: friend.id,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            await contact.save();
            insertedCount++;
            friendsCount++;
            console.log(`Added Facebook friend: ${friend.name}`);
          }
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (friendError) {
          console.error(`Error processing friend ${friend.name}:`, friendError.message);
          // Continue with next friend
        }
      }
      
    } catch (friendsError) {
      console.log('Facebook friends fetch failed (normal for non-approved apps):', friendsError.message);
    }
    
    const totalContacts = await safeDbOperation(
      async () => await Contact.countDocuments(),
      0
    );
    
    console.log(`=== Facebook Import Complete ===`);
    console.log(`User profile: ${userProfile ? 1 : 0}`);
    console.log(`Friends imported: ${friendsCount}`);
    console.log(`Total inserted: ${insertedCount}`);
    console.log(`Total contacts in DB: ${totalContacts}`);
    
    let message;
    if (insertedCount > 0) {
      if (friendsCount > 0) {
        message = `✅ Successfully imported your profile and ${friendsCount} friends from Facebook!`;
      } else {
        message = `✅ Successfully imported your Facebook profile! (No friends available - they need to use this app too)`;
      }
    } else {
      message = `ℹ️ Your Facebook data is already in the system.`;
    }
    
    return {
      count: insertedCount,
      friendsCount,
      totalContacts,
      message
    };
    
  } catch (error) {
    console.error('Facebook import error:', error);
    throw error;
  }
}

// OAuth Authentication Endpoints for LinkedIn, Gmail, and Facebook

// LinkedIn OAuth callback endpoint  
app.post('/api/auth/linkedin/callback', async (req, res) => {
  try {
    const { code, state } = req.body;
    const clientId = process.env.LINKEDIN_CLIENT_ID || '86kchs3lw5f7ls';
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    
    if (!clientSecret) {
      return res.status(500).json({ error: 'LinkedIn client secret not configured' });
    }
    
    // Exchange code for access token
    const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', {
      grant_type: 'authorization_code',
      code,
      redirect_uri: req.body.redirect_uri,
      client_id: clientId,
      client_secret: clientSecret
    });
    
    const accessToken = tokenResponse.data.access_token;
    
    // Get user profile
    const profileResponse = await axios.get('https://api.linkedin.com/v2/people/~', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    res.json({
      success: true,
      access_token: accessToken,
      profile: profileResponse.data
    });
    
  } catch (error) {
    console.error('LinkedIn callback error:', error);
    res.status(500).json({ error: 'LinkedIn authentication failed' });
  }
});

// Gmail/Google OAuth callback endpoint
app.post('/api/auth/gmail/callback', async (req, res) => {
  try {
    const { code, state } = req.body;
    const clientId = process.env.GOOGLE_CLIENT_ID || '1084785301012-n7igtqj3b92tg2qe8nf5md81k9cr8osc.apps.googleusercontent.com';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    if (!clientSecret) {
      return res.status(500).json({ error: 'Google client secret not configured' });
    }
    
    // Exchange code for access token
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: req.body.redirect_uri,
      grant_type: 'authorization_code'
    });
    
    const accessToken = tokenResponse.data.access_token;
    
    // Get user profile
    const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    res.json({
      success: true,
      access_token: accessToken,
      profile: profileResponse.data
    });
    
  } catch (error) {
    console.error('Gmail callback error:', error);
    res.status(500).json({ error: 'Gmail authentication failed' });
  }
});

// Import contacts from authenticated OAuth services
app.post('/api/import/oauth-contacts', async (req, res) => {
  try {
    const { service, access_token, userId } = req.body;
    
    if (!access_token) {
      return res.status(400).json({ error: 'Access token required' });
    }
    
    let contacts = [];
    
    if (service === 'linkedin') {
      // Import LinkedIn profile (connections require special permissions)
      const connectionsResponse = await axios.get('https://api.linkedin.com/v2/people/~', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      
      contacts = [{
        name: `${connectionsResponse.data.firstName?.localized?.en_US || ''} ${connectionsResponse.data.lastName?.localized?.en_US || ''}`,
        company: '',
        jobTitle: '',
        location: '',
        email: '',
        linkedinId: connectionsResponse.data.id,
        source: 'linkedin_oauth'
      }];
      
    } else if (service === 'gmail') {
      // Import Google contacts
      const contactsResponse = await axios.get('https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,organizations', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      
      contacts = contactsResponse.data.connections?.map(contact => ({
        name: contact.names?.[0]?.displayName || '',
        company: contact.organizations?.[0]?.name || '',
        jobTitle: contact.organizations?.[0]?.title || '',
        location: '',
        email: contact.emailAddresses?.[0]?.value || '',
        source: 'gmail_oauth'
      })) || [];
    }
    
    // Save contacts to database with ultra-reliable error handling
    const result = await safeDbOperation(async () => {
      let inserted = 0, updated = 0, skipped = 0;
      
      for (const contactData of contacts) {
        try {
          const existingContact = await Contact.findOne({
            $or: [
              { email: contactData.email },
              { name: contactData.name, company: contactData.company }
            ]
          });
          
          if (existingContact) {
            // Update existing contact
            Object.assign(existingContact, contactData);
            await existingContact.save();
            updated++;
          } else {
            // Create new contact
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
    }, { inserted: 0, updated: 0, skipped: contacts.length });
    
    res.json({
      success: true,
      message: `${service} import completed`,
      inserted: result.inserted,
      updated: result.updated,
      skipped: result.skipped,
      total: contacts.length
    });
    
  } catch (error) {
    console.error('OAuth contacts import error:', error);
    res.status(500).json({ 
      error: 'Failed to import contacts',
      message: error.message 
    });
  }
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  gracefulShutdown();
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully');
  gracefulShutdown();
});

function gracefulShutdown() {
  if (mongoose.connection.readyState === 1) {
    mongoose.connection.close(() => {
      console.log('✅ MongoDB connection closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

// Start server with error handling
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 BeeTagged Ultra-Reliable Server running on port ${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️ Database: ${isDbConnected ? 'Connected' : 'Initializing...'}`);
  console.log(`⚡ Features: Natural Search, LinkedIn Import, Facebook Integration, Duplicate Detection`);
  console.log(`🔧 Version: 2.1.0 - Ultra-Reliable Edition`);
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

module.exports = app;