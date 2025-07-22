// Simplified BeeTagged server for Heroku deployment
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple CORS middleware (avoiding external dependency)
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

// MongoDB connection
const mongoose = require('mongoose');
let contactIdCounter = 1;
let tagIdCounter = 1;

// Connect to MongoDB
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));
}

// MongoDB Schemas
const contactSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  name: String,
  email: String,
  phone: String,
  company: String,
  position: String,
  location: String,
  tags: [String],
  source: String,
  createdAt: { type: Date, default: Date.now }
});

const tagSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  name: String,
  category: String,
  count: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now }
});

const Contact = mongoose.model('Contact', contactSchema);
const Tag = mongoose.model('Tag', tagSchema);

// In-memory fallback for development
let contacts = [];
let tags = [];

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// File upload setup
const multer = require('multer');
const csv = require('csv-parser');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
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

// LinkedIn CSV parser function
function parseLinkedInCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        try {
          // Enhanced field mapping for different LinkedIn CSV formats
          const firstName = row['First Name'] || row['firstName'] || '';
          const lastName = row['Last Name'] || row['lastName'] || '';
          const name = firstName && lastName ? `${firstName} ${lastName}` : 
                      row['Name'] || row['name'] || 
                      row['Full Name'] || row['fullName'] || '';
          
          const contact = {
            name: name.trim(),
            email: row['Email Address'] || row['email'] || row['Email'] || '',
            company: row['Company'] || row['Current Company'] || row['company'] || 
                    row['Organization'] || row['organization'] || '',
            title: row['Position'] || row['Title'] || row['title'] || 
                   row['Job Title'] || row['jobTitle'] || '',
            location: row['Location'] || row['location'] || row['Region'] || '',
            source: 'linkedin_import',
            picture: 'https://cdn.jsdelivr.net/npm/simple-icons@v6/icons/linkedin.svg',
            tags: []
          };
          
          // Generate intelligent tags based on the contact data
          if (contact.company) {
            contact.tags.push(contact.company);
          }
          if (contact.title) {
            contact.tags.push(contact.title);
          }
          if (contact.location) {
            contact.tags.push(contact.location);
          }
          
          if (contact.name && contact.name.trim() !== '') {
            results.push(contact);
          }
        } catch (error) {
          console.error('Error parsing row:', error);
        }
      })
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.get('/api/contacts', (req, res) => {
  console.log(`Returning ${contacts.length} contacts`);
  res.json(contacts);
});

app.post('/api/contacts', (req, res) => {
  const newContact = {
    id: contactIdCounter++,
    ...req.body,
    createdAt: new Date().toISOString()
  };
  contacts.push(newContact);
  res.json(newContact);
});

app.get('/api/tags', (req, res) => {
  res.json(tags);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    server: 'BeeTagged',
    contacts: contacts.length,
    port: PORT,
    uptime: process.uptime()
  });
});

// Status endpoint
app.get('/status', (req, res) => {
  res.json({
    server: 'BeeTagged LinkedIn Import Server',
    status: 'running',
    environment: process.env.NODE_ENV || 'production',
    port: PORT,
    features: {
      contactManagement: true,
      staticFiles: fs.existsSync(path.join(__dirname, 'public', 'index.html'))
    },
    stats: {
      contacts: contacts.length,
      uptime: process.uptime()
    }
  });
});

// LinkedIn import page
app.get('/li-import', (req, res) => {
  const html = `<!DOCTYPE html>
<html>
<head>
    <title>LinkedIn Import</title>
    <style>
        body { font-family: Arial; margin: 40px; background: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
        h1 { color: #0077b5; }
        .upload-area { border: 2px dashed #0077b5; padding: 40px; text-align: center; border-radius: 10px; margin: 20px 0; }
        button { background: #0077b5; color: white; padding: 15px 30px; border: none; border-radius: 5px; cursor: pointer; }
        .success { color: #059669; background: #dcfce7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .error { color: #dc2626; background: #fef2f2; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>LinkedIn Import</h1>
        <form action="/api/import/linkedin" method="post" enctype="multipart/form-data">
            <div class="upload-area">
                <h3>Upload LinkedIn CSV</h3>
                <input type="file" name="linkedinCsv" accept=".csv" required>
                <br><br>
                <button type="submit">Import Contacts</button>
            </div>
        </form>
        <div id="result"></div>
        <a href="/">← Back to Dashboard</a>
    </div>
</body>
</html>`;
  res.send(html);
});

// LinkedIn import API endpoint
app.post('/api/import/linkedin', upload.single('linkedinCsv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No CSV file uploaded' });
    }

    const importedContacts = await parseLinkedInCSV(req.file.path);
    
    if (!importedContacts || importedContacts.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No valid contacts found in CSV file' 
      });
    }
    
    // Clear existing LinkedIn imports from both memory and database
    contacts = contacts.filter(c => c.source !== 'linkedin_import');
    
    if (process.env.MONGODB_URI) {
      await Contact.deleteMany({ source: 'linkedin_import' });
    }
    
    // Process and store contacts
    const savedContacts = [];
    for (const contact of importedContacts) {
      const newContact = {
        id: contactIdCounter++,
        name: contact.name,
        email: contact.email || '',
        company: contact.company || '',
        title: contact.title || '',
        location: contact.location || '',
        source: 'linkedin_import',
        picture: contact.picture,
        createdAt: new Date().toISOString(),
        tags: contact.tags
      };
      
      // Add to memory array
      contacts.push(newContact);
      
      // Save to MongoDB if available
      if (process.env.MONGODB_URI) {
        try {
          const mongoContact = new Contact(newContact);
          await mongoContact.save();
          savedContacts.push(mongoContact);
        } catch (error) {
          console.log('Duplicate contact, skipping:', newContact.name);
        }
      }
    }
    
    // Clean up uploaded file
    fs.unlink(req.file.path, () => {});
    
    console.log(`Successfully imported ${importedContacts.length} contacts from LinkedIn`);
    console.log('Sample contact:', importedContacts[0]);
    
    res.json({
      success: true,
      message: `Successfully imported ${importedContacts.length} contacts from LinkedIn`,
      count: importedContacts.length,
      totalContacts: contacts.length,
      contacts: contacts.slice(-10) // Return last 10 contacts for UI refresh
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

// Natural language search API endpoint
app.get('/api/search/natural', (req, res) => {
  try {
    const query = req.query.q;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ 
        message: 'Search query is required' 
      });
    }

    const searchTerm = query.toLowerCase();
    
    // Natural language search across multiple fields
    const searchResults = contacts.filter(contact => {
      // Search in name
      if (contact.name && contact.name.toLowerCase().includes(searchTerm)) {
        return true;
      }
      
      // Search in company
      if (contact.company && contact.company.toLowerCase().includes(searchTerm)) {
        return true;
      }
      
      // Search in title/position
      if (contact.title && contact.title.toLowerCase().includes(searchTerm)) {
        return true;
      }
      
      // Search in location
      if (contact.location && contact.location.toLowerCase().includes(searchTerm)) {
        return true;
      }
      
      // Search in email
      if (contact.email && contact.email.toLowerCase().includes(searchTerm)) {
        return true;
      }
      
      // Search in tags
      if (contact.tags && contact.tags.some(tag => 
        tag.toLowerCase().includes(searchTerm))) {
        return true;
      }
      
      return false;
    });

    // Enhanced natural language processing for specific patterns
    let contextualResults = searchResults;
    
    // Handle "who works at" or "at" queries
    if (searchTerm.includes('who works at') || searchTerm.includes('at ')) {
      const companyMatch = searchTerm.match(/(?:who works at|at)\s+([^?]+)/i);
      if (companyMatch) {
        const company = companyMatch[1].trim();
        contextualResults = contacts.filter(contact => 
          contact.company && contact.company.toLowerCase().includes(company.toLowerCase())
        );
      }
    }
    
    // Handle "who is" queries
    if (searchTerm.includes('who is') || searchTerm.includes('who are')) {
      const roleMatch = searchTerm.match(/who (?:is|are)\s+([^?]+)/i);
      if (roleMatch) {
        const role = roleMatch[1].trim();
        contextualResults = contacts.filter(contact => 
          contact.title && contact.title.toLowerCase().includes(role.toLowerCase())
        );
      }
    }
    
    // Handle location-based queries
    if (searchTerm.includes('in ') || searchTerm.includes('from ')) {
      const locationMatch = searchTerm.match(/(?:in|from)\s+([^?]+)/i);
      if (locationMatch) {
        const location = locationMatch[1].trim();
        contextualResults = contacts.filter(contact => 
          contact.location && contact.location.toLowerCase().includes(location.toLowerCase())
        );
      }
    }

    res.json({
      results: contextualResults,
      query: query,
      count: contextualResults.length
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      message: 'Search failed',
      error: error.message 
    });
  }
});

// Squarespace LinkedIn Import route
app.get('/squarespace-linkedin-import', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LinkedIn Import - BeeTagged</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0077B5 0%, #005582 100%);
      margin: 0;
      padding: 20px;
      min-height: 100vh;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      overflow: hidden;
    }
    .header {
      background: #0077B5;
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      font-size: 28px;
      margin: 0 0 10px 0;
    }
    .header p {
      opacity: 0.9;
      font-size: 16px;
      margin: 0;
    }
    .content {
      padding: 40px;
    }
    .steps {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      text-align: center;
    }
    .step {
      flex: 1;
      padding: 20px;
      background: #f8fbff;
      border-radius: 8px;
      margin: 0 10px;
      border: 2px solid #e8f4fd;
    }
    .step h3 {
      color: #0077B5;
      margin: 0 0 10px 0;
    }
    .step p {
      color: #666;
      font-size: 14px;
      margin: 0;
    }
    .upload-area {
      border: 2px dashed #0077B5;
      border-radius: 8px;
      padding: 40px 20px;
      text-align: center;
      background: #f8fbff;
      margin: 20px 0;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .upload-area:hover {
      background: #e8f4fd;
    }
    .upload-area.dragover {
      background: #e8f4fd;
      border-color: #005582;
    }
    .upload-icon {
      font-size: 48px;
      margin-bottom: 20px;
    }
    .file-input {
      display: none;
    }
    .btn {
      background: #0077B5;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.3s ease;
    }
    .btn:hover {
      background: #005582;
    }
    .btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    .selected-file {
      margin-top: 20px;
      padding: 15px;
      background: #e8f4fd;
      border-radius: 6px;
      color: #0077B5;
      display: none;
    }
    .result {
      margin-top: 20px;
      padding: 15px;
      border-radius: 6px;
      display: none;
    }
    .success {
      background: #e8f5e9;
      color: #2e7d32;
      border: 1px solid #c8e6c9;
    }
    .error {
      background: #ffebee;
      color: #c62828;
      border: 1px solid #ffcdd2;
    }
    .loading {
      text-align: center;
      padding: 20px;
      display: none;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #0077B5;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .instructions {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 6px;
      padding: 20px;
      margin: 20px 0;
    }
    .instructions h3 {
      color: #856404;
      margin: 0 0 15px 0;
    }
    .instructions ol {
      margin: 0 0 0 20px;
      color: #856404;
    }
    .instructions li {
      margin-bottom: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>LinkedIn</h1>
      <p>Import LinkedIn Connections to BeeTagged</p>
    </div>
    
    <div class="content">
      <p>Easily import your LinkedIn professional network into the BeeTagged app to organize and manage your contacts.</p>
      
      <div class="steps">
        <div class="step">
          <h3>Step 1: Export</h3>
          <p>Use a desktop computer to export your LinkedIn connections as a CSV file.</p>
        </div>
        <div class="step">
          <h3>Step 2: Upload</h3>
          <p>Upload your CSV file to import contacts directly into BeeTagged.</p>
        </div>
        <div class="step">
          <h3>Step 3: Search</h3>
          <p>Search through your imported contacts using natural language queries.</p>
        </div>
      </div>
      
      <div class="instructions">
        <h3>📋 How to Export Your LinkedIn Connections:</h3>
        <ol>
          <li>Go to LinkedIn Settings & Privacy → Data privacy</li>
          <li>Click "Get a copy of your data"</li>
          <li>Select "Connections" and request archive</li>
          <li>Download the CSV file when ready</li>
          <li>Upload it below</li>
        </ol>
      </div>
      
      <div id="upload-area" class="upload-area">
        <div class="upload-icon">📄</div>
        <div><strong>Import Your Connections</strong></div>
        <p>Drop your LinkedIn CSV file here or click to browse</p>
        <input type="file" id="file-input" class="file-input" accept=".csv">
        <button id="browse-btn" class="btn">Choose File</button>
        <div id="selected-file" class="selected-file"></div>
        <button id="upload-btn" class="btn" style="display: none;">Import Connections</button>
      </div>
      
      <div id="loading" class="loading">
        <div class="spinner"></div>
        <p>Processing your LinkedIn connections...</p>
      </div>
      
      <div id="result" class="result"></div>
      
      <p><small><strong>Note:</strong> Desktop computer required for LinkedIn data export. Your data is securely transmitted and only accessible by you.</small></p>
    </div>
  </div>

  <script>
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const uploadArea = document.getElementById('upload-area');
    const selectedFileEl = document.getElementById('selected-file');
    const uploadBtn = document.getElementById('upload-btn');
    const loading = document.getElementById('loading');
    const result = document.getElementById('result');
    let selectedFile = null;

    function showResult(message, type) {
      result.className = 'result ' + type;
      result.textContent = message;
      result.style.display = 'block';
    }

    browseBtn.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
      }
    });

    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });

    function handleFileSelect(file) {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        showResult('Please upload a CSV file exported from LinkedIn.', 'error');
        return;
      }

      selectedFile = file;
      selectedFileEl.textContent = 'Selected: ' + file.name;
      selectedFileEl.style.display = 'block';
      uploadBtn.style.display = 'inline-block';
      result.style.display = 'none';
    }

    uploadBtn.addEventListener('click', async () => {
      if (!selectedFile) {
        showResult('Please select a file to upload.', 'error');
        return;
      }

      loading.style.display = 'block';
      uploadBtn.disabled = true;
      result.style.display = 'none';

      const formData = new FormData();
      formData.append('linkedinCsv', selectedFile);

      try {
        const response = await fetch('/api/import/linkedin', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();
        loading.style.display = 'none';

        if (data.success) {
          showResult('Successfully imported ' + data.count + ' LinkedIn connections! Redirecting to app...', 'success');
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        } else {
          showResult('Error: ' + (data.message || 'Failed to import connections'), 'error');
        }
      } catch (error) {
        loading.style.display = 'none';
        showResult('Error: ' + error.message, 'error');
      }

      uploadBtn.disabled = false;
    });
  </script>
</body>
</html>
  `;
  res.send(html);
});

// Homepage route - fully functional BeeTagged app
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
                <input type="text" id="searchInput" class="search-bar" placeholder="Try: 'Who works at Google?', 'Marketing contacts in NYC', 'People in Seattle'..." onkeyup="handleSearch(event)">
                
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
                    statusDiv.innerHTML = \`<div style="color: green; font-weight: bold;">✅ Successfully imported \${result.count} contacts!</div>\`;
                    setTimeout(() => showSearch(), 1500);
                } else {
                    statusDiv.innerHTML = \`<div style="color: red;">❌ Import failed: \${result.message}</div>\`;
                }
            } catch (error) {
                statusDiv.innerHTML = \`<div style="color: red;">❌ Upload error: \${error.message}</div>\`;
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
            
            const contactsHtml = contactList.map(contact => \`
                <div class="contact-item">
                    <div>
                        <strong>\${contact.name || 'Unknown'}</strong>
                        <div style="font-size: 14px; color: #666;">
                            \${contact.position || ''} \${contact.position && contact.company ? 'at' : ''} \${contact.company || ''}
                        </div>
                        <div style="font-size: 12px; color: #999;">
                            \${contact.location || ''} \${contact.tags ? '• ' + contact.tags.join(', ') : ''}
                        </div>
                    </div>
                    <div style="font-size: 12px; color: #666;">
                        \${contact.email || ''}
                    </div>
                </div>
            \`).join('');
            
            resultsDiv.innerHTML = \`
                <div style="margin-bottom: 15px; font-weight: bold;">Found \${contactList.length} contacts</div>
                <div class="contact-list">\${contactsHtml}</div>
            \`;
        }
        
        async function handleSearch(event) {
            const query = event.target.value.trim();
            
            if (query.length < 2) {
                displayContacts(contacts);
                return;
            }
            
            try {
                const response = await fetch(\`/api/search/natural?q=\${encodeURIComponent(query)}\`);
                const result = await response.json();
                displayContacts(result.results || []);
            } catch (error) {
                console.error('Search error:', error);
                displayContacts([]);
            }
        }
        
        // Initialize
        showHome();
    </script>
</body>
</html>`;
    res.send(html);
});

// Catch-all for React Router
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.redirect('/');
  }
});

// Start server with proper error handling
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`BeeTagged Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`Build exists: ${fs.existsSync(path.join(__dirname, 'public', 'index.html'))}`);
  console.log(`Server started successfully`);
});

// Handle server errors
server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});