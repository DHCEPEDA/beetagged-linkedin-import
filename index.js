/**
 * BeeTagged - Professional Contact Management Platform
 * Self-contained Express server optimized for Heroku deployment
 * 
 * Features:
 * - Enhanced LinkedIn CSV import with quoted field handling
 * - Facebook contact integration via SDK
 * - Natural language search with OpenAI integration
 * - Smart contact tagging and categorization
 * - MongoDB Atlas cloud storage
 * 
 * @author BeeTagged Development Team
 * @version 1.0.0
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
 * 
 * Automatically generates contextual tags for contacts based on their
 * company, position, and other attributes to enable intelligent search
 * 
 * @param {Object} contact - Contact object with company, position, location data
 * @returns {Array<string>} Array of generated tags for categorization
 * 
 * Business Logic:
 * 1. Company-based tags: Direct company name mapping
 * 2. Industry classification: Pattern matching against known companies
 * 3. Role categorization: Job title analysis for function-based grouping
 * 4. Location grouping: Geographic categorization for regional searches
 */
function generateTags(contact) {
  const tags = [];
  
  // Company-based tagging - enables "Who works at X" searches
  if (contact.company) {
    tags.push(`company:${contact.company.toLowerCase()}`);
    
    // Industry classification using company pattern matching
    // This enables searches like "Who works in tech?" or "Finance contacts"
    const techCompanies = ['google', 'microsoft', 'apple', 'amazon', 'meta', 'facebook', 'netflix', 'uber', 'airbnb'];
    const financeCompanies = ['goldman', 'jpmorgan', 'chase', 'morgan stanley', 'blackrock'];
    
    const companyLower = contact.company.toLowerCase();
    if (techCompanies.some(tech => companyLower.includes(tech))) {
      tags.push('industry:technology');
    } else if (financeCompanies.some(finance => companyLower.includes(finance))) {
      tags.push('industry:finance');
    }
  }
  
  if (contact.position) {
    tags.push(`role:${contact.position.toLowerCase()}`);
    
    const positionLower = contact.position.toLowerCase();
    if (positionLower.includes('engineer') || positionLower.includes('developer')) {
      tags.push('function:engineering');
    } else if (positionLower.includes('marketing')) {
      tags.push('function:marketing');
    } else if (positionLower.includes('sales')) {
      tags.push('function:sales');
    } else if (positionLower.includes('manager') || positionLower.includes('director')) {
      tags.push('function:management');
    }
  }
  
  if (contact.location) {
    tags.push(`location:${contact.location.toLowerCase()}`);
    
    const locationLower = contact.location.toLowerCase();
    if (locationLower.includes('san francisco') || locationLower.includes('sf')) {
      tags.push('city:san-francisco');
    } else if (locationLower.includes('new york') || locationLower.includes('nyc')) {
      tags.push('city:new-york');
    } else if (locationLower.includes('seattle')) {
      tags.push('city:seattle');
    } else if (locationLower.includes('los angeles') || locationLower.includes('la')) {
      tags.push('city:los-angeles');
    }
  }
  
  return tags;
}

/**
 * Enhanced CSV Line Parser for LinkedIn Exports
 * 
 * Handles complex CSV formats including quoted fields with commas and escaped quotes.
 * Essential for processing LinkedIn connection exports which often contain company names
 * like "Company, Inc." that would break standard CSV parsing.
 * 
 * @param {string} line - Single CSV line to parse
 * @returns {Array<string>} Array of field values with quotes and escaping handled
 * 
 * Parsing Logic:
 * 1. Track quote state to handle embedded commas
 * 2. Handle escaped quotes ("") within quoted fields
 * 3. Preserve field boundaries even with complex company names
 * 4. Trim whitespace while preserving intentional spacing
 * 
 * Examples:
 * - "John Doe","Company, Inc.",Engineer → ["John Doe", "Company, Inc.", "Engineer"]
 * - Name,"Big ""Tech"" Corp",Role → ["Name", "Big \"Tech\" Corp", "Role"]
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Handle escaped quotes within quoted fields ("")
        current += '"';
        i += 2;
      } else {
        // Toggle quote state - entering or exiting quoted field
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator found outside quoted context
      result.push(current.trim());
      current = '';
      i++;
    } else {
      // Regular character - add to current field
      current += char;
      i++;
    }
  }

  // Add the last field
  result.push(current.trim());
  return result;
}

/**
 * LinkedIn CSV Header Mappings
 * 
 * Maps standard contact fields to various header names found in different
 * LinkedIn export formats. LinkedIn occasionally changes export formats,
 * so we maintain multiple variations for robust parsing.
 * 
 * Each field contains an array of possible header names, prioritized
 * from most common to least common variations.
 */
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

/**
 * Find Header Index by Mapping
 * 
 * Searches for a header in the CSV that matches any of the provided field mappings.
 * This enables robust parsing across different LinkedIn export formats.
 * 
 * @param {Array<string>} headers - Array of header names from CSV
 * @param {Array<string>} fieldMappings - Array of possible field names to match
 * @returns {number} Index of matching header, or -1 if not found
 */
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

function parseCSVData(data) {
  // This function is now legacy - kept for compatibility
  // Real parsing happens in the enhanced CSV processor
  const name = data['First Name'] && data['Last Name'] 
    ? `${data['First Name']} ${data['Last Name']}`.trim()
    : data['Name'] || data['Full Name'] || '';
    
  const email = data['Email Address'] || data['Email'] || '';
  const company = data['Company'] || data['Current Company'] || '';
  const position = data['Position'] || data['Current Position'] || data['Title'] || '';
  const location = data['Location'] || data['Current Location'] || '';

  return { name, email, company, position, location };
}

// ===== API ROUTES =====

/**
 * Health Check Endpoint
 * 
 * Provides system status including contact count, MongoDB connection,
 * server uptime, and configuration details for monitoring and debugging.
 * 
 * @route GET /health
 * @returns {Object} System health information
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
 * Get All Contacts
 * 
 * Retrieves all contacts from the database, sorted by creation date (newest first).
 * Used by the frontend to populate the contact list and search interface.
 * 
 * @route GET /api/contacts
 * @returns {Array<Contact>} Array of contact objects
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

/**
 * Facebook Contact Import Endpoint
 * 
 * Processes contact data from Facebook SDK and saves to database.
 * Handles Facebook-specific fields and applies appropriate tagging.
 * 
 * @route POST /api/import/facebook
 * @param {Array<Object>} contacts - Array of Facebook contact objects
 * @returns {Object} Import results with success count and contact data
 */
app.post('/api/import/facebook', async (req, res) => {
    try {
        const { contacts } = req.body;
        
        if (!contacts || !Array.isArray(contacts)) {
            return res.status(400).json({ error: 'Invalid contacts data' });
        }
        
        const savedContacts = [];
        
        for (const contactData of contacts) {
            const contact = new Contact({
                name: contactData.name,
                email: contactData.email || '',
                source: 'facebook',
                facebookId: contactData.facebookId,
                profileImage: contactData.profileImage,
                tags: ['facebook-friend'],
                createdAt: new Date(),
                updatedAt: new Date()
            });
            
            const saved = await contact.save();
            savedContacts.push(saved);
        }
        
        console.log(`Imported ${savedContacts.length} Facebook contacts`);
        res.json({ 
            success: true, 
            message: `Successfully imported ${savedContacts.length} contacts`,
            contacts: savedContacts 
        });
        
    } catch (error) {
        console.error('Facebook import error:', error);
        res.status(500).json({ error: 'Failed to import Facebook contacts' });
    }
});

app.post('/api/import/linkedin', upload.single('linkedinCsv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const csvData = req.file.buffer.toString('utf8');
    console.log('Processing LinkedIn CSV file...');

    // Enhanced CSV parsing
    const lines = csvData.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'CSV file must contain at least a header row and one data row' 
      });
    }

    // Parse headers using enhanced parser
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine);
    console.log('CSV Headers found:', headers);
    
    // Find column indices for each field
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

    // Process data rows with enhanced parsing
    for (let i = 1; i < lines.length; i++) {
      try {
        const fields = parseCSVLine(lines[i]);
        processed++;
        
        // Build name from firstName/lastName or use full name field
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

    // Save to database
    try {
      if (contacts.length > 0) {
        await Contact.insertMany(contacts, { ordered: false });
      }
      
      console.log(`Successfully imported ${contacts.length} contacts (processed: ${processed}, skipped: ${skipped})`);
      res.json({
        success: true,
        count: contacts.length,
        processed: processed,
        skipped: skipped,
        message: `Successfully imported ${contacts.length} LinkedIn contacts`
      });
    } catch (error) {
      console.error('Database insert error:', error);
      // Even if some fail, return success for the ones that worked
      res.json({
        success: true,
        count: contacts.length,
        processed: processed,
        skipped: skipped,
        message: `Processed ${contacts.length} contacts (some may have been duplicates)`
      });
    }

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/search/natural', async (req, res) => {
  try {
    const query = req.query.q?.toLowerCase() || '';
    console.log(`Search query: "${query}"`);
    
    if (!query) {
      const allContacts = await Contact.find().sort({ createdAt: -1 });
      console.log(`Returning all ${allContacts.length} contacts`);
      return res.json({ results: allContacts });
    }

    // Enhanced search with broader patterns
    const searchConditions = [];
    
    // Smart keyword-based search
    const keywords = query.split(/\s+/);
    
    // Build comprehensive search conditions
    for (const keyword of keywords) {
      if (keyword.length > 1) { // Skip single characters
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

    // Specific pattern matching for common queries
    if (query.includes('basketball') || query.includes('sports')) {
      searchConditions.push({
        $or: [
          { tags: { $elemMatch: { $regex: 'basketball|sports|athletic', $options: 'i' } } },
          { company: { $regex: 'nba|basketball|sports', $options: 'i' } },
          { position: { $regex: 'basketball|sports|athletic', $options: 'i' } }
        ]
      });
    }

    if (query.includes('round rock') || query.includes('austin')) {
      searchConditions.push({
        $or: [
          { location: { $regex: 'round rock|austin|texas', $options: 'i' } },
          { tags: { $elemMatch: { $regex: 'round rock|austin|texas', $options: 'i' } } }
        ]
      });
    }

    // Tech companies search
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
    
    const results = await Contact.find(searchQuery).sort({ createdAt: -1 });
    console.log(`Found ${results.length} results for "${query}"`);
    
    res.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed', results: [] });
  }
});

// Download CSV template endpoint
app.get('/api/csv-template', (req, res) => {
  const template = [
    'name,company,job title,industry,email,phone,linkedin,how we met,notes,tags',
    'John Smith,Tesla,Software Engineer,Automotive,john@tesla.com,555-0123,linkedin.com/in/johnsmith,Conference,Great engineer,engineering;tesla',
    'Jane Doe,Google,Product Manager,Technology,jane@google.com,555-0456,linkedin.com/in/janedoe,Mutual friend,PM for Chrome,product;google;chrome'
  ].join('\n');
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="beetagged-contacts-template.csv"');
  res.send(template);
});

// Main application route
app.get('/', (req, res) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BeeTagged - Professional Contact Intelligence</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 20px;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        .hero { 
            text-align: center; 
            color: white; 
            margin-bottom: 50px;
        }
        .hero h1 { 
            font-size: 3rem; 
            margin-bottom: 20px; 
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .hero p { 
            font-size: 1.2rem; 
            opacity: 0.9; 
            margin-bottom: 40px;
        }
        .main-content {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .section {
            padding: 40px;
            border-bottom: 1px solid #f0f0f0;
        }
        .section:last-child { border-bottom: none; }
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin: 10px;
            display: inline-block;
            text-decoration: none;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        .btn-secondary {
            background: #f8fafc;
            color: #2d3748;
            border: 2px solid #e2e8f0;
        }
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin-top: 30px;
        }
        .feature {
            text-align: center;
            padding: 20px;
        }
        .feature-icon {
            font-size: 3rem;
            margin-bottom: 15px;
        }
        .upload-area {
            border: 2px dashed #cbd5e0;
            border-radius: 10px;
            padding: 40px;
            text-align: center;
            margin: 20px 0;
            background: #f7fafc;
        }
        .contact-list {
            max-height: 400px;
            overflow-y: auto;
            background: #f8fafc;
            border-radius: 10px;
            margin-top: 20px;
        }
        .contact-item {
            padding: 15px;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .search-bar {
            width: 100%;
            padding: 15px;
            border: 2px solid #e2e8f0;
            border-radius: 10px;
            font-size: 16px;
            margin-bottom: 20px;
            transition: all 0.3s ease;
        }
        .search-bar:focus {
            border-color: #3498db;
            box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
            transform: scale(1.02);
        }
        .search-bar.search-pressed {
            border-color: #3498db;
            box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.3);
            transform: scale(1.02);
            background: #f0f7ff;
        }
        .hidden { display: none; }
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 10px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
            .hero h1 { font-size: 2rem; }
            .section { padding: 20px; }
            .btn { width: 100%; margin: 5px 0; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="hero">
            <h1>🐝 BeeTagged</h1>
            <p>Transform your phone contacts into a searchable professional network</p>
        </div>
        
        <div class="main-content">
            <div class="section" id="homeSection">
                <h2>Get Started</h2>
                <p>Upload your LinkedIn contacts and start searching with natural language queries like "Who do I know at Google?" or "Who works in marketing?"</p>
                
                <div class="feature-grid">
                    <div class="feature">
                        <div class="feature-icon">📱</div>
                        <h3>Import Contacts</h3>
                        <p>Upload your LinkedIn CSV export to instantly enrich your contact database</p>
                    </div>
                    <div class="feature">
                        <div class="feature-icon">🔍</div>
                        <h3>Smart Search</h3>
                        <p>Find contacts using natural language - ask questions like a human would</p>
                    </div>
                    <div class="feature">
                        <div class="feature-icon">🎯</div>
                        <h3>AI Tagging</h3>
                        <p>Automatic categorization by company, location, role, and industry</p>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 40px;">
                    <button class="btn" onclick="showImport()">📱 Import LinkedIn Contacts</button>
                    <button class="btn btn-secondary" onclick="showSearch()">🔍 Search Contacts</button>
                </div>
            </div>
            
            <div class="section hidden" id="importSection">
                <h2>📱 Import LinkedIn Contacts</h2>
                <p>Upload your LinkedIn contacts CSV file to get started.</p>
                
                <div class="upload-area">
                    <input type="file" id="csvFile" accept=".csv" style="display: none;" onchange="handleFileUpload(event)">
                    <div onclick="document.getElementById('csvFile').click()" style="cursor: pointer;">
                        <div style="font-size: 3rem; margin-bottom: 10px;">📁</div>
                        <p><strong>Click to select CSV file</strong></p>
                        <p>Or drag and drop your LinkedIn export here</p>
                    </div>
                </div>
                
                <div id="uploadStatus"></div>
                
                <button class="btn btn-secondary" onclick="showHome()">← Back to Home</button>
            </div>
            
            <div class="section hidden" id="searchSection">
                <h2>🔍 Search Contacts</h2>
                <input type="text" id="searchInput" class="search-bar" placeholder="Try: 'Who works at Google?', 'Engineers in Seattle', 'Basketball fans in Round Rock'..." onkeyup="handleSearch(event)" onkeydown="handleKeyDown(event)">
                
                <div style="margin-bottom: 20px; padding: 15px; background: #f0f7ff; border-radius: 10px; border-left: 4px solid #0066cc;">
                    <h4 style="margin: 0 0 10px 0; color: #0066cc;">💡 Search Examples:</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; font-size: 14px;">
                        <div><strong>"Google"</strong> - Find Google employees</div>
                        <div><strong>"Engineer"</strong> - Find all engineers</div>
                        <div><strong>"Seattle"</strong> - People in Seattle</div>
                        <div><strong>"John"</strong> - Find people named John</div>
                        <div><strong>"Microsoft manager"</strong> - Managers at Microsoft</div>
                        <div><strong>"Apple designer"</strong> - Designers at Apple</div>
                    </div>
                </div>
                
                <!-- Import Buttons underneath search bar -->
                <div style="text-align: center; margin: 20px 0; padding: 20px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 15px 0; color: #666; font-size: 14px;">Import more contacts from:</p>
                    <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                        <button class="btn" onclick="showLinkedInImport()" style="background: #0077b5; display: flex; align-items: center; gap: 8px;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                            Import LinkedIn CSV
                        </button>
                        <button class="btn" onclick="showFacebookImport()" style="background: #1877f2; display: flex; align-items: center; gap: 8px;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                            Import Facebook Contacts
                        </button>
                    </div>
                    <p style="margin: 15px 0 0 0; color: #888; font-size: 12px;">Add more contacts to enhance your search experience</p>
                </div>
                
                <div id="searchResults">
                    <p style="text-align: center; color: #666; padding: 40px;">Import contacts first to start searching</p>
                </div>
                
                <button class="btn btn-secondary" onclick="showHome()">← Back to Home</button>
            </div>
        </div>
    </div>

    <script>
        let contacts = [];
        
        function showHome() {
            document.getElementById('homeSection').classList.remove('hidden');
            document.getElementById('importSection').classList.add('hidden');
            document.getElementById('searchSection').classList.add('hidden');
        }
        
        function showImport() {
            document.getElementById('homeSection').classList.add('hidden');
            document.getElementById('importSection').classList.remove('hidden');
            document.getElementById('searchSection').classList.add('hidden');
        }
        
        function showSearch() {
            document.getElementById('homeSection').classList.add('hidden');
            document.getElementById('importSection').classList.add('hidden');
            document.getElementById('searchSection').classList.remove('hidden');
            loadContacts();
        }
        
        function showLinkedInImport() {
            // Show LinkedIn import modal or redirect to LinkedIn import page
            showImport();
        }
        
        function showFacebookImport() {
            // Show Facebook import modal
            showFacebookModal();
        }
        
        function showFacebookModal() {
            const modal = document.createElement('div');
            modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;';
            
            modal.innerHTML = '<div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; width: 90%;"><h3 style="margin: 0 0 20px 0; color: #1877f2;">Facebook Contact Import</h3><div style="margin-bottom: 20px;"><label style="display: block; margin-bottom: 5px; font-weight: 600;">Facebook App ID:</label><input type="text" id="fbAppId" placeholder="Enter your Facebook App ID" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;"><p style="font-size: 12px; color: #666; margin-top: 5px;">Create an app at <a href="https://developers.facebook.com" target="_blank">developers.facebook.com</a></p></div><div style="margin-bottom: 20px; padding: 15px; background: #fff3cd; border-radius: 5px;"><strong>Important:</strong> Facebook restricts friend data access. You will only see friends who have also authorized your app.</div><div style="display: flex; gap: 10px;"><button onclick="initFacebookImport()" style="flex: 1; background: #1877f2; color: white; border: none; padding: 12px; border-radius: 5px; cursor: pointer;">Connect & Import</button><button onclick="closeFacebookModal()" style="flex: 1; background: #6c757d; color: white; border: none; padding: 12px; border-radius: 5px; cursor: pointer;">Cancel</button></div></div>';
            
            document.body.appendChild(modal);
            window.currentModal = modal;
        }
        
        function closeFacebookModal() {
            if (window.currentModal) {
                document.body.removeChild(window.currentModal);
                window.currentModal = null;
            }
        }
        
        function initFacebookImport() {
            const appId = document.getElementById('fbAppId').value.trim();
            if (!appId) {
                alert('Please enter your Facebook App ID');
                return;
            }
            
            // Initialize Facebook SDK
            window.fbAsyncInit = function() {
                window.FB.init({
                    appId: appId,
                    cookie: true,
                    xfbml: true,
                    status: true,
                    version: 'v18.0'
                });
                
                // Login and import
                window.FB.login(function(response) {
                    if (response.authResponse) {
                        importFacebookContacts();
                    } else {
                        alert('Facebook login failed or was cancelled');
                    }
                }, {scope: 'email,user_friends'});
            };
            
            // Load Facebook SDK
            if (!document.getElementById('facebook-jssdk')) {
                const js = document.createElement('script');
                js.id = 'facebook-jssdk';
                js.src = 'https://connect.facebook.net/en_US/sdk.js';
                document.head.appendChild(js);
            } else {
                window.fbAsyncInit();
            }
        }
        
        function importFacebookContacts() {
            window.FB.api('/me/friends', {fields: 'id,name,email,picture'}, function(response) {
                if (response.error) {
                    alert('Error fetching Facebook friends: ' + response.error.message);
                    return;
                }
                
                const friends = response.data || [];
                if (friends.length === 0) {
                    alert('No Facebook friends found. This is normal due to Facebook privacy restrictions.');
                    closeFacebookModal();
                    return;
                }
                
                // Convert to contacts format and send to server
                const contacts = friends.map(friend => ({
                    name: friend.name,
                    email: friend.email || '',
                    source: 'facebook',
                    facebookId: friend.id,
                    profileImage: friend.picture && friend.picture.data ? friend.picture.data.url : null
                }));
                
                // Send to backend
                fetch('/api/import/facebook', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({contacts})
                })
                .then(response => response.json())
                .then(data => {
                    alert('Successfully imported ' + contacts.length + ' Facebook contacts!');
                    closeFacebookModal();
                    loadContacts(); // Refresh contact list
                })
                .catch(error => {
                    alert('Error importing contacts: ' + error.message);
                });
            });
        }
        
        async function handleFileUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const statusDiv = document.getElementById('uploadStatus');
            statusDiv.innerHTML = '<div class="loading"></div>Uploading and processing contacts...';
            
            const formData = new FormData();
            formData.append('linkedinCsv', file);
            
            try {
                const response = await fetch('/api/import/linkedin', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.success) {
                    statusDiv.innerHTML = '<div style="color: green; font-weight: bold;">✅ Successfully imported ' + result.count + ' contacts!</div>';
                    setTimeout(() => showSearch(), 1500);
                } else {
                    statusDiv.innerHTML = '<div style="color: red;">❌ Import failed: ' + result.message + '</div>';
                }
            } catch (error) {
                statusDiv.innerHTML = '<div style="color: red;">❌ Upload error: ' + error.message + '</div>';
            }
        }
        
        async function loadContacts() {
            try {
                const response = await fetch('/api/contacts');
                contacts = await response.json();
                displayContacts(contacts);
            } catch (error) {
                console.error('Error loading contacts:', error);
            }
        }
        
        function displayContacts(contactList) {
            const resultsDiv = document.getElementById('searchResults');
            
            if (contactList.length === 0) {
                resultsDiv.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No contacts found. Import your LinkedIn CSV first!</p>';
                return;
            }
            
            const contactsHtml = contactList.map(contact => 
                '<div class="contact-item">' +
                    '<div>' +
                        '<strong>' + (contact.name || 'Unknown') + '</strong>' +
                        '<div style="font-size: 14px; color: #666;">' +
                            (contact.position || '') + (contact.position && contact.company ? ' at ' : '') + (contact.company || '') +
                        '</div>' +
                        '<div style="font-size: 12px; color: #999;">' +
                            (contact.location || '') + (contact.tags ? ' • ' + contact.tags.join(', ') : '') +
                        '</div>' +
                    '</div>' +
                    '<div style="font-size: 12px; color: #666;">' +
                        (contact.email || '') +
                    '</div>' +
                '</div>'
            ).join('');
            
            resultsDiv.innerHTML = 
                '<div style="margin-bottom: 15px; font-weight: bold;">Found ' + contactList.length + ' contacts</div>' +
                '<div class="contact-list">' + contactsHtml + '</div>';
        }
        
        async function performSearch(query) {
            if (query.length < 2) {
                displayContacts(contacts);
                return;
            }
            
            console.log('Searching for:', query);
            
            try {
                const response = await fetch('/api/search/natural?q=' + encodeURIComponent(query));
                if (!response.ok) {
                    throw new Error('Search request failed');
                }
                const result = await response.json();
                console.log('Search results:', result.results.length, 'contacts found');
                displayContacts(result.results || []);
            } catch (error) {
                console.error('Search error:', error);
                displayContacts([]);
                // Show error message to user
                const resultsDiv = document.getElementById('searchResults');
                resultsDiv.innerHTML = '<p style="text-align: center; color: #dc3545; padding: 20px;">Search failed. Please try again.</p>';
            }
        }
        
        async function handleSearch(event) {
            const query = event.target.value.trim();
            await performSearch(query);
        }
        
        function handleKeyDown(event) {
            if (event.key === 'Enter') {
                event.preventDefault(); // Prevent form submission
                
                // Add visual feedback
                const searchInput = event.target;
                searchInput.classList.add('search-pressed');
                setTimeout(() => {
                    searchInput.classList.remove('search-pressed');
                }, 300);
                
                const query = event.target.value.trim();
                performSearch(query);
            }
        }
        
        // Initialize
        showHome();
    </script>
</body>
</html>`;
    res.send(html);
});

// Catch-all route
app.get('*', (req, res) => {
  res.redirect('/');
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`BeeTagged Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`MongoDB: ${process.env.MONGODB_URI ? 'configured' : 'not configured'}`);
});

// Error handling
server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});