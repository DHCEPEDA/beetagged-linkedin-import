/* 
 * BEETAGGED BACKEND API - FIXED VERSION
 * 
 * Instructions for Replit Setup:
 * 1. Create a new Node.js Repl in Replit
 * 2. Replace the contents of index.js with this file
 * 3. Install dependencies: npm install express mongoose cors dotenv multer helmet compression morgan express-rate-limit
 * 4. Set environment variables in Replit Secrets:
 *    - MONGODB_URI: Your MongoDB Atlas connection string
 *    - PORT: 5000
 *    - NODE_ENV: production
 * 5. Run the application
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
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

// Enhanced CORS configuration for Squarespace
app.use(cors({
  origin: function (origin, callback) {
    const prodOrigins = [
      'https://www.beetagged.com',
      'https://beetagged.com'
    ];
    
    const devOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://127.0.0.1:3000',
      'https://replit.dev'
    ];
    
    let allowedOrigins;
    if (process.env.NODE_ENV === 'production') {
      allowedOrigins = prodOrigins;
    } else {
      allowedOrigins = [...prodOrigins, ...devOrigins];
    }
    
    // Check for exact origin match, Squarespace domains, or replit dev domains
    const isAllowed = !origin || // Same origin requests (server-to-server)
      allowedOrigins.includes(origin) ||
      (origin && (
        origin.includes('.squarespace.com') ||
        origin.includes('.squarespace-cdn.com') ||
        origin.includes('static1.squarespace.com') ||
        origin.includes('squarespace.com') ||
        origin.includes('beattagged.squarespace.com') ||
        origin.startsWith('https://') && origin.includes('squarespace')
      )) ||
      (process.env.NODE_ENV !== 'production' && origin && (
        origin.includes('.replit.dev') || 
        origin.includes('.repl.co')
      ));
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔧 Development mode: allowing origin for debugging');
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS policy'));
      }
    }
  },
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept', 'Cache-Control']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Trust proxy for deployment platforms
app.set('trust proxy', 1);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only CSV files
    if (file.mimetype === 'text/csv' || 
        file.originalname.toLowerCase().endsWith('.csv') ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed!'), false);
    }
  }
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/beetagged';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ Connected to MongoDB successfully');
  console.log('📊 Database:', mongoose.connection.name);
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
  console.log('⚠️  Server will continue but database operations will fail');
});

// Enhanced Contact Schema
const contactSchema = new mongoose.Schema({
  // Basic Information
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  name: { type: String },
  email: { type: String, sparse: true },
  phone: { type: String },
  
  // LinkedIn Profile Data
  linkedinUrl: { type: String },
  profilePhoto: { type: String },
  headline: { type: String },
  summary: { type: String },
  
  // Location Information
  location: { type: String },
  city: { type: String },
  state: { type: String },
  country: { type: String },
  
  // Professional Information
  currentCompany: { type: String },
  company: { type: String },
  currentPosition: { type: String },
  position: { type: String },
  industry: { type: String },
  
  // Connection Info
  connectedOn: { type: String },
  
  // Tags and Categories
  tags: [{ type: String }],
  categories: [{ type: String }],
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  
  // Metadata
  userId: { type: String, default: 'default-user' },
  source: { type: String, default: 'linkedin' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Pre-save middleware
contactSchema.pre('save', function(next) {
  if (this.firstName && this.lastName && !this.name) {
    this.name = `${this.firstName} ${this.lastName}`;
  }
  
  if (this.name && (!this.firstName || !this.lastName)) {
    const nameParts = this.name.split(' ');
    if (!this.firstName) this.firstName = nameParts[0] || '';
    if (!this.lastName) this.lastName = nameParts.slice(1).join(' ') || '';
  }
  
  if (this.currentCompany && !this.company) {
    this.company = this.currentCompany;
  }
  if (this.company && !this.currentCompany) {
    this.currentCompany = this.company;
  }
  
  if (this.currentPosition && !this.position) {
    this.position = this.currentPosition;
  }
  if (this.position && !this.currentPosition) {
    this.currentPosition = this.position;
  }
  
  next();
});

// Create indexes for better query performance
contactSchema.index({ email: 1 });
contactSchema.index({ userId: 1 });
contactSchema.index({ firstName: 1, lastName: 1 });
contactSchema.index({ company: 1 });

const Contact = mongoose.model('Contact', contactSchema);

// Helper function to parse CSV
function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const contacts = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length >= headers.length - 1) { // Allow for minor discrepancies
      const contact = {};
      headers.forEach((header, index) => {
        if (values[index] !== undefined) {
          contact[header] = values[index].trim().replace(/"/g, '');
        }
      });
      contacts.push(contact);
    }
  }

  return contacts;
}

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  
  return values;
}

// Helper function to generate tags
function generateTags(contact) {
  const tags = [];

  const company = contact['Company'] || contact['company'] || contact['currentCompany'] || '';
  if (company) {
    tags.push(`company:${company}`);
  }

  const position = contact['Position'] || contact['position'] || contact['Job Title'] || '';
  if (position) {
    const positionLower = position.toLowerCase();
    
    if (positionLower.includes('ceo') || positionLower.includes('founder')) {
      tags.push('role:founder');
    } else if (positionLower.includes('cto') || positionLower.includes('chief technology')) {
      tags.push('role:cto');
    } else if (positionLower.includes('engineer')) {
      tags.push('role:engineer');
    } else if (positionLower.includes('manager')) {
      tags.push('role:manager');
    } else if (positionLower.includes('director')) {
      tags.push('role:director');
    } else if (positionLower.includes('vp') || positionLower.includes('vice president')) {
      tags.push('role:vp');
    } else if (positionLower.includes('analyst')) {
      tags.push('role:analyst');
    } else if (positionLower.includes('designer')) {
      tags.push('role:designer');
    } else if (positionLower.includes('developer')) {
      tags.push('role:developer');
    }
    
    tags.push(`position:${position}`);
  }

  const connectedOn = contact['Connected On'] || contact['connected on'] || '';
  if (connectedOn) {
    const year = connectedOn.split(/[-\/\s]/)[0];
    if (year && year.length === 4) {
      tags.push(`connected:${year}`);
    }
  }

  tags.push('source:linkedin');

  return tags;
}

// API Routes

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Get API status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    version: '1.0.0',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    endpoints: {
      upload: '/api/import/linkedin',
      contacts: '/api/contacts',
      widget: '/widget'
    }
  });
});

// LinkedIn CSV Import Endpoint
app.post('/api/import/linkedin', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    console.log('📁 Processing file:', req.file.originalname);

    // Read the uploaded file
    const csvText = fs.readFileSync(req.file.path, 'utf8');
    
    // Parse CSV
    const contacts = parseCSV(csvText);
    
    if (contacts.length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'No valid contacts found in CSV file'
      });
    }

    console.log(`📊 Parsed ${contacts.length} contacts from CSV`);

    // Process and save contacts
    let contactsInserted = 0;
    let duplicatesSkipped = 0;
    let errors = 0;

    for (const contactData of contacts) {
      try {
        // Map CSV fields to schema fields
        const firstName = contactData['First Name'] || contactData['first name'] || '';
        const lastName = contactData['Last Name'] || contactData['last name'] || '';
        const email = contactData['Email Address'] || contactData['email'] || contactData['Email'] || '';
        const company = contactData['Company'] || contactData['company'] || '';
        const position = contactData['Position'] || contactData['position'] || contactData['Job Title'] || '';
        const connectedOn = contactData['Connected On'] || contactData['connected on'] || '';

        // Skip if no first name or last name
        if (!firstName && !lastName) {
          errors++;
          continue;
        }

        // Generate tags
        const tags = generateTags(contactData);

        // Check for duplicate by email or name
        let existingContact = null;
        if (email) {
          existingContact = await Contact.findOne({ email: email });
        }
        if (!existingContact && firstName && lastName) {
          existingContact = await Contact.findOne({ 
            firstName: firstName, 
            lastName: lastName 
          });
        }

        if (existingContact) {
          duplicatesSkipped++;
          continue;
        }

        // Create new contact
        const newContact = new Contact({
          firstName,
          lastName,
          email,
          company,
          position,
          connectedOn,
          tags,
          source: 'linkedin'
        });

        await newContact.save();
        contactsInserted++;

      } catch (err) {
        console.error('Error processing contact:', err);
        errors++;
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    console.log(`✅ Import complete: ${contactsInserted} inserted, ${duplicatesSkipped} duplicates, ${errors} errors`);

    res.json({
      success: true,
      message: 'Contacts imported successfully',
      stats: {
        totalProcessed: contacts.length,
        contactsInserted,
        duplicatesSkipped,
        errors
      }
    });

  } catch (error) {
    console.error('❌ Import error:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Error importing contacts',
      error: error.message
    });
  }
});

// Get all contacts
app.get('/api/contacts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const contacts = await Contact.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Contact.countDocuments();

    res.json({
      success: true,
      contacts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contacts',
      error: error.message
    });
  }
});

// Get contact by ID
app.get('/api/contacts/:id', async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      contact
    });
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contact',
      error: error.message
    });
  }
});

// Delete contact
app.delete('/api/contacts/:id', async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting contact',
      error: error.message
    });
  }
});

// Search contacts
app.get('/api/contacts/search', async (req, res) => {
  try {
    const { query, tag } = req.query;
    
    let searchQuery = {};
    
    if (query) {
      searchQuery.$or = [
        { firstName: new RegExp(query, 'i') },
        { lastName: new RegExp(query, 'i') },
        { email: new RegExp(query, 'i') },
        { company: new RegExp(query, 'i') },
        { position: new RegExp(query, 'i') }
      ];
    }
    
    if (tag) {
      searchQuery.tags = tag;
    }

    const contacts = await Contact.find(searchQuery)
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      contacts,
      count: contacts.length
    });
  } catch (error) {
    console.error('Error searching contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching contacts',
      error: error.message
    });
  }
});

// Widget endpoint for Squarespace
app.get('/widget', (req, res) => {
  const API_BASE_URL = process.env.API_BASE_URL || `http://localhost:${PORT}`;
  
  const widgetHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BeeTagged Contact Import</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        .beetagged-widget {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            max-width: 600px;
            margin: 20px auto;
            padding: 30px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        h2 {
            color: #333;
            margin-bottom: 10px;
        }
        p {
            color: #666;
            margin-bottom: 20px;
        }
        .upload-area {
            border: 3px dashed #667eea;
            border-radius: 8px;
            padding: 40px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            background: #f8f9ff;
            margin-bottom: 20px;
        }
        .upload-area:hover, .upload-area.dragover {
            border-color: #764ba2;
            background: #f0f2ff;
        }
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 6px;
            font-size: 1em;
            cursor: pointer;
            margin: 10px 5px;
            transition: transform 0.2s ease;
        }
        .btn:hover {
            transform: translateY(-2px);
        }
        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .status {
            margin-top: 15px;
            padding: 15px;
            border-radius: 5px;
        }
        .status.success {
            background-color: #d4edda;
            color: #155724;
        }
        .status.error {
            background-color: #f8d7da;
            color: #721c24;
        }
        .status.loading {
            background-color: #d1ecf1;
            color: #0c5460;
        }
        .progress-bar {
            width: 100%;
            height: 20px;
            background-color: #e9ecef;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
            display: none;
        }
        .progress-fill {
            height: 100%;
            background-color: #667eea;
            width: 0%;
            transition: width 0.3s ease;
        }
        #fileInfo {
            background: #f8f9ff;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
            display: none;
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
                <small>Supports LinkedIn CSV exports (Contacts.csv or Connections.csv)</small>
            </div>
            <input type="file" id="csvFile" accept=".csv" style="display: none;">
        </div>
        
        <div id="fileInfo">
            <p><strong>Selected file:</strong> <span id="fileName"></span></p>
            <p><strong>Size:</strong> <span id="fileSize"></span></p>
        </div>
        
        <div class="progress-bar" id="progressBar">
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
            if (!file.name.toLowerCase().endsWith('.csv')) {
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
                uploadBtn.disabled = true;
                showStatus('Uploading and processing CSV...', 'loading');
                updateProgress(30);
                
                const response = await fetch(API_BASE + '/api/import/linkedin', {
                    method: 'POST',
                    body: formData
                });
                
                updateProgress(80);
                const result = await response.json();
                updateProgress(100);
                
                if (response.ok && result.success) {
                    showStatus(
                        '✅ Success! Imported ' + result.stats.contactsInserted + ' contacts. ' +
                        (result.stats.duplicatesSkipped > 0 ? 'Skipped ' + result.stats.duplicatesSkipped + ' duplicates.' : ''),
                        'success'
                    );
                    
                    setTimeout(() => {
                        clearSelection();
                    }, 3000);
                } else {
                    throw new Error(result.message || 'Upload failed');
                }
                
            } catch (error) {
                showStatus('❌ Upload failed: ' + error.message, 'error');
                uploadBtn.disabled = false;
            } finally {
                setTimeout(() => {
                    progressBar.style.display = 'none';
                    progressFill.style.width = '0%';
                }, 2000);
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
  console.error('❌ Error:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 50MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  res.status(500).json({ 
    success: false,
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n🐝 BeeTagged Server Started!');
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 MongoDB: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting...'}`);
  console.log(`\n📡 API Endpoints:`);
  console.log(`   POST ${process.env.API_BASE_URL || `http://localhost:${PORT}`}/api/import/linkedin`);
  console.log(`   GET  ${process.env.API_BASE_URL || `http://localhost:${PORT}`}/api/contacts`);
  console.log(`   GET  ${process.env.API_BASE_URL || `http://localhost:${PORT}`}/widget`);
  console.log(`\n✅ Server ready to accept connections\n`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  mongoose.connection.close(false, () => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});
