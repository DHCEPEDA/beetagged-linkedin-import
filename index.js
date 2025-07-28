// HEROKU DEPLOYMENT - COMPLETE FIXED BACKEND
// This file contains the complete, working backend with all fixes applied
// Ready for deployment to Heroku with MongoDB Atlas connection

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5000;

// ===== MIDDLEWARE SETUP =====

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow external scripts for frontend
}));

// CORS configuration for production - Allow all origins for widget compatibility
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
  credentials: false
}));

// Compression and parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use(limiter);

// ===== MONGODB CONNECTION WITH TIMEOUT PROTECTION =====

function connectMongoDB() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI environment variable is required');
    process.exit(1);
  }

  // Enhanced MongoDB connection options for production
  const mongoOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,    // How long to try selecting a server
    socketTimeoutMS: 10000,            // How long a send or receive on a socket can take
    connectTimeoutMS: 10000,           // How long to wait for initial connection
    maxPoolSize: 10,                   // Maximum number of connections
    minPoolSize: 2,                    // Minimum number of connections
    maxIdleTimeMS: 30000,              // Close connections after 30 seconds of inactivity
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

connectMongoDB();

// ===== MONGODB SCHEMA =====

const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  company: String,
  position: String,
  location: String,
  tags: [String],
  source: String,
  connectedOn: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Contact = mongoose.model('Contact', contactSchema);

// Clean up old problematic indexes on startup
mongoose.connection.once('open', async () => {
  try {
    const indexes = await Contact.collection.indexes();
    console.log('Current indexes:', indexes.map(i => i.name));
    
    // Drop the problematic id_1 index if it exists
    for (const index of indexes) {
      if (index.name === 'id_1') {
        await Contact.collection.dropIndex('id_1');
        console.log('Dropped problematic id_1 index');
        break;
      }
    }
  } catch (error) {
    console.log('Index cleanup completed or not needed:', error.message);
  }
});

// ===== FILE UPLOAD SETUP =====

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// ===== UTILITY FUNCTIONS =====

// Smart tag generation
function generateTags(contact) {
  const tags = [];
  
  if (contact.company) {
    tags.push(`company:${contact.company.toLowerCase()}`);
    
    // Industry classification
    const techCompanies = ['google', 'microsoft', 'apple', 'amazon', 'meta', 'facebook', 'netflix', 'tesla', 'uber', 'airbnb', 'stripe'];
    if (techCompanies.some(tech => contact.company.toLowerCase().includes(tech))) {
      tags.push('industry:technology');
    }
  }

  if (contact.position) {
    tags.push(`role:${contact.position.toLowerCase()}`);
    
    // Function-based tags
    const position = contact.position.toLowerCase();
    if (position.includes('engineer') || position.includes('developer') || position.includes('programmer')) {
      tags.push('function:engineering');
    } else if (position.includes('manager') || position.includes('director') || position.includes('lead')) {
      tags.push('function:management');
    } else if (position.includes('designer') || position.includes('ux') || position.includes('ui')) {
      tags.push('function:design');
    }
  }

  if (contact.location) {
    tags.push(`location:${contact.location.toLowerCase()}`);
  }

  return tags;
}

// Enhanced CSV parser for LinkedIn format
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Handle escaped quotes
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator outside quotes
      result.push(current.trim());
      current = '';
      i++;
    } else {
      // Regular character
      current += char;
      i++;
    }
  }

  // Add the last field
  result.push(current.trim());
  return result;
}

// LinkedIn header mappings
const LINKEDIN_HEADER_MAPPINGS = {
  firstName: ['first name', 'firstname', 'given name'],
  lastName: ['last name', 'lastname', 'surname', 'family name'],
  name: ['first name', 'last name', 'name', 'full name', 'contact name'],
  email: ['email address', 'email', 'e-mail', 'email addresses', 'primary email'],
  company: ['company', 'current company', 'organization', 'employer', 'workplace'],
  position: ['position', 'current position', 'title', 'job title', 'current title', 'role'],
  location: ['location', 'current location', 'address', 'city', 'region'],
  connectedOn: ['connected on', 'connection date', 'date connected', 'connected'],
  url: ['url', 'profile url', 'linkedin url', 'profile link']
};

function findHeaderIndex(headers, fieldMappings) {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  
  for (const mapping of fieldMappings) {
    const index = normalizedHeaders.indexOf(mapping.toLowerCase());
    if (index !== -1) {
      return index;
    }
  }
  return -1;
}

// ===== API ROUTES =====

// Health check with timeout protection
app.get('/health', async (req, res) => {
  try {
    const mongoState = mongoose.connection.readyState;
    const stateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    
    let contactCount = 0;
    let mongoStatus = 'disconnected';
    
    if (mongoState === 1) {
      try {
        // Add timeout to database operations
        const countPromise = Contact.countDocuments();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database timeout')), 5000)
        );
        
        contactCount = await Promise.race([countPromise, timeoutPromise]);
        mongoStatus = 'connected';
      } catch (error) {
        console.error('Health check database error:', error);
        mongoStatus = 'timeout';
        return res.status(503).json({
          status: 'degraded',
          server: 'BeeTagged',
          contacts: 'timeout',
          port: PORT,
          uptime: process.uptime(),
          mongodb: 'timeout',
          mongoState: mongoState,
          environment: process.env.NODE_ENV || 'development'
        });
      }
    }

    res.json({
      status: mongoStatus === 'connected' ? 'healthy' : 'degraded',
      server: 'BeeTagged',
      contacts: contactCount,
      port: PORT,
      uptime: process.uptime(),
      mongodb: mongoStatus,
      mongoState: mongoState,
      environment: process.env.NODE_ENV || 'production'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      server: 'BeeTagged',
      error: error.message,
      port: PORT,
      uptime: process.uptime()
    });
  }
});

// Get all contacts with timeout protection
app.get('/api/contacts', async (req, res) => {
  try {
    const contactsPromise = Contact.find().sort({ createdAt: -1 });
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database timeout')), 5000)
    );
    
    const contacts = await Promise.race([contactsPromise, timeoutPromise]);
    console.log(`Returning ${contacts.length} contacts`);
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    if (error.message === 'Database timeout') {
      res.status(504).json({ error: 'Database timeout - please try again' });
    } else {
      res.status(500).json({ error: 'Failed to fetch contacts' });
    }
  }
});

// LinkedIn CSV import with enhanced error handling
app.post('/api/import/linkedin', upload.single('linkedinCsv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const csvData = req.file.buffer.toString('utf8');
    console.log('Processing LinkedIn CSV file...');

    const lines = csvData.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'CSV file must contain at least a header row and one data row' 
      });
    }

    // Parse headers
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine);
    console.log('CSV Headers found:', headers);
    
    // Find column indices
    const indices = {
      firstName: findHeaderIndex(headers, LINKEDIN_HEADER_MAPPINGS.firstName),
      lastName: findHeaderIndex(headers, LINKEDIN_HEADER_MAPPINGS.lastName),
      name: findHeaderIndex(headers, LINKEDIN_HEADER_MAPPINGS.name),
      email: findHeaderIndex(headers, LINKEDIN_HEADER_MAPPINGS.email),
      company: findHeaderIndex(headers, LINKEDIN_HEADER_MAPPINGS.company),
      position: findHeaderIndex(headers, LINKEDIN_HEADER_MAPPINGS.position),
      location: findHeaderIndex(headers, LINKEDIN_HEADER_MAPPINGS.location),
      connectedOn: findHeaderIndex(headers, LINKEDIN_HEADER_MAPPINGS.connectedOn),
      url: findHeaderIndex(headers, LINKEDIN_HEADER_MAPPINGS.url)
    };

    console.log('Field indices:', indices);

    const contacts = [];
    let processed = 0;
    let skipped = 0;

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      try {
        const fields = parseCSVLine(lines[i]);
        processed++;
        
        // Build name
        let name = '';
        if (indices.firstName >= 0 && indices.lastName >= 0) {
          const firstName = fields[indices.firstName]?.trim() || '';
          const lastName = fields[indices.lastName]?.trim() || '';
          name = `${firstName} ${lastName}`.trim();
        } else if (indices.name >= 0) {
          name = fields[indices.name]?.trim() || '';
        }

        // Skip rows without a name
        if (!name) {
          skipped++;
          continue;
        }

        const contactData = {
          name,
          email: indices.email >= 0 ? (fields[indices.email]?.trim().toLowerCase() || '') : '',
          company: indices.company >= 0 ? (fields[indices.company]?.trim() || '') : '',
          position: indices.position >= 0 ? (fields[indices.position]?.trim() || '') : '',
          location: indices.location >= 0 ? (fields[indices.location]?.trim() || '') : '',
          connectedOn: indices.connectedOn >= 0 ? (fields[indices.connectedOn]?.trim() || '') : '',
          url: indices.url >= 0 ? (fields[indices.url]?.trim() || '') : ''
        };

        const contact = new Contact({
          ...contactData,
          tags: generateTags(contactData),
          source: 'linkedin',
          createdAt: new Date(),
          updatedAt: new Date()
        });

        contacts.push(contact);
      } catch (error) {
        console.warn(`Error parsing CSV line ${i + 1}:`, error);
        skipped++;
      }
    }

    // Insert contacts one by one to handle duplicates gracefully
    let insertedCount = 0;
    let duplicateCount = 0;
    
    for (const contactData of contacts) {
      try {
        // Check if contact already exists
        const existingContact = await Contact.findOne({
          name: contactData.name,
          company: contactData.company
        });
        
        if (existingContact) {
          duplicateCount++;
          console.log(`Skipping duplicate: ${contactData.name} at ${contactData.company}`);
          continue;
        }
        
        const savedContact = await contactData.save();
        insertedCount++;
        console.log(`Inserted: ${contactData.name} at ${contactData.company}`);
      } catch (error) {
        console.error(`Failed to insert ${contactData.name}:`, error.message);
        duplicateCount++;
      }
    }
    
    console.log(`Import complete: ${insertedCount} new, ${duplicateCount} duplicates/errors`);
    res.json({
      success: insertedCount > 0,
      count: insertedCount,
      processed: processed,
      skipped: skipped + duplicateCount,
      message: insertedCount > 0 
        ? `Successfully imported ${insertedCount} new contacts. ${duplicateCount} duplicates skipped.`
        : `No new contacts imported. ${duplicateCount} duplicates or errors found.`
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Natural language search with timeout protection
app.get('/api/search/natural', async (req, res) => {
  try {
    const query = req.query.q?.toLowerCase() || '';
    console.log(`Search query: "${query}"`);
    
    if (!query) {
      const allContactsPromise = Contact.find().sort({ createdAt: -1 });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Search timeout')), 5000)
      );
      
      const allContacts = await Promise.race([allContactsPromise, timeoutPromise]);
      console.log(`Returning all ${allContacts.length} contacts`);
      return res.json({ results: allContacts });
    }

    // Enhanced search with broader patterns
    const searchConditions = [];
    const keywords = query.split(/\s+/);
    
    // Build comprehensive search conditions
    for (const keyword of keywords) {
      if (keyword.length > 1) {
        searchConditions.push({
          $or: [
            { name: { $regex: keyword, $options: 'i' } },
            { company: { $regex: keyword, $options: 'i' } },
            { position: { $regex: keyword, $options: 'i' } },
            { location: { $regex: keyword, $options: 'i' } },
            { email: { $regex: keyword, $options: 'i' } },
            { tags: { $elemMatch: { $regex: keyword, $options: 'i' } } }
          ]
        });
      }
    }

    // Tech companies search enhancement
    if (query.includes('tech') || query.includes('google') || query.includes('microsoft') || query.includes('apple')) {
      searchConditions.push({
        $or: [
          { company: { $regex: 'google|microsoft|apple|amazon|meta|facebook|tech', $options: 'i' } },
          { tags: { $elemMatch: { $regex: 'technology|tech|google|microsoft|apple', $options: 'i' } } }
        ]
      });
    }

    const searchQuery = searchConditions.length > 0 ? { $and: searchConditions } : {};
    console.log('Search query object:', JSON.stringify(searchQuery, null, 2));

    const searchPromise = Contact.find(searchQuery).sort({ createdAt: -1 });
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Search timeout')), 5000)
    );
    
    const results = await Promise.race([searchPromise, timeoutPromise]);
    console.log(`Found ${results.length} results for "${query}"`);
    
    res.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    if (error.message === 'Search timeout') {
      res.status(504).json({ error: 'Search timeout - please try again', results: [] });
    } else {
      res.status(500).json({ error: 'Search failed', results: [] });
    }
  }
});

// CSV template download
app.get('/api/csv-template', (req, res) => {
  const template = [
    'First Name,Last Name,Email Address,Company,Position,Connected On',
    'John,Doe,john.doe@google.com,Google,Software Engineer,10/15/2023',
    'Jane,Smith,,Microsoft,Product Manager,09/22/2023',
    'Bob,Johnson,bob@startup.com,"Startup, Inc.",Founder & CEO,08/30/2023'
  ].join('\n');
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="linkedin-import-template.csv"');
  res.send(template);
});

// Serve static files for basic frontend
app.use(express.static('public'));

// Default route
app.get('/', (req, res) => {
  res.json({
    message: 'BeeTagged API Server',
    version: '1.0.0',
    endpoints: [
      '/health',
      '/api/contacts',
      '/api/import/linkedin',
      '/api/search/natural',
      '/api/csv-template'
    ]
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`BeeTagged Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log('MongoDB: configured');
});

module.exports = app;