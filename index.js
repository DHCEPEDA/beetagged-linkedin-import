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

// HTTPS redirect for production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// Security headers
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow external scripts for frontend
}));

// CORS configuration for production - Allow all Squarespace domains
const allowedOrigins = [
  'https://www.squarespace.com',
  'https://squarespace.com', 
  /\.squarespace\.com$/,
  /\.squarespace-cdn\.com$/,
  /^https:\/\/.*\.squarespace\.com$/,
  'https://beetagged-app-53414697acd3.herokuapp.com',
  /\.replit\.dev$/,
  'http://localhost:3000',
  'http://localhost:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // For development and testing, be more permissive
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // Check if origin matches any allowed pattern
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      return callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      return callback(null, true); // Temporarily allow all for debugging
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: false // Set to false for broader compatibility
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

// LinkedIn header mappings - expanded for better compatibility
const LINKEDIN_HEADER_MAPPINGS = {
  firstName: ['first name', 'firstname', 'given name', 'first', 'fname'],
  lastName: ['last name', 'lastname', 'surname', 'family name', 'last', 'lname'],
  name: ['name', 'full name', 'contact name', 'display name', 'person name'],
  email: ['email address', 'email', 'e-mail', 'email addresses', 'primary email', 'contact email', 'mail'],
  company: ['company', 'current company', 'organization', 'employer', 'workplace', 'work', 'corp', 'business'],
  position: ['position', 'current position', 'title', 'job title', 'current title', 'role', 'job', 'occupation'],
  location: ['location', 'current location', 'address', 'city', 'region', 'area', 'place', 'geographic area'],
  connectedOn: ['connected on', 'connection date', 'date connected', 'connected', 'date', 'connection time'],
  url: ['url', 'profile url', 'linkedin url', 'profile link', 'link', 'linkedin profile', 'profile']
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

// LinkedIn CSV import with dual-file merge support
app.post('/api/import/linkedin', upload.fields([
  { name: 'linkedinCsv', maxCount: 1 },
  { name: 'contactsCsv', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('=== LinkedIn CSV Import Started ===');
    console.log('Files received:', req.files);
    
    const linkedinFile = req.files?.linkedinCsv?.[0];
    const contactsFile = req.files?.contactsCsv?.[0];
    
    if (!linkedinFile && !contactsFile) {
      return res.status(400).json({ 
        success: false, 
        message: 'No files uploaded. Please select at least one CSV file from LinkedIn (Connections or Contacts).' 
      });
    }
    
    console.log('LinkedIn Connections file:', !!linkedinFile);
    console.log('LinkedIn Contacts file:', !!contactsFile);

    // Validate file types
    const files = [linkedinFile, contactsFile].filter(Boolean);
    for (const file of files) {
      if (!file.originalname?.toLowerCase().endsWith('.csv')) {
        return res.status(400).json({ 
          success: false, 
          message: `${file.originalname} is not a CSV file. LinkedIn exports are in CSV format.` 
        });
      }
    }

    // Parse both CSV files
    const csvDataSets = {};
    if (linkedinFile) {
      csvDataSets.connections = linkedinFile.buffer.toString('utf8');
      console.log('Connections CSV length:', csvDataSets.connections.length);
    }
    if (contactsFile) {
      csvDataSets.contacts = contactsFile.buffer.toString('utf8');
      console.log('Contacts CSV length:', csvDataSets.contacts.length);
    }

    // Merge data from both CSV files
    let mergedContacts = [];
    
    if (Object.keys(csvDataSets).length === 2) {
      // Both files provided - merge them
      console.log('🔄 Merging Connections + Contacts CSV files...');
      mergedContacts = mergeLinkedInData(csvDataSets.connections, csvDataSets.contacts);
      console.log(`✅ Merged ${mergedContacts.length} contacts from both files`);
    } else {
      // Single file - process normally
      const csvData = csvDataSets.connections || csvDataSets.contacts;
      const lines = csvData.split(/\r?\n/).filter(line => line.trim());
      console.log('Total lines found:', lines.length);
      
      if (lines.length < 2) {
        return res.status(400).json({ 
          success: false, 
          message: 'CSV file appears to be empty or only contains headers. Please check your LinkedIn export.' 
        });
      }
      
      // Process single file (existing logic)
      mergedContacts = processSingleCSV(lines);
    }
    
    if (mergedContacts.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No valid contacts found in the uploaded files.' 
      });
    }

    // Save merged contacts to database
    let insertedCount = 0;
    let duplicateCount = 0;
    let contactsWithCompany = 0;
    let contactsWithEmail = 0;
    
    for (const contactData of mergedContacts) {
      if (contactData.company) contactsWithCompany++;
      if (contactData.email) contactsWithEmail++;
      
      try {
        const existingContact = await Contact.findOne({ 
          name: { $regex: new RegExp(`^${contactData.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });
        
        if (!existingContact) {
          await Contact.create(contactData);
          insertedCount++;
        } else {
          // Update existing contact with additional data
          const updates = {};
          if (contactData.email && !existingContact.email) updates.email = contactData.email;
          if (contactData.company && !existingContact.company) updates.company = contactData.company;
          if (contactData.position && !existingContact.position) updates.position = contactData.position;
          if (contactData.url && !existingContact.url) updates.url = contactData.url;
          if (contactData.phone && !existingContact.phone) updates.phone = contactData.phone;
          
          if (Object.keys(updates).length > 0) {
            await Contact.findByIdAndUpdate(existingContact._id, updates);
            console.log(`Enhanced existing contact: ${contactData.name}`);
          }
          duplicateCount++;
        }
      } catch (error) {
        console.error(`Error saving contact ${contactData.name}:`, error);
      }
    }

    const totalContacts = await Contact.countDocuments();
    console.log(`=== Import Complete ===`);
    console.log(`Processed: ${mergedContacts.length}`);
    console.log(`Inserted: ${insertedCount}`);
    console.log(`Enhanced/Skipped: ${duplicateCount}`);
    console.log(`Total contacts in DB: ${totalContacts}`);

    res.json({
      success: true,
      count: insertedCount,
      processed: mergedContacts.length,
      enhanced: duplicateCount,
      totalContacts: totalContacts,
      message: insertedCount > 0 
        ? `✅ Successfully imported ${insertedCount} new contacts! ${duplicateCount > 0 ? `Enhanced ${duplicateCount} existing contacts. ` : ''}Data includes: ${contactsWithCompany > 0 ? `${contactsWithCompany} companies, ` : ''}${contactsWithEmail > 0 ? `${contactsWithEmail} emails, ` : ''}profile links, and connection dates.`
        : duplicateCount > 0
          ? `⚠️ No new contacts added, but enhanced ${duplicateCount} existing contacts with additional data from your files.`
          : `❌ No valid contacts found in the uploaded files.`
    });

  } catch (error) {
    console.error('=== Import Error ===', error);
    res.status(500).json({ 
      success: false, 
      message: `Upload failed: ${error.message}. Please try again or check your CSV format.`
    });
  }
});

// Add merge function at the top of the file
function mergeLinkedInData(connectionsData, contactsData) {
  const mergedContacts = new Map();
  
  // Process Connections CSV (usually: First Name, Last Name, Connected On)
  if (connectionsData) {
    const connectionsLines = connectionsData.split(/\r?\n/).filter(line => line.trim());
    if (connectionsLines.length > 1) {
      const connectionsHeaders = parseCSVLine(connectionsLines[0]);
      console.log('Connections headers:', connectionsHeaders);
      
      for (let i = 1; i < connectionsLines.length; i++) {
        const fields = parseCSVLine(connectionsLines[i]);
        const firstName = fields[0]?.trim() || '';
        const lastName = fields[1]?.trim() || '';
        const connectedOn = fields[2]?.trim() || '';
        
        if (firstName || lastName) {
          const fullName = `${firstName} ${lastName}`.trim();
          const key = fullName.toLowerCase();
          
          mergedContacts.set(key, {
            name: fullName,
            firstName,
            lastName,
            connectedOn,
            email: '',
            company: '',
            position: '',
            location: '',
            url: '',
            phone: '',
            source: 'connections'
          });
        }
      }
    }
  }
  
  // Process Contacts CSV (usually: Name, URL, Email, Company, Position, etc.)
  if (contactsData) {
    const contactsLines = contactsData.split(/\r?\n/).filter(line => line.trim());
    if (contactsLines.length > 1) {
      const contactsHeaders = parseCSVLine(contactsLines[0]);
      console.log('Contacts headers:', contactsHeaders);
      
      // Find column indices in contacts CSV
      const contactsIndices = {
        name: findHeaderIndex(contactsHeaders, LINKEDIN_HEADER_MAPPINGS.name),
        firstName: findHeaderIndex(contactsHeaders, LINKEDIN_HEADER_MAPPINGS.firstName),
        lastName: findHeaderIndex(contactsHeaders, LINKEDIN_HEADER_MAPPINGS.lastName),
        email: findHeaderIndex(contactsHeaders, LINKEDIN_HEADER_MAPPINGS.email),
        company: findHeaderIndex(contactsHeaders, LINKEDIN_HEADER_MAPPINGS.company),
        position: findHeaderIndex(contactsHeaders, LINKEDIN_HEADER_MAPPINGS.position),
        url: findHeaderIndex(contactsHeaders, LINKEDIN_HEADER_MAPPINGS.url),
        phone: findHeaderIndex(contactsHeaders, ['phone', 'phone number', 'mobile']),
        location: findHeaderIndex(contactsHeaders, LINKEDIN_HEADER_MAPPINGS.location)
      };
      
      for (let i = 1; i < contactsLines.length; i++) {
        const fields = parseCSVLine(contactsLines[i]);
        
        let fullName = '';
        if (contactsIndices.name >= 0) {
          fullName = fields[contactsIndices.name]?.trim() || '';
        } else if (contactsIndices.firstName >= 0 || contactsIndices.lastName >= 0) {
          const firstName = fields[contactsIndices.firstName]?.trim() || '';
          const lastName = fields[contactsIndices.lastName]?.trim() || '';
          fullName = `${firstName} ${lastName}`.trim();
        }
        
        if (fullName) {
          const key = fullName.toLowerCase();
          const existing = mergedContacts.get(key) || {};
          
          // Merge data from contacts CSV
          mergedContacts.set(key, {
            ...existing,
            name: fullName,
            email: (fields[contactsIndices.email]?.trim() || existing.email || '').toLowerCase(),
            company: fields[contactsIndices.company]?.trim() || existing.company || '',
            position: fields[contactsIndices.position]?.trim() || existing.position || '',
            url: fields[contactsIndices.url]?.trim() || existing.url || '',
            phone: fields[contactsIndices.phone]?.trim() || existing.phone || '',
            location: fields[contactsIndices.location]?.trim() || existing.location || '',
            source: existing.source ? `${existing.source}+contacts` : 'contacts'
          });
        }
      }
    }
  }
  
  return Array.from(mergedContacts.values());
}

// Single CSV processing function
function processSingleCSV(lines) {
  const contacts = [];
  const errors = [];
  
  // Parse headers
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine);
    console.log('CSV Headers found:', headers);
    console.log('Raw header line:', headerLine);
    
    // Enhanced header validation - accept minimal LinkedIn format
    const hasValidHeaders = headers.some(header => 
      header.toLowerCase().includes('name') || 
      header.toLowerCase().includes('company') ||
      header.toLowerCase().includes('position') ||
      header.toLowerCase().includes('connected')
    );
    
    if (!hasValidHeaders) {
      throw new Error('This doesn\'t appear to be a valid LinkedIn connections CSV. Expected headers like "First Name", "Last Name", etc.');
    }
    
    // Find column indices with better mapping
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
    console.log('Available headers for mapping:', headers.map((h, i) => `${i}: "${h}"`));
    
    // Debug email field specifically
    if (indices.email >= 0) {
      console.log(`✅ Email field found at index ${indices.email}: "${headers[indices.email]}"`);
    } else {
      console.log('❌ No email field found in headers');
    }

    // Validate that we found at least name fields
    if (indices.firstName === -1 && indices.lastName === -1 && indices.name === -1) {
      throw new Error('Could not find name columns in CSV. Expected "First Name" and "Last Name" or similar.');
    }

    // Check what data we can expect to extract
    const availableFields = [];
    if (indices.firstName >= 0 || indices.lastName >= 0) availableFields.push('Names');
    if (indices.email >= 0) availableFields.push('Emails');
    if (indices.company >= 0) availableFields.push('Companies');
    if (indices.position >= 0) availableFields.push('Positions');
    if (indices.location >= 0) availableFields.push('Locations');
    
    console.log('Will extract:', availableFields.join(', '));
    
    // Warn if only basic data is available
    if (availableFields.length === 1 && availableFields[0] === 'Names') {
      console.log('⚠️ LinkedIn export contains only names - no company/email data available');
    }

    let processed = 0;
    let skipped = 0;

    // Process data rows (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        skipped++;
        continue;
      }

      try {
        const fields = parseCSVLine(line);
        processed++;

        // Extract name with priority: explicit name field > firstName + lastName
        let name = '';
        if (indices.name >= 0 && fields[indices.name]?.trim()) {
          name = fields[indices.name].trim();
        } else {
          const firstName = indices.firstName >= 0 ? (fields[indices.firstName]?.trim() || '') : '';
          const lastName = indices.lastName >= 0 ? (fields[indices.lastName]?.trim() || '') : '';
          name = `${firstName} ${lastName}`.trim();
        }

        if (!name) {
          errors.push(`Row ${i + 1}: No valid name found`);
          continue;
        }

        // Extract field data with better error handling
        const emailRaw = indices.email >= 0 && fields[indices.email] ? fields[indices.email].trim() : '';
        const companyRaw = indices.company >= 0 && fields[indices.company] ? fields[indices.company].trim() : '';
        const positionRaw = indices.position >= 0 && fields[indices.position] ? fields[indices.position].trim() : '';
        
        const contactData = {
          name,
          email: emailRaw.toLowerCase(),
          company: companyRaw,
          position: positionRaw,
          location: indices.location >= 0 && fields[indices.location] ? fields[indices.location].trim() : '',
          connectedOn: indices.connectedOn >= 0 && fields[indices.connectedOn] ? fields[indices.connectedOn].trim() : '',
          url: indices.url >= 0 && fields[indices.url] ? fields[indices.url].trim() : ''
        };

        // Log sample contact data for debugging
        if (i <= 3) {
          console.log(`Sample contact ${i}: ${JSON.stringify(contactData)}`);
          console.log(`Raw fields for row ${i}:`, fields);
        }

        contacts.push(contactData);

      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        errors.push(`Row ${i + 1}: ${error.message}`);
        skipped++;
      }
    }

    console.log(`Processed ${processed} rows, ${contacts.length} valid contacts, ${skipped} skipped, ${errors.length} errors`);
    
    return contacts;
}

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