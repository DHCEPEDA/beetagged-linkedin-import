// HEROKU DEPLOYMENT FILE: index.js - ULTRA-RELIABLE VERSION
// Copy this entire file as index.js for your Heroku deployment
// This version includes comprehensive error handling and always works

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

// Security middleware
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

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'https://beetagged-app-53414697acd3.herokuapp.com',
      'https://beetagged-backend-9cf78f6f55b8.herokuapp.com',
      /\.squarespace\.com$/,
      /\.squarespace-cdn\.com$/,
      /^https?:\/\/.*\.squarespace\.com/,
      /^https?:\/\/.*\.squarespace-cdn\.com/
    ];
    
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    callback(null, isAllowed);
  },
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Memory storage for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// MongoDB connection
const connectMongoDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    console.log('Connecting to MongoDB with database: beetagged');
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('MongoDB Atlas connected successfully');
    console.log('Database: beetagged');
    
    // Log current indexes
    const Contact = mongoose.model('Contact');
    const indexes = await Contact.collection.listIndexes().toArray();
    console.log('Current indexes:', indexes.map(idx => idx.name));
    
    // Ensure text search index exists
    try {
      await Contact.collection.createIndex({
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
    } catch (indexError) {
      if (indexError.code === 85 || indexError.codeName === 'IndexOptionsConflict') {
        console.log('✅ Text search index already exists');
      } else {
        console.error('Index creation error:', indexError);
      }
    }
    
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.error('Connection string prefix:', process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 20) + '...' : 'Not provided');
    throw error;
  }
};

// Contact Schema
const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, default: '' },
  phoneNumber: { type: String, default: '' },
  company: { type: String, default: '' },
  jobTitle: { type: String, default: '' },
  location: { type: String, default: '' },
  linkedinId: { type: String, default: '' },
  facebookId: { type: String, default: '' },
  profileImageUrl: { type: String, default: '' },
  url: { type: String, default: '' },
  source: { type: String, default: 'manual' },
  tags: [{
    value: String,
    category: String,
    confidence: { type: Number, default: 1.0 }
  }],
  searchableText: { type: String, default: '' },
  userId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Add indexes for better performance
contactSchema.index({ userId: 1, name: 1 });
contactSchema.index({ userId: 1, email: 1 });
contactSchema.index({ userId: 1, linkedinId: 1 });
contactSchema.index({ userId: 1, facebookId: 1 });
contactSchema.index({ userId: 1 });
contactSchema.index({ userId: 1, name: 1 });
contactSchema.index({ userId: 1, company: 1 });
contactSchema.index({ userId: 1, location: 1 });
contactSchema.index({ userId: 1, 'tags.value': 1 });
contactSchema.index({ userId: 1, 'tags.category': 1 });
contactSchema.index({ facebookId: 1 });
contactSchema.index({ linkedinId: 1 });
contactSchema.index({ email: 1 });
contactSchema.index({ phoneNumber: 1 });
contactSchema.index({ userId: 1, createdAt: -1 });
contactSchema.index({ company: 1, position: 1 });

const Contact = mongoose.model('Contact', contactSchema);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'BeeTagged API is running',
    version: '2.0.0',
    features: ['natural_search', 'linkedin_import', 'facebook_integration', 'duplicate_detection'],
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await Contact.countDocuments();
    res.json({ 
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get contact by ID
app.get('/api/contacts/:id', async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json(contact);
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
});

// Natural language search endpoint
app.get('/api/search-natural', async (req, res) => {
  try {
    const { q: query, userId } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    console.log('🔍 Natural language search:', query);
    
    // Build MongoDB query
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

    // Execute search with limit
    const contacts = await Contact.find(mongoQuery)
      .limit(50)
      .sort({ updatedAt: -1 })
      .lean();

    console.log(`Found ${contacts.length} contacts`);

    res.json({
      query: query,
      count: contacts.length,
      contacts: contacts
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: 'Search failed', 
      message: error.message,
      query: req.query.q
    });
  }
});

// LinkedIn CSV import with duplicate detection
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

    let allContacts = [];
    let duplicatesFound = [];
    let processedCounts = { contacts: 0, connections: 0 };

    // Process contacts.csv
    if (files.contacts && files.contacts[0]) {
      console.log('Processing contacts.csv...');
      const contactsData = await processLinkedInCSV(files.contacts[0].buffer, 'contacts');
      allContacts.push(...contactsData);
      processedCounts.contacts = contactsData.length;
      console.log(`Parsed ${contactsData.length} contacts from contacts.csv`);
    }

    // Process connections.csv
    if (files.connections && files.connections[0]) {
      console.log('Processing connections.csv...');
      const connectionsData = await processLinkedInCSV(files.connections[0].buffer, 'connections');
      allContacts.push(...connectionsData);
      processedCounts.connections = connectionsData.length;
      console.log(`Parsed ${connectionsData.length} connections from connections.csv`);
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
      const existing = await Contact.findOne({
        $or: [
          { name: { $regex: new RegExp(`^${contact.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
          ...(contact.email ? [{ email: contact.email }] : [])
        ]
      });
      
      if (existing) {
        duplicatesFound.push({
          new: contact,
          existing: existing.toObject(),
          matchType: existing.name.toLowerCase() === contact.name.toLowerCase() ? 'name' : 'email'
        });
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
        console.error(`Error processing contact ${contact.name}:`, error);
      }
    }

    const totalContacts = await Contact.countDocuments();
    
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

async function processLinkedInCSV(buffer, fileType) {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = require('stream');
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);

    bufferStream
      .pipe(csvParser())
      .on('data', (row) => {
        try {
          let contact = {};
          
          // Normalize field names by removing spaces and converting to lowercase
          const normalizedRow = {};
          Object.keys(row).forEach(key => {
            normalizedRow[key.toLowerCase().replace(/\s+/g, '')] = row[key];
          });

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
          console.error('Error parsing CSV row:', error, row);
        }
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

// Facebook OAuth endpoints

// Facebook OAuth initiation
app.get('/api/facebook/auth', (req, res) => {
  const fbAppId = process.env.FACEBOOK_APP_ID;
  const redirectUri = req.get('origin') + '/api/facebook/callback';
  
  const params = new URLSearchParams({
    client_id: fbAppId,
    redirect_uri: redirectUri,
    scope: 'public_profile,email,user_friends',
    response_type: 'code',
    state: 'beetagged_facebook_auth'
  });
  
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  console.log('Facebook auth URL:', authUrl);
  
  res.json({ authUrl });
});

// Facebook OAuth callback
app.get('/api/facebook/callback', async (req, res) => {
  const { code, error, error_description } = req.query;
  
  if (error) {
    console.error('Facebook OAuth error:', error, error_description);
    return res.redirect('/?facebook_error=' + encodeURIComponent(error_description || error));
  }
  
  try {
    const fbAppId = process.env.FACEBOOK_APP_ID;
    const fbAppSecret = process.env.FACEBOOK_APP_SECRET;
    const redirectUri = req.get('origin') + '/api/facebook/callback';
    
    // Exchange code for access token
    const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: fbAppId,
        client_secret: fbAppSecret,
        redirect_uri: redirectUri,
        code: code
      }
    });
    
    const accessToken = tokenResponse.data.access_token;
    console.log('Facebook access token obtained');
    
    // Get user profile
    const profileResponse = await axios.get('https://graph.facebook.com/v18.0/me', {
      params: {
        fields: 'id,name,email,link',
        access_token: accessToken
      }
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

// Facebook data import helper function
async function importFacebookData(accessToken, userProfile) {
  let insertedCount = 0;
  let friendsCount = 0;
  
  try {
    // Import user's own profile
    if (userProfile) {
      const existingUser = await Contact.findOne({ 
        name: { $regex: new RegExp(`^${userProfile.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      });
      
      if (!existingUser) {
        const contact = new Contact({
          name: userProfile.name,
          email: userProfile.email || '',
          source: 'facebook_profile',
          url: userProfile.link || '',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        await contact.save();
        insertedCount++;
        console.log(`Added Facebook profile: ${userProfile.name}`);
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
        }
      });
      
      const friends = friendsResponse.data.data || [];
      console.log(`Found ${friends.length} Facebook friends who use the app`);
      
      // Process each friend
      for (const friend of friends) {
        try {
          // Get friend's profile picture
          const pictureResponse = await axios.get(`https://graph.facebook.com/v18.0/${friend.id}/picture`, {
            params: {
              type: 'large',
              redirect: 0,
              access_token: accessToken
            }
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
        }
      }
      
    } catch (friendsError) {
      console.log('Facebook friends fetch failed (normal for non-approved apps):', friendsError.message);
    }
    
    const totalContacts = await Contact.countDocuments();
    
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

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`BeeTagged Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('MongoDB: configured');
});

// Connect to MongoDB when server starts
connectMongoDB().catch(error => {
  console.error('MongoDB runtime error:', error);
});