/* 
 * COMPLETE BEETAGGED REPLIT PACKAGE
 * 
 * Instructions for Replit Setup:
 * 1. Create a new Node.js Repl in Replit
 * 2. Replace the contents of index.js with this file
 * 3. Install dependencies: npm install express mongoose cors dotenv multer csv-parser helmet compression morgan express-rate-limit
 * 4. Set environment variables in Replit Secrets:
 *    - MONGODB_URI: Your MongoDB Atlas connection string
 *    - PORT: 5000 (adjusted for current setup)
 *    - NODE_ENV: production
 * 5. Run the application
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const Papa = require('papaparse');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const csv = require('csv-parser');
const path = require('path');
const fs = require('fs');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced security middleware with iframe embedding support
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      frameAncestors: ["'self'", "https://*.squarespace.com", "https://*.sqsp.com"], // Allow Squarespace embedding
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  frameguard: false // Disable X-Frame-Options to allow iframe embedding
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Middleware
app.use(compression());
app.use(morgan('combined'));

// Enhanced CORS configuration for Squarespace embedded widgets
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (server-to-server, curl, Postman)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check for allowed origins
    const isAllowed = 
      origin.includes('.squarespace.com') || // All Squarespace sites
      origin.includes('.sqsp.com') || // Squarespace CDN
      origin.includes('localhost') || // Local development
      origin.includes('.replit.dev') || // Replit development
      origin.includes('.repl.co') || // Replit preview
      origin.startsWith('https://'); // Any HTTPS origin for embedded widgets
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept', 'Cache-Control']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Trust proxy for Heroku
app.set('trust proxy', 1);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beetagged', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB successfully');
  console.log('Database:', mongoose.connection.name);
});

// Enhanced Contact Schema with all LinkedIn fields
const contactSchema = new mongoose.Schema({
  // Basic Information
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  name: { type: String }, // Combined name for backward compatibility
  email: { type: String, sparse: true },
  phone: { type: String },
  
  // LinkedIn Profile Data
  linkedinUrl: { type: String },
  profilePhoto: { type: String }, // LinkedIn profile photo URL
  headline: { type: String }, // Professional headline
  summary: { type: String }, // About section
  
  // Location Information
  location: { type: String },
  city: { type: String },
  state: { type: String },
  country: { type: String },
  
  // Professional Information
  currentCompany: { type: String },
  company: { type: String }, // Backward compatibility
  currentPosition: { type: String },
  position: { type: String }, // Backward compatibility
  industry: { type: String },
  yearsOfExperience: { type: Number },
  
  // Work Experience (Array of positions)
  workExperience: [{
    company: { type: String },
    position: { type: String },
    duration: { type: String },
    startDate: { type: String },
    endDate: { type: String },
    description: { type: String }
  }],
  
  // Education
  education: [{
    institution: { type: String },
    degree: { type: String },
    fieldOfStudy: { type: String },
    graduationYear: { type: String }
  }],
  
  // Skills and Endorsements
  skills: [{ type: String }],
  certifications: [{ type: String }],
  languages: [{ type: String }],
  
  // Affinity Groups and Interests
  affinityGroups: [{ type: String }],
  interests: [{ type: String }],
  volunteerExperience: [{ type: String }],
  
  // Social and Professional Networks
  connections: { type: Number }, // Number of LinkedIn connections
  mutualConnections: [{ type: String }],
  
  // Tags and Categories
  tags: [{ type: String }],
  categories: [{ type: String }],
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  
  // Relationship and Interaction Data
  relationshipStatus: { type: String }, // How you know them
  lastInteraction: { type: Date },
  notes: { type: String },
  
  // Metadata
  userId: { type: String, required: true },
  source: { type: String, default: 'manual' }, // manual, linkedin, facebook, etc.
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  
  // Search and Ranking
  searchScore: { type: Number, default: 0 },
  contactScore: { type: Number, default: 0 } // Overall contact quality score
}, {
  timestamps: true
});

// Pre-save middleware to maintain backward compatibility
contactSchema.pre('save', function(next) {
  // If firstName and lastName exist but name doesn't, create combined name
  if (this.firstName && this.lastName && !this.name) {
    this.name = `${this.firstName} ${this.lastName}`;
  }
  
  // If name exists but firstName/lastName don't, try to split
  if (this.name && (!this.firstName || !this.lastName)) {
    const nameParts = this.name.split(' ');
    if (!this.firstName) this.firstName = nameParts[0] || '';
    if (!this.lastName) this.lastName = nameParts.slice(1).join(' ') || '';
  }
  
  // Sync company fields
  if (this.currentCompany && !this.company) {
    this.company = this.currentCompany;
  } else if (this.company && !this.currentCompany) {
    this.currentCompany = this.company;
  }
  
  // Sync position fields
  if (this.currentPosition && !this.position) {
    this.position = this.currentPosition;
  } else if (this.position && !this.currentPosition) {
    this.currentPosition = this.position;
  }
  
  next();
});

// Indexes for better search performance
contactSchema.index({ firstName: 'text', lastName: 'text', name: 'text', email: 'text', currentCompany: 'text', company: 'text' });
contactSchema.index({ userId: 1, createdAt: -1 });
contactSchema.index({ tags: 1 });
contactSchema.index({ searchScore: -1 });

const Contact = mongoose.model('Contact', contactSchema);

// Robust CSV processing using PapaParse
function parseLinkedInCSV(csvData) {
  console.log('📄 Processing CSV with PapaParse...');
  
  // Parse CSV with PapaParse
  const parseResult = Papa.parse(csvData, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim()
  });
  
  if (parseResult.errors.length > 0) {
    console.error('⚠️  CSV parsing warnings:', parseResult.errors.slice(0, 3));
  }
  
  const rows = parseResult.data;
  const columns = parseResult.meta.fields || [];
  console.log(`📊 Parsed ${rows.length} rows from CSV`);
  console.log('📋 CSV Columns:', columns);
  
  if (rows.length === 0) {
    return { contacts: [], columns, issues: ['CSV file is empty or has no data rows'] };
  }
  
  const contacts = [];
  let skipped = 0;
  const issues = [];
  
  rows.forEach((row, index) => {
    try {
      // Flexible name extraction supporting both Connections and Contacts CSV formats
      let firstName = row['First Name'] || row['FirstName'] || row['first_name'] || row['First'] || '';
      let lastName = row['Last Name'] || row['LastName'] || row['last_name'] || row['Last'] || '';
      
      // Handle FullName or Name field by splitting
      if (!firstName && !lastName && (row['FullName'] || row['Name'])) {
        const fullName = (row['FullName'] || row['Name']).trim();
        const nameParts = fullName.split(/\s+/);
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }
      
      // Skip if no name at all
      if (!firstName && !lastName) {
        skipped++;
        if (issues.length < 5) {
          const availableFields = Object.keys(row).filter(k => row[k]).join(', ');
          issues.push(`Row ${index + 2}: No name found. Available fields: ${availableFields}`);
        }
        return;
      }
      
      // Extract email - supports both Connections (Email Address) and Contacts (Emails) formats
      let email = row['Email Address'] || row['Emails'] || row['Email'] || row['email'] || row['E-mail Address'] || '';
      if (email && email.includes(',')) {
        email = email.split(',')[0].trim(); // Take first email if multiple
      }
      
      // Extract company - supports both Connections (Company) and Contacts (Companies) formats
      let company = row['Company'] || row['Companies'] || row['Organization'] || row['company'] || '';
      if (company && company.includes(',')) {
        company = company.split(',')[0].trim(); // Take first company if multiple
      }
      
      // Build contact object
      const contact = {
        firstName: firstName,
        lastName: lastName,
        name: `${firstName} ${lastName}`.trim(),
        email: email,
        currentCompany: company,
        currentPosition: row['Position'] || row['Title'] || row['Job Title'] || row['position'] || '',
        location: row['Location'] || row['location'] || '',
        linkedinUrl: row['URL'] || row['Profiles'] || row['LinkedIn URL'] || row['Profile URL'] || row['url'] || '',
        connectedOn: row['Connected'] || row['CreatedAt'] || row['Created At'] || row['Connected On'] || row['connected_on'] || '',
        source: 'linkedin',
        tags: ['linkedin-import'],
        searchScore: Math.floor(Math.random() * 100) + 1
      };
      
      // Add company tag if available
      if (contact.currentCompany) {
        contact.tags.push(contact.currentCompany.toLowerCase().replace(/[^a-z0-9]/g, '-'));
      }
      
      // Generate placeholder profile photo
      if (firstName && lastName) {
        contact.profilePhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}+${encodeURIComponent(lastName)}&size=150&background=0D8ABC&color=fff`;
      }
      
      contacts.push(contact);
      
    } catch (err) {
      skipped++;
      if (issues.length < 5) {
        issues.push(`Row ${index + 2}: ${err.message}`);
      }
    }
  });
  
  console.log(`✅ Successfully parsed ${contacts.length} contacts, skipped ${skipped} rows`);
  if (issues.length > 0) {
    console.log('⚠️  Sample issues:', issues);
  }
  
  return { contacts, columns, issues };
}

// File upload configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// API Routes

// Root endpoint - Serve BeeTagged App HTML
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BeeTagged - AI-Powered Contact Search</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; min-height: 100vh; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 40px; }
    .header h1 { font-size: 2.5em; color: #667eea; margin-bottom: 10px; }
    .header p { color: #666; font-size: 1.1em; }
    .search-box { position: relative; margin-bottom: 30px; }
    .search-input { width: 100%; padding: 16px 20px; font-size: 1.1em; border: 2px solid #e2e8f0; border-radius: 12px; outline: none; transition: border-color 0.2s; }
    .search-input:focus { border-color: #667eea; }
    .upload-section { background: #f0f4ff; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px; }
    .upload-section h3 { color: #4a5568; margin-bottom: 10px; }
    .upload-section p { color: #718096; margin-bottom: 20px; font-size: 0.9em; }
    .upload-btn { background: #667eea; color: white; padding: 12px 30px; border: none; border-radius: 8px; font-size: 1em; cursor: pointer; }
    .upload-btn:hover { background: #5a6fd6; }
    .upload-btn:disabled { background: #a0aec0; cursor: not-allowed; }
    .status { padding: 12px; border-radius: 8px; margin-top: 15px; }
    .status.success { background: #c6f6d5; color: #276749; }
    .status.error { background: #fed7d7; color: #c53030; }
    .results { margin-top: 20px; }
    .contact-card { background: white; border-radius: 12px; padding: 20px; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .contact-name { font-size: 1.2em; font-weight: 600; color: #2d3748; margin-bottom: 5px; }
    .contact-detail { color: #718096; font-size: 0.95em; margin-bottom: 3px; }
    .hidden { display: none; }
    .loading { color: #667eea; text-align: center; padding: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🐝 BeeTagged</h1>
      <p>AI-Powered Contact Search</p>
    </div>
    
    <div class="search-box">
      <input type="text" class="search-input" id="searchInput" placeholder="Search your contacts... (e.g., 'engineers at Google' or 'founders in SF')">
    </div>
    
    <div id="results" class="results"></div>
    
    <div class="upload-section">
      <h3>📁 Import LinkedIn Contacts</h3>
      <p>Upload your LinkedIn Connections.csv or Contacts.csv file</p>
      <input type="file" id="fileInput" accept=".csv" style="display:none">
      <button class="upload-btn" id="uploadBtn" onclick="document.getElementById('fileInput').click()">Choose CSV File</button>
      <div id="uploadStatus"></div>
    </div>
  </div>

  <script>
    const API_URL = '';
    let searchTimeout;

    // Search functionality
    document.getElementById('searchInput').addEventListener('input', function(e) {
      clearTimeout(searchTimeout);
      const query = e.target.value.trim();
      
      if (query.length < 2) {
        document.getElementById('results').innerHTML = '';
        return;
      }
      
      searchTimeout = setTimeout(() => searchContacts(query), 300);
    });

    async function searchContacts(query) {
      const resultsDiv = document.getElementById('results');
      resultsDiv.innerHTML = '<div class="loading">Searching...</div>';
      
      try {
        const userId = localStorage.getItem('beetagged_user_id') || 'default';
        const response = await fetch(API_URL + '/api/contacts?userId=' + userId + '&search=' + encodeURIComponent(query));
        const data = await response.json();
        
        if (data.contacts && data.contacts.length > 0) {
          resultsDiv.innerHTML = data.contacts.map(c => 
            '<div class="contact-card">' +
              '<div class="contact-name">' + (c.firstName || '') + ' ' + (c.lastName || '') + '</div>' +
              (c.position ? '<div class="contact-detail">💼 ' + c.position + '</div>' : '') +
              (c.company ? '<div class="contact-detail">🏢 ' + c.company + '</div>' : '') +
              (c.email ? '<div class="contact-detail">📧 ' + c.email + '</div>' : '') +
            '</div>'
          ).join('');
        } else {
          resultsDiv.innerHTML = '<div class="loading">No contacts found</div>';
        }
      } catch (error) {
        resultsDiv.innerHTML = '<div class="status error">Search failed: ' + error.message + '</div>';
      }
    }

    // File upload functionality
    document.getElementById('fileInput').addEventListener('change', async function(e) {
      const file = e.target.files[0];
      if (!file) return;
      
      const btn = document.getElementById('uploadBtn');
      const status = document.getElementById('uploadStatus');
      
      btn.disabled = true;
      btn.textContent = 'Uploading...';
      status.innerHTML = '';
      
      const formData = new FormData();
      formData.append('csvFile', file);
      
      let userId = localStorage.getItem('beetagged_user_id');
      if (!userId) {
        userId = 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('beetagged_user_id', userId);
      }
      formData.append('userId', userId);
      
      try {
        const response = await fetch(API_URL + '/api/linkedin/import', {
          method: 'POST',
          body: formData
        });
        const result = await response.json();
        
        if (result.success) {
          status.innerHTML = '<div class="status success">✅ Imported ' + result.results.imported + ' contacts!</div>';
        } else {
          status.innerHTML = '<div class="status error">❌ ' + (result.error || 'Upload failed') + '</div>';
        }
      } catch (error) {
        status.innerHTML = '<div class="status error">❌ ' + error.message + '</div>';
      }
      
      btn.disabled = false;
      btn.textContent = 'Choose CSV File';
      e.target.value = '';
    });
  </script>
</body>
</html>
  `);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Health check (alternate)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Get all contacts with advanced filtering
app.get('/api/contacts', async (req, res) => {
  try {
    const { 
      userId = 'default', 
      search, 
      tags, 
      company, 
      location,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 50
    } = req.query;
    
    // Build query
    const query = { userId };
    
    // Text search across multiple fields
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { currentCompany: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { currentPosition: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by tags
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }
    
    // Filter by company
    if (company) {
      query.$or = [
        { currentCompany: { $regex: company, $options: 'i' } },
        { company: { $regex: company, $options: 'i' } }
      ];
    }
    
    // Filter by location
    if (location) {
      query.$or = [
        { location: { $regex: location, $options: 'i' } },
        { city: { $regex: location, $options: 'i' } },
        { state: { $regex: location, $options: 'i' } }
      ];
    }
    
    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const contacts = await Contact.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Contact.countDocuments(query);
    
    res.json({
      contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Get single contact by ID
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

// Create new contact
app.post('/api/contacts', async (req, res) => {
  try {
    const contactData = {
      ...req.body,
      userId: req.body.userId || 'default',
      updatedAt: new Date()
    };
    
    const contact = new Contact(contactData);
    await contact.save();
    
    res.status(201).json(contact);
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update contact
app.put('/api/contacts/:id', async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };
    
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json(contact);
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete contact
app.delete('/api/contacts/:id', async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

// LinkedIn CSV Import (supporting both old and new endpoints)
app.post('/api/import/linkedin', upload.array('file'), async (req, res) => {
  try {
    console.log('📁 === LINKEDIN CSV IMPORT STARTED ===');
    
    const uploadedFiles = req.files;
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'At least one CSV file is required' 
      });
    }
    
    console.log(`📁 Processing ${uploadedFiles.length} file(s)`);
    
    let allContacts = [];
    let processingStats = {
      filesProcessed: 0,
      totalRows: 0,
      successfulContacts: 0,
      skippedRows: 0,
      errors: []
    };
    
    // Process each uploaded file
    for (const file of uploadedFiles) {
      console.log(`📄 Processing file: ${file.originalname}`);
      
      try {
        const csvData = file.buffer.toString('utf-8');
        const parsedContacts = parseLinkedInCSV(csvData);
        
        allContacts.push(...parsedContacts);
        processingStats.filesProcessed++;
        processingStats.totalRows += parsedContacts.length;
        processingStats.successfulContacts += parsedContacts.length;
        
        console.log(`✅ File processed: ${parsedContacts.length} contacts extracted`);
        
      } catch (fileError) {
        console.error(`❌ Error processing ${file.originalname}:`, fileError);
        processingStats.errors.push({
          file: file.originalname,
          error: fileError.message
        });
      }
    }
    
    if (allContacts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid contacts found in uploaded files',
        stats: processingStats
      });
    }
    
    console.log(`🎯 Total contacts extracted: ${allContacts.length}`);
    
    // STEP 2: Import all contacts with duplicate checking
    console.log(`💾 Starting contact import...`);
    
    let insertedCount = 0;
    let skippedCount = 0;
    
    for (const contact of allContacts) {
      try {
        // Basic duplicate check by email or name
        const duplicateQuery = {
          userId: contact.userId || 'default'
        };
        
        if (contact.email) {
          duplicateQuery.email = contact.email;
        } else {
          duplicateQuery.firstName = contact.firstName;
          duplicateQuery.lastName = contact.lastName;
        }
        
        const existing = await Contact.findOne(duplicateQuery);
        if (existing) {
          skippedCount++;
          continue; // Skip duplicates
        }
        
        await Contact.create({
          ...contact,
          userId: contact.userId || 'default'
        });
        insertedCount++;
      } catch (error) {
        console.log('Skipping contact due to error:', error.message);
        skippedCount++;
      }
    }
    
    // STEP 3: Generate import summary
    const importId = Date.now().toString();
    const summary = {
      importId,
      success: true,
      stats: {
        filesProcessed: processingStats.filesProcessed,
        contactsInserted: insertedCount,
        duplicatesSkipped: skippedCount,
        totalProcessed: allContacts.length,
        errors: processingStats.errors
      },
      message: `Successfully imported ${insertedCount} contacts, skipped ${skippedCount} duplicates`
    };
    
    console.log('🎉 === IMPORT COMPLETED ===');
    console.log(`📊 Results: ${insertedCount} inserted, ${skippedCount} skipped`);
    
    res.json(summary);
    
  } catch (error) {
    console.error('❌ LinkedIn import error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Import failed: ' + error.message
    });
  }
});

// Alternative LinkedIn CSV Import endpoint
app.post('/api/linkedin/import', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const csvData = req.file.buffer.toString('utf-8');
    const userId = req.body.userId || 'default';
    
    console.log('Processing LinkedIn CSV import for user:', userId);
    
    // Parse CSV data
    const parseResult = parseLinkedInCSV(csvData);
    
    if (parseResult.contacts.length === 0) {
      console.error('❌ No contacts found. Columns:', parseResult.columns);
      return res.status(400).json({ 
        error: 'No valid contacts found in CSV',
        details: `Found columns: ${parseResult.columns.join(', ')}. Need at minimum: "First Name" and "Last Name" OR single "Name" column.`,
        columnsFound: parseResult.columns
      });
    }
    
    const parsedContacts = parseResult.contacts;
    
    // Add userId to all contacts
    const contactsWithUserId = parsedContacts.map(contact => ({
      ...contact,
      userId: userId
    }));
    
    // Bulk insert with duplicate handling
    const importResults = {
      imported: 0,
      duplicates: 0,
      errors: 0,
      contacts: []
    };
    
    for (const contactData of contactsWithUserId) {
      try {
        // Check for duplicates
        const existingContact = await Contact.findOne({
          userId: contactData.userId,
          firstName: contactData.firstName,
          lastName: contactData.lastName,
          email: contactData.email
        });
        
        if (existingContact) {
          importResults.duplicates++;
          continue;
        }
        
        const contact = new Contact(contactData);
        const savedContact = await contact.save();
        
        importResults.imported++;
        importResults.contacts.push(savedContact);
        
      } catch (error) {
        console.error('Error saving contact:', error);
        importResults.errors++;
      }
    }
    
    console.log(`Import completed: ${importResults.imported} imported, ${importResults.duplicates} duplicates, ${importResults.errors} errors`);
    
    res.json({
      success: true,
      message: `Successfully imported ${importResults.imported} contacts`,
      results: importResults
    });
    
  } catch (error) {
    console.error('LinkedIn import error:', error);
    res.status(400).json({ 
      error: 'Failed to process CSV file',
      details: error.message 
    });
  }
});

// Natural language search endpoint (backward compatibility)
app.get('/api/search/natural', async (req, res) => {
  try {
    const { q: searchQuery, userId = 'default' } = req.query;
    
    if (!searchQuery) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const query = {
      userId,
      $or: [
        { firstName: { $regex: searchQuery, $options: 'i' } },
        { lastName: { $regex: searchQuery, $options: 'i' } },
        { name: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } },
        { currentCompany: { $regex: searchQuery, $options: 'i' } },
        { company: { $regex: searchQuery, $options: 'i' } },
        { currentPosition: { $regex: searchQuery, $options: 'i' } },
        { position: { $regex: searchQuery, $options: 'i' } }
      ]
    };
    
    const contacts = await Contact.find(query).limit(50);
    
    res.json({
      query: searchQuery,
      contacts: contacts
    });
    
  } catch (error) {
    console.error('Natural search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Advanced search with ranking
app.get('/api/search', async (req, res) => {
  try {
    const { 
      q: searchQuery, 
      userId = 'default',
      filters = {}
    } = req.query;
    
    if (!searchQuery) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    // Build aggregation pipeline for advanced search
    const pipeline = [
      // Match user contacts
      { $match: { userId: userId } },
      
      // Add search score based on relevance
      {
        $addFields: {
          searchRelevance: {
            $add: [
              // Exact name matches get highest score
              {
                $cond: [
                  { $regexMatch: { input: "$firstName", regex: searchQuery, options: "i" } },
                  10, 0
                ]
              },
              {
                $cond: [
                  { $regexMatch: { input: "$lastName", regex: searchQuery, options: "i" } },
                  10, 0
                ]
              },
              // Company matches
              {
                $cond: [
                  { $regexMatch: { input: "$currentCompany", regex: searchQuery, options: "i" } },
                  5, 0
                ]
              },
              // Position matches
              {
                $cond: [
                  { $regexMatch: { input: "$currentPosition", regex: searchQuery, options: "i" } },
                  3, 0
                ]
              }
            ]
          }
        }
      },
      
      // Filter by relevance
      { $match: { searchRelevance: { $gt: 0 } } },
      
      // Sort by relevance
      { $sort: { searchRelevance: -1, createdAt: -1 } },
      
      // Limit results
      { $limit: 100 }
    ];
    
    const results = await Contact.aggregate(pipeline);
    
    res.json({
      query: searchQuery,
      results: results.length,
      contacts: results
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get contact statistics
app.get('/api/stats', async (req, res) => {
  try {
    const { userId = 'default' } = req.query;
    
    const stats = await Contact.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalContacts: { $sum: 1 },
          withEmail: { $sum: { $cond: [{ $ne: ["$email", null] }, 1, 0] } },
          withPhone: { $sum: { $cond: [{ $ne: ["$phone", null] }, 1, 0] } },
          withCompany: { $sum: { $cond: [{ $ne: ["$currentCompany", null] }, 1, 0] } },
          bySource: { $push: "$source" }
        }
      }
    ]);
    
    const topCompanies = await Contact.aggregate([
      { $match: { userId: userId, currentCompany: { $ne: null } } },
      { $group: { _id: "$currentCompany", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      overview: stats[0] || { totalContacts: 0 },
      topCompanies
    });
    
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// Serve static files (for frontend and Squarespace integration)
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/dist', express.static(path.join(__dirname, 'dist')));

// Squarespace integration endpoint
app.get('/squarespace-widget', (req, res) => {
  const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://beetagged-app-53414697acd3.herokuapp.com'
    : `http://localhost:${PORT}`;
    
  const widgetHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BeeTagged Contact Import</title>
    <style>
        .beetagged-widget {
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
            border: 2px solid #007bff;
            border-radius: 10px;
            font-family: Arial, sans-serif;
            background: #f8f9fa;
        }
        .upload-area {
            border: 2px dashed #007bff;
            border-radius: 8px;
            padding: 40px;
            text-align: center;
            margin: 20px 0;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .upload-area:hover {
            background-color: #e3f2fd;
        }
        .upload-area.dragover {
            background-color: #bbdefb;
            border-color: #0056b3;
        }
        .btn {
            background-color: #007bff;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px;
        }
        .btn:hover {
            background-color: #0056b3;
        }
        .status {
            margin: 15px 0;
            padding: 10px;
            border-radius: 5px;
        }
        .status.success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .status.error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .status.loading {
            background-color: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
        .progress-bar {
            width: 100%;
            height: 20px;
            background-color: #e9ecef;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-fill {
            height: 100%;
            background-color: #007bff;
            width: 0%;
            transition: width 0.3s ease;
        }
    </style>
</head>
<body>
    <div class="beetagged-widget">
        <h2>🐝 BeeTagged Contact Import</h2>
        <p>Upload your LinkedIn connections CSV file to import contacts</p>
        
        <div class="upload-area" id="uploadArea">
            <div>
                <strong>📁 Click to select file or drag and drop your CSV</strong>
                <br><br>
                <small>Supports LinkedIn CSV exports</small>
            </div>
            <input type="file" id="csvFile" accept=".csv" style="display: none;">
        </div>
        
        <div id="fileInfo" style="display: none;">
            <p><strong>Selected file:</strong> <span id="fileName"></span></p>
            <p><strong>Size:</strong> <span id="fileSize"></span></p>
        </div>
        
        <div class="progress-bar" id="progressBar" style="display: none;">
            <div class="progress-fill" id="progressFill"></div>
        </div>
        
        <div id="status"></div>
        
        <button class="btn" id="uploadBtn" style="display: none;">Upload Contacts</button>
        <button class="btn" id="clearBtn" style="display: none;">Clear Selection</button>
    </div>

    <script>
        const API_BASE = '${API_BASE_URL}';
        
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('csvFile');
        const fileInfo = document.getElementById('fileInfo');
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');
        const uploadBtn = document.getElementById('uploadBtn');
        const clearBtn = document.getElementById('clearBtn');
        const status = document.getElementById('status');
        const progressBar = document.getElementById('progressBar');
        const progressFill = document.getElementById('progressFill');
        
        let selectedFile = null;
        
        // File selection handlers
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('drop', handleDrop);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        
        fileInput.addEventListener('change', handleFileSelect);
        uploadBtn.addEventListener('click', uploadFile);
        clearBtn.addEventListener('click', clearSelection);
        
        function handleDragOver(e) {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        }
        
        function handleDragLeave(e) {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        }
        
        function handleDrop(e) {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFile(files[0]);
            }
        }
        
        function handleFileSelect(e) {
            const files = e.target.files;
            if (files.length > 0) {
                handleFile(files[0]);
            }
        }
        
        function handleFile(file) {
            if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
                showStatus('Please select a CSV file', 'error');
                return;
            }
            
            selectedFile = file;
            fileName.textContent = file.name;
            fileSize.textContent = formatFileSize(file.size);
            
            fileInfo.style.display = 'block';
            uploadBtn.style.display = 'inline-block';
            clearBtn.style.display = 'inline-block';
            
            showStatus('File selected and ready to upload', 'success');
        }
        
        function clearSelection() {
            selectedFile = null;
            fileInput.value = '';
            fileInfo.style.display = 'none';
            uploadBtn.style.display = 'none';
            clearBtn.style.display = 'none';
            progressBar.style.display = 'none';
            status.innerHTML = '';
        }
        
        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
        
        function showStatus(message, type) {
            status.innerHTML = '<div class="status ' + type + '">' + message + '</div>';
        }
        
        function updateProgress(percent) {
            progressBar.style.display = 'block';
            progressFill.style.width = percent + '%';
        }
        
        async function uploadFile() {
            if (!selectedFile) {
                showStatus('Please select a file first', 'error');
                return;
            }
            
            const formData = new FormData();
            formData.append('file', selectedFile);
            
            try {
                showStatus('Uploading and processing CSV...', 'loading');
                updateProgress(0);
                
                // Simulate progress updates
                const progressInterval = setInterval(() => {
                    const currentWidth = parseInt(progressFill.style.width) || 0;
                    if (currentWidth < 80) {
                        updateProgress(currentWidth + 10);
                    }
                }, 200);
                
                const response = await fetch(API_BASE + '/api/import/linkedin', {
                    method: 'POST',
                    body: formData
                });
                
                clearInterval(progressInterval);
                updateProgress(100);
                
                const result = await response.json();
                
                if (response.ok && result.success) {
                    showStatus(
                        '✅ Success! Imported ' + result.stats.contactsInserted + ' contacts. ' +
                        (result.stats.duplicatesSkipped > 0 ? 'Skipped ' + result.stats.duplicatesSkipped + ' duplicates.' : ''),
                        'success'
                    );
                    
                    // Auto-clear after successful upload
                    setTimeout(() => {
                        clearSelection();
                    }, 3000);
                } else {
                    throw new Error(result.message || 'Upload failed');
                }
                
            } catch (error) {
                showStatus('❌ Upload failed: ' + error.message, 'error');
                progressBar.style.display = 'none';
            }
        }
    </script>
</body>
</html>
  `;
  
  res.send(widgetHTML);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`BeeTagged Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`MongoDB: ${process.env.MONGODB_URI ? 'configured' : 'using local fallback'}`);
});