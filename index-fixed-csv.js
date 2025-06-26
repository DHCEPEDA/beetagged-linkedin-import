const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');
const FacebookAPI = require('./server/facebook-api');

const app = express();
const facebookAPI = new FacebookAPI();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
  origin: ['https://beetagged.com', 'https://www.beetagged.com', 'http://localhost:3000', '*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Static files - serve dist first for React app
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.static(path.join(__dirname, 'public')));

// Simple storage arrays for demo purposes
let contacts = [];
let tags = [];
let contactIdCounter = 1;
let tagIdCounter = 1;

// Upload configuration for file handling
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${timestamp}-${random}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files allowed'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

/**
 * LinkedIn CSV Parser - Enhanced version with flexible field mapping
 * Handles various LinkedIn export formats and provides detailed logging
 */
function parseLinkedInCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    console.log('Starting CSV parsing for file:', filePath);
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        const contact = {
          id: `linkedin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          source: 'linkedin_import',
          tags: []
        };
        
        // Enhanced field mapping - handles multiple possible column names
        const fieldMappings = [
          { csvField: 'First Name', contactField: 'firstName' },
          { csvField: 'Last Name', contactField: 'lastName' },
          { csvField: 'Email Address', contactField: 'email' },
          { csvField: 'Company', contactField: 'company' },
          { csvField: 'Position', contactField: 'title' },
          { csvField: 'Connected On', contactField: 'connectedOn' },
          { csvField: 'Location', contactField: 'location' },
          { csvField: 'Industry', contactField: 'industry' },
          { csvField: 'Phone Number', contactField: 'phone' },
          // Alternative formats
          { csvField: 'first name', contactField: 'firstName' },
          { csvField: 'last name', contactField: 'lastName' },
          { csvField: 'email', contactField: 'email' },
          { csvField: 'company', contactField: 'company' },
          { csvField: 'position', contactField: 'title' },
          { csvField: 'title', contactField: 'title' },
          { csvField: 'Name', contactField: 'fullName' },
          { csvField: 'Full Name', contactField: 'fullName' }
        ];
        
        // Extract data using flexible field mapping
        fieldMappings.forEach(mapping => {
          if (data[mapping.csvField] && data[mapping.csvField].trim()) {
            contact[mapping.contactField] = data[mapping.csvField].trim();
          }
        });
        
        // Handle full name splitting if we got a single name field
        if (contact.fullName && !contact.firstName && !contact.lastName) {
          const nameParts = contact.fullName.split(' ');
          contact.firstName = nameParts[0] || '';
          contact.lastName = nameParts.slice(1).join(' ') || '';
        }
        
        // Create combined name
        contact.name = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
        
        // Enhanced validation - accept contact if it has ANY meaningful data
        const hasValidData = contact.name || 
                           contact.company || 
                           contact.email || 
                           contact.title ||
                           contact.fullName;
        
        if (hasValidData) {
          // Generate intelligent tags based on contact data
          const tags = [];
          if (contact.location) tags.push({ type: 'location', name: contact.location });
          if (contact.company) tags.push({ type: 'company', name: contact.company });
          if (contact.title) tags.push({ type: 'position', name: contact.title });
          if (contact.industry) tags.push({ type: 'industry', name: contact.industry });
          
          contact.tags = tags;
          contact.picture = 'https://cdn.jsdelivr.net/npm/simple-icons@v6/icons/linkedin.svg';
          
          results.push(contact);
          console.log(`Parsed contact: ${contact.name} at ${contact.company}`);
        } else {
          console.log('Skipped row - no name or company found');
        }
      })
      .on('end', () => {
        console.log(`CSV parsing complete. Found ${results.length} valid contacts`);
        resolve(results);
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        reject(error);
      });
  });
}

// Root route - main dashboard
app.get('/', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>BeeTagged - Professional Contact Intelligence</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f8fafc; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2563eb; margin-bottom: 10px; }
        .tagline { color: #64748b; margin-bottom: 30px; font-style: italic; }
        .status { color: #059669; font-weight: bold; background: #dcfce7; padding: 10px; border-radius: 5px; margin: 20px 0; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
        .stat-card { background: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; }
        .stat-number { font-size: 24px; font-weight: bold; color: #2563eb; }
        .stat-label { color: #64748b; font-size: 14px; }
        .linkedin-section { background: #0077b5; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .linkedin-section h3 { margin-top: 0; }
        .linkedin-section a { background: white; color: #0077b5; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
        ul { margin: 20px 0; }
        li { margin: 10px 0; }
        a { color: #2563eb; text-decoration: none; padding: 8px 15px; background: #eff6ff; border-radius: 5px; display: inline-block; }
        a:hover { background: #dbeafe; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🐝 BeeTagged</h1>
        <p class="tagline">Professional Contact Intelligence Platform</p>
        
        <div class="status">✓ Server running successfully!</div>
        
        <div class="stats">
          <div class="stat-card">
            <div class="stat-number">${contacts.length}</div>
            <div class="stat-label">Contacts</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${tags.length}</div>
            <div class="stat-label">Tags</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${contacts.filter(c => c.source === 'linkedin_import').length}</div>
            <div class="stat-label">LinkedIn</div>
          </div>
        </div>
        
        <div class="linkedin-section">
          <h3>📋 LinkedIn Import</h3>
          <p>Import your LinkedIn connections CSV to build your professional network database.</p>
          <a href="/li-import">Import LinkedIn Connections</a>
        </div>

        <h3>🔗 Available Tools:</h3>
        <ul>
          <li><a href="/health">Health Check & Diagnostics</a></li>
          <li><a href="/api/contacts">View All Contacts API</a></li>
          <li><a href="/search">Search Contacts</a></li>
        </ul>
      </div>
    </body>
    </html>
  `;
  res.send(html);
});

// LinkedIn import page
app.get('/li-import', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>LinkedIn Import - BeeTagged</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #0077b5; }
        .upload-area { border: 2px dashed #0077b5; padding: 40px; text-align: center; border-radius: 10px; margin: 20px 0; background: #f0f8ff; }
        .upload-area:hover { background: #e6f3ff; }
        input[type="file"] { margin: 20px 0; }
        button { background: #0077b5; color: white; padding: 15px 30px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
        button:hover { background: #005885; }
        .instructions { background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .back-link { display: inline-block; margin-top: 20px; color: #2563eb; text-decoration: none; }
        .back-link:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📋 LinkedIn Import</h1>
        
        <div class="instructions">
          <h3>How to Export Your LinkedIn Connections:</h3>
          <ol>
            <li>Go to LinkedIn Settings & Privacy</li>
            <li>Click "Data Privacy" → "Get a copy of your data"</li>
            <li>Select "Connections" and download</li>
            <li>Upload the Connections.csv file below</li>
          </ol>
        </div>

        <form action="/api/import/linkedin" method="post" enctype="multipart/form-data">
          <div class="upload-area">
            <h3>📁 Upload LinkedIn CSV</h3>
            <input type="file" name="linkedinCsv" accept=".csv" required>
            <p>Select your LinkedIn Connections.csv file</p>
            <button type="submit">Import Contacts</button>
          </div>
        </form>

        <a href="/" class="back-link">← Back to Dashboard</a>
      </div>
    </body>
    </html>
  `;
  res.send(html);
});

/**
 * LinkedIn Import API Endpoint - Processes uploaded LinkedIn CSV files
 * This endpoint handles file uploads, parses CSV data, and imports contacts
 */
app.post('/api/import/linkedin', upload.single('linkedinCsv'), async (req, res) => {
  try {
    // Step 1: Validate file upload
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No CSV file uploaded' 
      });
    }

    console.log('Processing LinkedIn CSV file:', req.file.originalname);
    
    // Step 2: Parse the CSV file
    const importedContacts = await parseLinkedInCSV(req.file.path);
    
    // Step 3: Validate we found contacts
    if (!importedContacts || importedContacts.length === 0) {
      console.log('No valid contacts found in CSV file');
      return res.status(400).json({ 
        success: false, 
        message: 'No valid contacts found in CSV file. Please check that your CSV has First Name, Last Name, Company, or Position columns.' 
      });
    }
    
    console.log(`Found ${importedContacts.length} valid contacts in CSV`);
    
    // Step 4: Clear existing LinkedIn imports to avoid duplicates
    contacts = contacts.filter(c => c.source !== 'linkedin_import');
    
    // Step 5: Convert to BeeTagged format and add to contacts
    importedContacts.forEach(contact => {
      const newContact = {
        _id: contactIdCounter++,
        name: contact.name,
        email: contact.email || '',
        phoneNumber: contact.phone || '',
        company: contact.company || '',
        title: contact.title || '',
        location: contact.location || '',
        industry: contact.industry || '',
        connectedOn: contact.connectedOn || '',
        source: 'linkedin_import',
        picture: contact.picture,
        createdAt: new Date().toISOString(),
        priorityData: {
          employment: { 
            current: { 
              jobFunction: contact.title || '', 
              employer: contact.company || '' 
            } 
          },
          location: { current: contact.location || '' }
        },
        allTags: contact.tags.map(tag => ({
          name: tag.name,
          category: tag.type
        })),
        linkedinData: { id: contact.id },
        tags: contact.tags
      };
      
      contacts.push(newContact);
    });
    
    // Step 6: Generate tags from contact data
    const newTags = new Set();
    importedContacts.forEach(contact => {
      contact.tags.forEach(tag => {
        const tagName = tag.name;
        if (tagName && !tags.find(t => t.name.toLowerCase() === tagName.toLowerCase())) {
          newTags.add(JSON.stringify({
            _id: tagIdCounter++,
            name: tagName,
            color: tag.type === 'company' ? '#1e40af' : 
                   tag.type === 'location' ? '#059669' : 
                   tag.type === 'position' ? '#dc2626' : '#7c2d12',
            category: tag.type || 'general',
            createdAt: new Date().toISOString(),
            usageCount: 1,
            source: 'linkedin_import'
          }));
        }
      });
    });
    
    newTags.forEach(tagStr => {
      tags.push(JSON.parse(tagStr));
    });
    
    // Step 7: Clean up uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('File cleanup error:', err);
    });
    
    // Step 8: Return success response
    res.json({
      success: true,
      message: `Successfully imported ${importedContacts.length} contacts from LinkedIn`,
      contacts: importedContacts,
      count: importedContacts.length,
      totalContacts: contacts.length,
      newTags: Array.from(newTags).map(t => JSON.parse(t))
    });
    
  } catch (error) {
    console.error('LinkedIn import error:', error);
    
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to import LinkedIn contacts',
      error: error.message
    });
  }
});

// API Endpoints
app.get('/api/contacts', (req, res) => {
  res.json({
    success: true,
    contacts: contacts,
    total: contacts.length,
    sources: {
      linkedin_import: contacts.filter(c => c.source === 'linkedin_import').length,
      manual: contacts.filter(c => c.source === 'manual').length,
      other: contacts.filter(c => c.source !== 'linkedin_import' && c.source !== 'manual').length
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    contacts: contacts.length,
    tags: tags.length,
    linkedinContacts: contacts.filter(c => c.source === 'linkedin_import').length,
    memory: process.memoryUsage(),
    port: process.env.PORT || '5000'
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, function(err) {
  if (err) {
    console.error('❌ FATAL: Server failed to start:', err);
    process.exit(1);
  }
  
  console.log(`🚀 BeeTagged server running on port ${PORT}`);
  console.log(`📋 LinkedIn import available at: /li-import`);
  console.log(`🔗 Health check: /health`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
  }
});

module.exports = app;