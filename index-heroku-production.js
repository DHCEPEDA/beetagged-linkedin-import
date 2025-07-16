// BeeTagged Production Server for Heroku deployment
const express = require('express');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable compression for production
app.use(compression());

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple CORS middleware
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

// Connect to MongoDB
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB connection error:', err));
} else {
  console.warn('No MONGODB_URI found - using memory storage');
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
let contactIdCounter = 1;
let tagIdCounter = 1;

// Helper functions for database operations
async function getContacts() {
  if (mongoose.connection.readyState === 1) {
    return await Contact.find().sort({ createdAt: -1 });
  }
  return contacts;
}

async function saveContact(contactData) {
  if (mongoose.connection.readyState === 1) {
    const contact = new Contact(contactData);
    return await contact.save();
  } else {
    contacts.push(contactData);
    return contactData;
  }
}

async function getContactCount() {
  if (mongoose.connection.readyState === 1) {
    return await Contact.countDocuments();
  }
  return contacts.length;
}

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
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

/**
 * LinkedIn CSV Parser - Production version with MongoDB support
 */
async function parseLinkedInCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = fs.createReadStream(filePath);
    
    stream.pipe(csv())
      .on('data', (row) => {
        try {
          const contact = {
            id: contactIdCounter++,
            name: row['First Name'] && row['Last Name'] ? 
              `${row['First Name']} ${row['Last Name']}` : 
              row['Name'] || row['Full Name'] || 'Unknown',
            email: row['Email Address'] || row['Email'] || '',
            phone: row['Phone'] || row['Phone Number'] || '',
            company: row['Company'] || row['Current Company'] || '',
            position: row['Position'] || row['Job Title'] || row['Current Position'] || '',
            location: row['Location'] || row['Current Location'] || '',
            tags: [],
            source: 'linkedin_csv',
            createdAt: new Date()
          };
          
          if (contact.name && contact.name !== 'Unknown') {
            results.push(contact);
          }
        } catch (error) {
          console.error('Error parsing row:', error);
        }
      })
      .on('end', () => {
        console.log(`Parsed ${results.length} contacts from LinkedIn CSV`);
        resolve(results);
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        reject(error);
      });
  });
}

// Static file serving
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main React app with full functionality
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Public landing page for marketing/squarespace
app.get('/landing', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BeeTagged - Professional Contact Intelligence</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0077B5 0%, #005582 100%);
      min-height: 100vh;
      color: #333;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      color: white;
      padding: 60px 0;
    }
    .header h1 {
      font-size: 3.5em;
      margin-bottom: 20px;
      font-weight: 700;
    }
    .header p {
      font-size: 1.5em;
      opacity: 0.9;
      margin-bottom: 30px;
    }
    .production-badge {
      background: #28a745;
      color: white;
      padding: 12px 24px;
      border-radius: 25px;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      display: inline-block;
      margin-bottom: 40px;
    }
    .main-content {
      background: white;
      border-radius: 20px;
      padding: 60px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.1);
      margin-bottom: 40px;
    }
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 40px;
      margin-bottom: 60px;
    }
    .feature {
      text-align: center;
      padding: 30px;
      background: #f8fbff;
      border-radius: 15px;
      border: 2px solid #e8f4fd;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .feature:hover {
      transform: translateY(-10px);
      box-shadow: 0 15px 40px rgba(0,0,0,0.1);
    }
    .feature-icon {
      font-size: 60px;
      margin-bottom: 20px;
    }
    .feature h3 {
      color: #0077B5;
      font-size: 1.5em;
      margin-bottom: 15px;
    }
    .feature p {
      color: #666;
      line-height: 1.6;
    }
    .cta-section {
      text-align: center;
      margin: 60px 0;
    }
    .cta-section h2 {
      color: #0077B5;
      font-size: 2.5em;
      margin-bottom: 30px;
    }
    .cta-buttons {
      display: flex;
      justify-content: center;
      gap: 20px;
      flex-wrap: wrap;
    }
    .btn {
      background: linear-gradient(135deg, #0077B5 0%, #005582 100%);
      color: white;
      border: none;
      padding: 20px 40px;
      border-radius: 30px;
      font-size: 18px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      display: inline-block;
      box-shadow: 0 5px 20px rgba(0,119,181,0.3);
    }
    .btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(0,119,181,0.4);
    }
    .btn-secondary {
      background: transparent;
      color: #0077B5;
      border: 2px solid #0077B5;
    }
    .btn-secondary:hover {
      background: #0077B5;
      color: white;
    }
    .demo-section {
      background: #f8fbff;
      padding: 40px;
      border-radius: 15px;
      margin: 40px 0;
    }
    .demo-section h3 {
      color: #0077B5;
      text-align: center;
      margin-bottom: 30px;
      font-size: 2em;
    }
    .search-examples {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }
    .search-example {
      background: white;
      padding: 20px;
      border-radius: 10px;
      border-left: 5px solid #0077B5;
      font-style: italic;
      font-size: 1.1em;
      color: #333;
    }
    .stats {
      display: flex;
      justify-content: space-around;
      margin: 50px 0;
      text-align: center;
    }
    .stat {
      flex: 1;
    }
    .stat-number {
      font-size: 3em;
      font-weight: 700;
      color: #0077B5;
      display: block;
    }
    .stat-label {
      font-size: 1em;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .instructions {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 10px;
      padding: 30px;
      margin: 40px 0;
    }
    .instructions h4 {
      color: #856404;
      margin-bottom: 20px;
      font-size: 1.3em;
    }
    .instructions ol {
      margin-left: 20px;
      color: #856404;
    }
    .instructions li {
      margin-bottom: 10px;
      line-height: 1.5;
    }
    @media (max-width: 768px) {
      .header h1 {
        font-size: 2.5em;
      }
      .header p {
        font-size: 1.2em;
      }
      .main-content {
        padding: 30px;
      }
      .features {
        grid-template-columns: 1fr;
      }
      .cta-buttons {
        flex-direction: column;
        align-items: center;
      }
      .stats {
        flex-direction: column;
        gap: 30px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🐝 BeeTagged</h1>
      <p>Professional Contact Intelligence Platform</p>
      <div class="production-badge">Live on Heroku</div>
    </div>

    <div class="main-content">
      <div class="features">
        <div class="feature">
          <div class="feature-icon">🔍</div>
          <h3>Smart Search</h3>
          <p>Find contacts using natural language queries like "Who do I know at Google?" or "Who do I know in marketing?"</p>
        </div>
        <div class="feature">
          <div class="feature-icon">🤖</div>
          <h3>AI-Powered Tags</h3>
          <p>Automatically categorize contacts by company, location, industry, and job function using advanced AI</p>
        </div>
        <div class="feature">
          <div class="feature-icon">📊</div>
          <h3>Network Analytics</h3>
          <p>Get insights into your professional network with detailed analytics and connection rankings</p>
        </div>
      </div>

      <div class="demo-section">
        <h3>Try These Search Examples</h3>
        <div class="search-examples">
          <div class="search-example">"Who do I know at Google?"</div>
          <div class="search-example">"Who do I know in Seattle?"</div>
          <div class="search-example">"Who do I know in marketing?"</div>
          <div class="search-example">"Who do I know in technology?"</div>
        </div>
      </div>

      <div class="instructions">
        <h4>📋 How to Import Your LinkedIn Connections</h4>
        <ol>
          <li>Go to LinkedIn Settings & Privacy → Data privacy</li>
          <li>Click "Get a copy of your data"</li>
          <li>Select "Connections" and request archive</li>
          <li>Download the CSV file when ready</li>
          <li>Use the import tool below to upload your connections</li>
        </ol>
      </div>

      <div class="stats">
        <div class="stat">
          <span class="stat-number">9K+</span>
          <span class="stat-label">Contacts Imported</span>
        </div>
        <div class="stat">
          <span class="stat-number">AI</span>
          <span class="stat-label">Smart Tagging</span>
        </div>
        <div class="stat">
          <span class="stat-number">$0.99</span>
          <span class="stat-label">Simple Pricing</span>
        </div>
      </div>

      <div class="cta-section">
        <h2>Get Started Now</h2>
        <div class="cta-buttons">
          <a href="/squarespace-linkedin-import" class="btn">Import LinkedIn Contacts</a>
          <a href="/" class="btn btn-secondary">Open BeeTagged App</a>
        </div>
      </div>
    </div>
  </div>

  <script>
    // Add smooth scrolling and interaction effects
    document.addEventListener('DOMContentLoaded', function() {
      const buttons = document.querySelectorAll('.btn');
      buttons.forEach(button => {
        button.addEventListener('click', function(e) {
          const originalText = this.textContent;
          this.textContent = 'Loading...';
          this.style.opacity = '0.7';
          
          setTimeout(() => {
            this.textContent = originalText;
            this.style.opacity = '1';
          }, 1000);
        });
      });
    });
  </script>
</body>
</html>
  `);
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const contactCount = await getContactCount();
    res.json({ 
      status: 'healthy', 
      server: 'BeeTagged Production', 
      contacts: contactCount, 
      port: PORT,
      uptime: process.uptime(),
      database: mongoose.connection.readyState === 1 ? 'MongoDB Connected' : 'Memory Storage',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.json({ 
      status: 'healthy', 
      server: 'BeeTagged Production', 
      contacts: contacts.length, 
      port: PORT,
      uptime: process.uptime(),
      database: 'Memory Storage',
      environment: process.env.NODE_ENV || 'development'
    });
  }
});

// API Routes
app.get('/api/contacts', async (req, res) => {
  try {
    const allContacts = await getContacts();
    res.json(allContacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

app.get('/api/tags', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const allTags = await Tag.find().sort({ count: -1 });
      res.json(allTags);
    } else {
      res.json(tags);
    }
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

app.post('/api/search', async (req, res) => {
  try {
    const { query } = req.body;
    const allContacts = await getContacts();
    
    if (!query || query.trim() === '') {
      return res.json(allContacts);
    }
    
    const searchTerm = query.toLowerCase();
    const results = allContacts.filter(contact => {
      return (
        contact.name.toLowerCase().includes(searchTerm) ||
        contact.company.toLowerCase().includes(searchTerm) ||
        contact.position.toLowerCase().includes(searchTerm) ||
        contact.location.toLowerCase().includes(searchTerm) ||
        contact.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    });
    
    res.json(results);
  } catch (error) {
    console.error('Error searching contacts:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Natural language search endpoint for the frontend
app.post('/api/search/natural', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || query.trim() === '') {
      return res.json({ success: true, results: [] });
    }
    
    // Get all contacts from database
    const allContacts = await getContacts();
    
    // Enhanced search function that matches query against multiple fields
    const searchResults = allContacts.filter(contact => {
      const searchTerms = query.toLowerCase().split(' ');
      
      // Fields to search in
      const searchableText = [
        contact.name || '',
        contact.email || '',
        contact.company || '',
        contact.position || '',
        contact.location || '',
        ...(contact.tags || [])
      ].join(' ').toLowerCase();
      
      // Check if any search term matches
      return searchTerms.some(term => searchableText.includes(term));
    });
    
    // Transform results to match expected frontend format
    const formattedResults = searchResults.map(contact => ({
      _id: contact.id,
      name: contact.name,
      phoneNumber: contact.phone,
      priorityData: {
        employment: {
          current: {
            jobFunction: contact.position || '',
            employer: contact.company || ''
          }
        },
        location: {
          current: contact.location || ''
        }
      },
      allTags: contact.tags ? contact.tags.map(tag => ({ name: tag, category: 'general' })) : [],
      linkedinData: contact.source === 'linkedin_csv' ? { id: contact.id } : null,
      searchScore: 0.8
    }));
    
    // Sort by relevance (simple scoring based on how many terms match)
    formattedResults.sort((a, b) => {
      const scoreA = query.toLowerCase().split(' ').reduce((score, term) => {
        const text = `${a.name} ${a.priorityData.employment.current.jobFunction} ${a.priorityData.employment.current.employer}`.toLowerCase();
        return score + (text.includes(term) ? 1 : 0);
      }, 0);
      
      const scoreB = query.toLowerCase().split(' ').reduce((score, term) => {
        const text = `${b.name} ${b.priorityData.employment.current.jobFunction} ${b.priorityData.employment.current.employer}`.toLowerCase();
        return score + (text.includes(term) ? 1 : 0);
      }, 0);
      
      return scoreB - scoreA;
    });
    
    res.json({
      success: true,
      results: formattedResults.slice(0, 50), // Limit to 50 results
      query,
      total: formattedResults.length
    });
    
  } catch (error) {
    console.error('Natural search error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Search failed',
      message: error.message 
    });
  }
});

// LinkedIn CSV Import
app.post('/api/import/linkedin', upload.single('linkedinCsv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const parsedContacts = await parseLinkedInCSV(filePath);
    
    // Save contacts to database
    let savedCount = 0;
    for (const contact of parsedContacts) {
      try {
        await saveContact(contact);
        savedCount++;
      } catch (error) {
        console.error('Error saving contact:', error);
      }
    }
    
    // Clean up uploaded file
    fs.unlinkSync(filePath);
    
    const totalContacts = await getContactCount();
    
    res.json({
      success: true,
      message: `Successfully imported ${savedCount} contacts from LinkedIn`,
      count: savedCount,
      totalContacts: totalContacts
    });
    
  } catch (error) {
    console.error('LinkedIn import error:', error);
    res.status(500).json({ error: 'Failed to import LinkedIn contacts' });
  }
});

// LinkedIn Import Page
app.get('/squarespace-linkedin-import', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LinkedIn Import - BeeTagged</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      max-width: 600px;
      width: 90%;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      color: #0077B5;
    }
    .header h1 {
      margin: 0;
      font-size: 2.5em;
      font-weight: 700;
    }
    .header p {
      margin: 10px 0 0 0;
      font-size: 1.2em;
      opacity: 0.8;
    }
    .upload-area {
      border: 2px dashed #0077B5;
      border-radius: 8px;
      padding: 40px;
      text-align: center;
      margin: 20px 0;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .upload-area:hover {
      background: #f8fbff;
      border-color: #005582;
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
      cursor: pointer;
      transition: background 0.3s ease;
    }
    .btn:hover {
      background: #005582;
    }
    .selected-file {
      margin: 20px 0;
      padding: 15px;
      background: #e8f4fd;
      border-radius: 6px;
      display: none;
    }
    .result {
      margin: 20px 0;
      padding: 15px;
      border-radius: 6px;
      display: none;
    }
    .result.success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    .result.error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    .loading {
      text-align: center;
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
    .production-badge {
      background: #28a745;
      color: white;
      padding: 8px 15px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      margin: 10px 0;
      display: inline-block;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🐝 BeeTagged</h1>
      <p>Import LinkedIn Connections</p>
      <div class="production-badge">Production Ready</div>
    </div>
    
    <div class="content">
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

      const formData = new FormData();
      formData.append('linkedinCsv', selectedFile);

      loading.style.display = 'block';
      uploadBtn.style.display = 'none';
      result.style.display = 'none';

      try {
        const response = await fetch('/api/import/linkedin', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();
        loading.style.display = 'none';

        if (data.success) {
          showResult(data.message + '. Total contacts: ' + data.totalContacts, 'success');
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        } else {
          showResult(data.error || 'Import failed', 'error');
          uploadBtn.style.display = 'inline-block';
        }
      } catch (error) {
        loading.style.display = 'none';
        showResult('Network error. Please try again.', 'error');
        uploadBtn.style.display = 'inline-block';
      }
    });
  </script>
</body>
</html>
  `);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`BeeTagged Production Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: ${mongoose.connection.readyState === 1 ? 'MongoDB Connected' : 'Memory Storage'}`);
});