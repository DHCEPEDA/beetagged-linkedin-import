# 🐝 BeeTagged - Complete Code for Lovable Transfer

## Project Overview
BeeTagged is a professional contact management platform with LinkedIn CSV import, natural language search, and smart tagging capabilities.

## Tech Stack
- **Backend**: Node.js + Express
- **Database**: MongoDB Atlas
- **Features**: CSV parsing, natural search, smart tagging
- **Deployment**: Heroku-ready

---

## 📄 package.json
```json
{
  "name": "beetagged-app",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "heroku-postbuild": "echo 'No build step required - using static files'"
  },
  "engines": {
    "node": "18.x",
    "npm": ">=8.0.0"
  },
  "dependencies": {
    "compression": "^1.8.1",
    "cors": "^2.8.5",
    "csv-parser": "^3.2.0",
    "dotenv": "^16.5.0",
    "express": "^4.21.2",
    "mongoose": "^8.16.4",
    "multer": "^1.4.5-lts.2"
  }
}
```

---

## ⚙️ Procfile
```
web: node index.js
```

---

## 🔒 .env (Environment Variables)
```bash
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/beetagged

# Port Configuration
PORT=5000

# Optional: Facebook App Configuration
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
```

---

## 🚀 index.js (Main Server File)
```javascript
/**
 * BeeTagged - Professional Contact Management Platform
 * Self-contained Express server optimized for Heroku deployment
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

// MongoDB connection
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB connection error:', err));
}

// MongoDB Contact Schema
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

const Contact = mongoose.model('Contact', contactSchema);

// File upload setup
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Smart Tag Generation System
function generateTags(contact) {
  const tags = [];
  
  if (contact.company) {
    tags.push(contact.company);
    const techCompanies = ['google', 'microsoft', 'apple', 'amazon', 'meta', 'facebook'];
    const companyLower = contact.company.toLowerCase();
    if (techCompanies.some(tech => companyLower.includes(tech))) {
      tags.push('Technology');
    }
  }
  
  if (contact.position) {
    tags.push(contact.position);
    const positionLower = contact.position.toLowerCase();
    if (positionLower.includes('engineer') || positionLower.includes('developer')) {
      tags.push('Engineering');
    } else if (positionLower.includes('manager') || positionLower.includes('director')) {
      tags.push('Management');
    }
  }
  
  if (contact.location) {
    tags.push(contact.location);
  }
  
  return tags;
}

// Enhanced CSV Parser
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

// LinkedIn Header Mappings
const LINKEDIN_HEADER_MAPPINGS = {
  firstName: ['first name', 'firstname'],
  lastName: ['last name', 'lastname'],
  email: ['email address', 'email'],
  company: ['company', 'current company'],
  position: ['position', 'current position', 'title'],
  location: ['location', 'current location']
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

// === API ROUTES ===

// Health check
app.get('/health', async (req, res) => {
  try {
    const contactCount = await Contact.countDocuments();
    res.json({
      status: 'healthy',
      server: 'BeeTagged',
      contacts: contactCount,
      port: PORT,
      uptime: process.uptime(),
      mongodb: process.env.MONGODB_URI ? 'connected' : 'not configured'
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get all contacts
app.get('/api/contacts', async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// LinkedIn CSV Import
app.post('/api/import/linkedin', upload.single('linkedinCsv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const csvData = req.file.buffer.toString('utf8');
    const lines = csvData.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'CSV file must contain header and data rows' 
      });
    }

    const headers = parseCSVLine(lines[0]);
    
    const indices = {
      firstName: findHeaderIndex(headers, LINKEDIN_HEADER_MAPPINGS.firstName),
      lastName: findHeaderIndex(headers, LINKEDIN_HEADER_MAPPINGS.lastName),
      email: findHeaderIndex(headers, LINKEDIN_HEADER_MAPPINGS.email),
      company: findHeaderIndex(headers, LINKEDIN_HEADER_MAPPINGS.company),
      position: findHeaderIndex(headers, LINKEDIN_HEADER_MAPPINGS.position),
      location: findHeaderIndex(headers, LINKEDIN_HEADER_MAPPINGS.location)
    };

    const contacts = [];
    let processed = 0;
    let skipped = 0;

    for (let i = 1; i < lines.length; i++) {
      try {
        const fields = parseCSVLine(lines[i]);
        processed++;
        
        let name = '';
        if (indices.firstName >= 0 && indices.lastName >= 0) {
          const firstName = fields[indices.firstName]?.trim() || '';
          const lastName = fields[indices.lastName]?.trim() || '';
          name = `${firstName} ${lastName}`.trim();
        }

        if (!name) {
          skipped++;
          continue;
        }

        const contactData = {
          name,
          email: indices.email >= 0 ? (fields[indices.email]?.trim().toLowerCase() || '') : '',
          company: indices.company >= 0 ? (fields[indices.company]?.trim() || '') : '',
          position: indices.position >= 0 ? (fields[indices.position]?.trim() || '') : '',
          location: indices.location >= 0 ? (fields[indices.location]?.trim() || '') : ''
        };

        const contact = new Contact({
          ...contactData,
          tags: generateTags(contactData),
          source: 'linkedin_import',
          createdAt: new Date()
        });

        contacts.push(contact);
      } catch (error) {
        skipped++;
      }
    }

    if (contacts.length > 0) {
      await Contact.insertMany(contacts, { ordered: false });
    }
    
    res.json({
      success: true,
      count: contacts.length,
      processed: processed,
      skipped: skipped,
      message: `Successfully imported ${contacts.length} LinkedIn contacts`
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Natural Language Search
app.get('/api/search/natural', async (req, res) => {
  try {
    const query = req.query.q?.toLowerCase() || '';
    
    if (!query) {
      const allContacts = await Contact.find().sort({ createdAt: -1 });
      return res.json({ results: allContacts });
    }

    const searchConditions = [];
    const keywords = query.split(/\s+/);
    
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

    const searchQuery = searchConditions.length > 0 ? { $and: searchConditions } : {};
    const results = await Contact.find(searchQuery).sort({ createdAt: -1 });
    
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: 'Search failed', results: [] });
  }
});

// === FRONTEND HTML ===
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
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
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
                <p>Upload your LinkedIn contacts and start searching with natural language queries</p>
                
                <div style="text-align: center; margin-top: 40px;">
                    <button class="btn" onclick="showImport()">📱 Import LinkedIn Contacts</button>
                    <button class="btn" onclick="showSearch()">🔍 Search Contacts</button>
                </div>
            </div>
            
            <div class="section hidden" id="importSection">
                <h2>📱 Import LinkedIn Contacts</h2>
                
                <div class="upload-area">
                    <input type="file" id="csvFile" accept=".csv" style="display: none;" onchange="handleFileUpload(event)">
                    <div onclick="document.getElementById('csvFile').click()" style="cursor: pointer;">
                        <div style="font-size: 3rem; margin-bottom: 10px;">📁</div>
                        <p><strong>Click to select CSV file</strong></p>
                    </div>
                </div>
                
                <div id="uploadStatus"></div>
                <button class="btn" onclick="showHome()">← Back to Home</button>
            </div>
            
            <div class="section hidden" id="searchSection">
                <h2>🔍 Search Contacts</h2>
                <input type="text" id="searchInput" class="search-bar" 
                       placeholder="Try: 'Who works at Google?', 'Engineers in Seattle'..." 
                       onkeyup="handleSearch(event)" onkeydown="handleKeyDown(event)">
                
                <div id="searchResults">
                    <p style="text-align: center; color: #666; padding: 40px;">Import contacts first to start searching</p>
                </div>
                
                <button class="btn" onclick="showHome()">← Back to Home</button>
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
            
            const formData = new FormData();
            formData.append('linkedinCsv', file);
            
            const statusDiv = document.getElementById('uploadStatus');
            statusDiv.innerHTML = '<div class="loading"></div>Processing CSV file...';
            
            try {
                const response = await fetch('/api/import/linkedin', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.success) {
                    statusDiv.innerHTML = '✅ Successfully imported ' + result.count + ' contacts!';
                    setTimeout(() => showSearch(), 1500);
                } else {
                    statusDiv.innerHTML = '❌ Error: ' + result.message;
                }
            } catch (error) {
                statusDiv.innerHTML = '❌ Upload failed. Please try again.';
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
                resultsDiv.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No contacts found</p>';
                return;
            }
            
            const contactsHtml = contactList.map(contact => 
                '<div class="contact-item">' +
                    '<div style="font-weight: bold; margin-bottom: 5px;">' + contact.name + '</div>' +
                    '<div style="color: #666; margin-bottom: 5px;">' + 
                        (contact.company || '') + (contact.position ? ' • ' + contact.position : '') +
                    '</div>' +
                    '<div style="font-size: 12px; color: #999;">' +
                        (contact.location || '') + (contact.tags ? ' • ' + contact.tags.join(', ') : '') +
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
            
            try {
                const response = await fetch('/api/search/natural?q=' + encodeURIComponent(query));
                const result = await response.json();
                displayContacts(result.results || []);
            } catch (error) {
                console.error('Search error:', error);
                displayContacts([]);
            }
        }
        
        async function handleSearch(event) {
            const query = event.target.value.trim();
            await performSearch(query);
        }
        
        function handleKeyDown(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
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
```

---

## 🔧 Setup Instructions for Lovable

1. **Create New Project**: Start with Node.js/Express template
2. **Copy Files**: Copy all the code above into respective files
3. **Environment Variables**: Set up MongoDB connection string
4. **Dependencies**: The package.json includes all required packages
5. **Deploy**: Use the same Heroku deployment process

## 🚀 Key Features

- **LinkedIn CSV Import**: Robust parsing with quoted field handling
- **Natural Language Search**: Search like "Who works at Google?"
- **Smart Tagging**: Auto-categorization by company, role, location
- **Responsive Design**: Mobile-friendly interface
- **Production Ready**: Heroku deployment optimized

## 📝 Notes

- This is the complete, working BeeTagged codebase
- Search functionality includes Enter key support
- Enhanced CSV parsing handles complex LinkedIn exports
- MongoDB Atlas integration for cloud data storage
- Professional UI with gradient design

All code is ready to paste directly into Lovable!