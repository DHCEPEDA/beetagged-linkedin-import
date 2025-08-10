// COMPLETE BACKEND - BeeTagged with Duplicate Detection
// Updated backend with CSV upload fixes and duplicate contact merging

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
  contentSecurityPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
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
  windowMs: 15 * 60 * 1000,
  max: 1000
});
app.use(limiter);

// ===== MONGODB CONNECTION =====

function connectMongoDB() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI environment variable is required');
    process.exit(1);
  }

  const mongoOptions = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    maxPoolSize: 10,
    minPoolSize: 2,
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

// ===== FILE UPLOAD SETUP =====

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// ===== API ROUTES =====

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'BeeTagged Server running',
    environment: process.env.NODE_ENV || 'development',
    mongodb: 'configured'
  });
});

// ===== SEARCH ENDPOINT =====

app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    console.log('Search request for:', query);
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    // Enhanced search with timeout protection
    const searchPromise = performEnhancedSearch(query);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database timeout')), 10000);
    });

    const contacts = await Promise.race([searchPromise, timeoutPromise]);
    
    console.log(`Found ${contacts.length} contacts for query: "${query}"`);
    res.json({ contacts });
    
  } catch (error) {
    console.error('Error fetching contacts:', error);
    if (error.message === 'Database timeout') {
      res.status(504).json({ error: 'Database timeout - please try again' });
    } else {
      res.status(500).json({ error: 'Failed to fetch contacts' });
    }
  }
});

// LinkedIn CSV import with dual-file support and duplicate detection
app.post('/api/import/linkedin', upload.fields([
  { name: 'linkedinCsv', maxCount: 1 },
  { name: 'contactsCsv', maxCount: 1 },
  { name: 'csvFile', maxCount: 1 },
  { name: 'contactsFile', maxCount: 1 },
  { name: 'connectionsFile', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('=== LinkedIn CSV Import Started ===');
    console.log('Files received:', req.files);
    
    const linkedinFile = req.files?.linkedinCsv?.[0] || req.files?.csvFile?.[0] || req.files?.connectionsFile?.[0];
    const contactsFile = req.files?.contactsCsv?.[0] || req.files?.contactsFile?.[0];
    
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
      
      // Process single file
      mergedContacts = processSingleCSV(lines);
    }
    
    if (mergedContacts.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No valid contacts found in the uploaded files.' 
      });
    }

    // Detect duplicates before saving
    const duplicates = detectDuplicates(mergedContacts);
    
    if (duplicates.length > 0) {
      console.log(`Found ${duplicates.length} potential duplicate groups`);
      
      // Store contacts temporarily for duplicate resolution
      const sessionId = Date.now().toString();
      global.pendingImports = global.pendingImports || {};
      global.pendingImports[sessionId] = {
        contacts: mergedContacts,
        duplicates: duplicates,
        timestamp: Date.now()
      };
      
      // Return duplicates for user review
      return res.json({
        success: true,
        duplicatesFound: true,
        duplicates: duplicates,
        sessionId: sessionId,
        totalContacts: mergedContacts.length,
        nonDuplicates: mergedContacts.length - duplicates.reduce((acc, group) => acc + group.length, 0),
        message: `Found ${duplicates.length} potential duplicate groups requiring review`
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

// Handle duplicate resolution and final import
app.post('/api/import/resolve-duplicates', express.json(), async (req, res) => {
  try {
    const { sessionId, resolutions } = req.body;
    
    if (!sessionId || !global.pendingImports?.[sessionId]) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid session or session expired' 
      });
    }
    
    const importData = global.pendingImports[sessionId];
    const { contacts, duplicates } = importData;
    
    console.log('Resolving duplicates for session:', sessionId);
    console.log('Resolutions received:', resolutions);
    
    let finalContacts = [...contacts];
    let removedCount = 0;
    let mergedCount = 0;
    
    // Process each duplicate group based on user choice
    for (let i = 0; i < duplicates.length; i++) {
      const group = duplicates[i];
      const resolution = resolutions[i];
      
      if (resolution.action === 'merge') {
        // Merge contacts in this group
        const mergedContact = mergeContactInfo(group);
        
        // Remove original contacts from final list
        finalContacts = finalContacts.filter(contact => 
          !group.some(dup => 
            dup.name === contact.name && 
            dup.email === contact.email
          )
        );
        
        // Add merged contact
        finalContacts.push(mergedContact);
        mergedCount++;
        removedCount += group.length - 1;
        
      } else if (resolution.action === 'skip') {
        // Remove all contacts in this duplicate group
        finalContacts = finalContacts.filter(contact => 
          !group.some(dup => 
            dup.name === contact.name && 
            dup.email === contact.email
          )
        );
        removedCount += group.length;
        
      } else if (resolution.action === 'keep_all') {
        // Keep all duplicates as separate contacts - no action needed
      } else if (resolution.action === 'keep_selected' && resolution.selectedIndex !== undefined) {
        // Keep only the selected contact
        const selectedContact = group[resolution.selectedIndex];
        
        // Remove all contacts in group
        finalContacts = finalContacts.filter(contact => 
          !group.some(dup => 
            dup.name === contact.name && 
            dup.email === contact.email
          )
        );
        
        // Add back only the selected one
        finalContacts.push(selectedContact);
        removedCount += group.length - 1;
      }
    }
    
    // Save final contacts to database
    let insertedCount = 0;
    let duplicateCount = 0;
    let contactsWithCompany = 0;
    let contactsWithEmail = 0;
    
    for (const contactData of finalContacts) {
      if (contactData.company) contactsWithCompany++;
      if (contactData.email) contactsWithEmail++;
      
      try {
        const existingContact = await Contact.findOne({ 
          name: { $regex: new RegExp(`^${contactData.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });
        
        if (!existingContact) {
          const contact = new Contact({
            name: contactData.name,
            email: contactData.email,
            phone: contactData.phone,
            company: contactData.company,
            position: contactData.position,
            location: contactData.location,
            tags: generateTags(contactData),
            source: 'linkedin_import_resolved',
            connectedOn: contactData.connectedOn,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          await contact.save();
          insertedCount++;
        } else {
          // Update existing contact with additional data
          const updates = {};
          if (contactData.email && !existingContact.email) updates.email = contactData.email;
          if (contactData.company && !existingContact.company) updates.company = contactData.company;
          if (contactData.position && !existingContact.position) updates.position = contactData.position;
          if (contactData.phone && !existingContact.phone) updates.phone = contactData.phone;
          
          if (Object.keys(updates).length > 0) {
            await Contact.findByIdAndUpdate(existingContact._id, updates);
            console.log(`Enhanced existing contact: ${contactData.name}`);
          }
          duplicateCount++;
        }
      } catch (error) {
        console.error(`Error saving contact ${contactData.name}:`, error);
        duplicateCount++;
      }
    }
    
    // Clean up session data
    delete global.pendingImports[sessionId];
    
    console.log('=== Final Import Statistics ===');
    console.log(`Inserted: ${insertedCount}`);
    console.log(`Duplicates skipped: ${duplicateCount}`);
    console.log(`Merged: ${mergedCount}`);
    console.log(`Removed: ${removedCount}`);
    
    res.json({
      success: true,
      count: insertedCount,
      duplicates: duplicateCount,
      merged: mergedCount,
      removed: removedCount,
      contactsWithCompany,
      contactsWithEmail,
      message: `Successfully imported ${insertedCount} contacts with ${mergedCount} merged and ${removedCount} duplicates resolved`
    });
    
  } catch (error) {
    console.error('Duplicate resolution error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// ===== HELPER FUNCTIONS =====

async function performEnhancedSearch(query) {
  const lowercaseQuery = query.toLowerCase().trim();
  
  // Handle empty or very short queries
  if (lowercaseQuery.length < 2) {
    return [];
  }
  
  const searchConditions = [];
  
  // Basic text search using MongoDB text index
  searchConditions.push({
    $text: { $search: query }
  });
  
  // Name-based search (partial matches)
  searchConditions.push({
    name: { $regex: new RegExp(lowercaseQuery.split(' ').join('|'), 'i') }
  });
  
  // Company search
  if (lowercaseQuery.includes('company') || lowercaseQuery.includes('work')) {
    const companyTerms = extractCompanyNames(lowercaseQuery);
    if (companyTerms.length > 0) {
      searchConditions.push({
        company: { $regex: new RegExp(companyTerms.join('|'), 'i') }
      });
    }
  }
  
  // Location search
  if (lowercaseQuery.includes('location') || hasLocationKeywords(lowercaseQuery)) {
    const locationTerms = extractLocationNames(lowercaseQuery);
    if (locationTerms.length > 0) {
      searchConditions.push({
        location: { $regex: new RegExp(locationTerms.join('|'), 'i') }
      });
    }
  }
  
  // Position/title search
  if (lowercaseQuery.includes('engineer') || lowercaseQuery.includes('manager') || lowercaseQuery.includes('director')) {
    searchConditions.push({
      position: { $regex: new RegExp(lowercaseQuery, 'i') }
    });
  }
  
  // Tag-based search
  const queryTags = generateTagsFromQuery(lowercaseQuery);
  if (queryTags.length > 0) {
    searchConditions.push({
      tags: { $in: queryTags }
    });
  }
  
  // Execute search with OR conditions
  const contacts = await Contact.find({
    $or: searchConditions
  }).limit(50).lean();
  
  return contacts;
}

function extractCompanyNames(query) {
  const companies = [];
  const commonCompanies = ['google', 'apple', 'microsoft', 'amazon', 'facebook', 'meta', 'tesla', 'netflix', 'uber', 'airbnb', 'spotify', 'twitter', 'linkedin', 'salesforce', 'oracle', 'ibm', 'intel', 'nvidia'];
  
  for (const company of commonCompanies) {
    if (query.includes(company)) {
      companies.push(company);
    }
  }
  
  // Extract potential company names after "at" or "work"
  const companyMatch = query.match(/(?:at|work.*?at|company.*?)\s+([a-zA-Z][a-zA-Z\s]{2,20})/i);
  if (companyMatch && companyMatch[1]) {
    companies.push(companyMatch[1].trim());
  }
  
  return companies;
}

function extractLocationNames(query) {
  const locations = [];
  const commonLocations = ['san francisco', 'new york', 'los angeles', 'seattle', 'chicago', 'boston', 'austin', 'denver', 'portland', 'california', 'texas', 'florida'];
  
  for (const location of commonLocations) {
    if (query.includes(location)) {
      locations.push(location);
    }
  }
  
  return locations;
}

function hasLocationKeywords(query) {
  const locationKeywords = ['in', 'from', 'area', 'city', 'state', 'country', 'lives', 'based'];
  return locationKeywords.some(keyword => query.includes(keyword));
}

function generateTagsFromQuery(query) {
  const tags = [];
  
  // Role-based tags
  if (query.includes('engineer') || query.includes('developer')) tags.push('function:engineering');
  if (query.includes('manager') || query.includes('director')) tags.push('function:management');
  if (query.includes('designer')) tags.push('function:design');
  if (query.includes('sales')) tags.push('function:sales');
  if (query.includes('marketing')) tags.push('function:marketing');
  
  // Industry tags
  if (query.includes('tech') || query.includes('technology')) tags.push('industry:technology');
  if (query.includes('finance') || query.includes('banking')) tags.push('industry:finance');
  if (query.includes('healthcare') || query.includes('medical')) tags.push('industry:healthcare');
  
  return tags;
}

// Merge LinkedIn data from both files
function mergeLinkedInData(connectionsData, contactsData) {
  const mergedContacts = new Map();
  
  // Process Connections CSV
  if (connectionsData) {
    const connectionsLines = connectionsData.split(/\r?\n/).filter(line => line.trim());
    if (connectionsLines.length > 1) {
      const connectionsHeaders = parseCSVLine(connectionsLines[0]);
      
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
            source: 'linkedin_connections'
          });
        }
      }
    }
  }
  
  // Process Contacts CSV and merge with connections
  if (contactsData) {
    const contactsLines = contactsData.split(/\r?\n/).filter(line => line.trim());
    if (contactsLines.length > 1) {
      const contactsHeaders = parseCSVLine(contactsLines[0]);
      
      for (let i = 1; i < contactsLines.length; i++) {
        const fields = parseCSVLine(contactsLines[i]);
        const contact = parseContactFields(fields, contactsHeaders);
        
        if (contact.name) {
          const key = contact.name.toLowerCase();
          
          if (mergedContacts.has(key)) {
            // Merge with existing connection
            const existing = mergedContacts.get(key);
            mergedContacts.set(key, {
              ...existing,
              ...contact,
              source: 'linkedin_merged'
            });
          } else {
            // New contact
            mergedContacts.set(key, {
              ...contact,
              source: 'linkedin_contacts'
            });
          }
        }
      }
    }
  }
  
  return Array.from(mergedContacts.values());
}

function processSingleCSV(lines) {
  const contacts = [];
  if (lines.length < 2) return contacts;
  
  const headers = parseCSVLine(lines[0]);
  console.log('CSV Headers:', headers);
  
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    
    // Detect file type based on headers
    const isConnectionsFile = headers.some(h => 
      h.toLowerCase().includes('first name') && 
      headers.some(h2 => h2.toLowerCase().includes('last name'))
    );
    
    let contact;
    if (isConnectionsFile) {
      // Process as connections file
      const firstName = fields[0]?.trim() || '';
      const lastName = fields[1]?.trim() || '';
      const connectedOn = fields[2]?.trim() || '';
      
      contact = {
        name: `${firstName} ${lastName}`.trim(),
        firstName,
        lastName,
        connectedOn,
        email: '',
        company: '',
        position: '',
        location: '',
        source: 'linkedin_connections'
      };
    } else {
      // Process as contacts file
      contact = parseContactFields(fields, headers);
    }
    
    if (contact && contact.name && contact.name.trim()) {
      contacts.push(contact);
    }
  }
  
  return contacts;
}

function parseContactFields(fields, headers) {
  const contact = {
    name: '',
    email: '',
    company: '',
    position: '',
    location: '',
    connectedOn: '',
    source: 'linkedin_contacts'
  };
  
  // Map headers to contact fields
  const headerMapping = {};
  headers.forEach((header, index) => {
    const lowerHeader = header.toLowerCase();
    if (lowerHeader.includes('name') && !lowerHeader.includes('first') && !lowerHeader.includes('last')) {
      headerMapping.name = index;
    } else if (lowerHeader.includes('email')) {
      headerMapping.email = index;
    } else if (lowerHeader.includes('company') || lowerHeader.includes('organization')) {
      headerMapping.company = index;
    } else if (lowerHeader.includes('position') || lowerHeader.includes('title')) {
      headerMapping.position = index;
    } else if (lowerHeader.includes('location')) {
      headerMapping.location = index;
    } else if (lowerHeader.includes('connected')) {
      headerMapping.connectedOn = index;
    }
  });
  
  // Fill contact data
  Object.keys(headerMapping).forEach(field => {
    const index = headerMapping[field];
    if (index < fields.length) {
      contact[field] = fields[index]?.trim() || '';
    }
  });
  
  return contact;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 2;
      } else {
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }

  result.push(current.trim());
  return result;
}

// Generate tags for contacts
function generateTags(contact) {
  const tags = [];
  
  if (contact.company) {
    tags.push(`company:${contact.company.toLowerCase()}`);
    
    // Industry-based tags
    const company = contact.company.toLowerCase();
    if (company.includes('tech') || company.includes('software') || company.includes('google') || company.includes('microsoft')) {
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

// Duplicate detection functions
function detectDuplicates(contacts) {
  const duplicateGroups = [];
  const processed = new Set();
  
  for (let i = 0; i < contacts.length; i++) {
    if (processed.has(i)) continue;
    
    const currentContact = contacts[i];
    const duplicateGroup = [currentContact];
    
    for (let j = i + 1; j < contacts.length; j++) {
      if (processed.has(j)) continue;

      const otherContact = contacts[j];
      
      if (isDuplicate(currentContact, otherContact)) {
        duplicateGroup.push(otherContact);
        processed.add(j);
      }
    }

    if (duplicateGroup.length > 1) {
      duplicateGroups.push(duplicateGroup);
      processed.add(i);
    }
  }

  return duplicateGroups;
}

function isDuplicate(contact1, contact2) {
  // Exact name match
  if (contact1.name && contact2.name && 
      contact1.name.toLowerCase().trim() === contact2.name.toLowerCase().trim()) {
    return true;
  }

  // Email match
  if (contact1.email && contact2.email && 
      contact1.email.toLowerCase().trim() === contact2.email.toLowerCase().trim()) {
    return true;
  }

  // Name similarity with company match
  if (contact1.name && contact2.name && contact1.company && contact2.company) {
    const name1 = contact1.name.toLowerCase().trim();
    const name2 = contact2.name.toLowerCase().trim();
    const company1 = contact1.company.toLowerCase().trim();
    const company2 = contact2.company.toLowerCase().trim();
    
    // Check if names are very similar
    const nameSimilarity = calculateNameSimilarity(name1, name2);
    if (nameSimilarity > 0.8 && company1 === company2) {
      return true;
    }
  }

  return false;
}

function calculateNameSimilarity(name1, name2) {
  const words1 = name1.split(' ').filter(w => w.length > 1);
  const words2 = name2.split(' ').filter(w => w.length > 1);
  
  let matches = 0;
  const maxWords = Math.max(words1.length, words2.length);
  
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2 || 
          (word1.length > 2 && word2.length > 2 && 
           (word1.includes(word2) || word2.includes(word1)))) {
        matches++;
        break;
      }
    }
  }
  
  return matches / maxWords;
}

function mergeContactInfo(contacts) {
  const merged = {
    name: '',
    email: '',
    company: '',
    position: '',
    location: '',
    phone: '',
    connectedOn: '',
    source: 'linkedin_merged'
  };
  
  // Merge information from all contacts, preferring non-empty values
  for (const contact of contacts) {
    Object.keys(merged).forEach(field => {
      if (!merged[field] && contact[field]) {
        merged[field] = contact[field];
      }
    });
  }
  
  return merged;
}

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`BeeTagged Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('MongoDB: configured');
});