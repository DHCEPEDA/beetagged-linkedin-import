const express = require('express');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

console.log('=== BEETAGGED SERVER WITH LINKEDIN IMPORT ===');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload configuration
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
    cb(null, `linkedin-${timestamp}-${file.originalname}`);
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

console.log('✓ File upload configured');

// Simple storage
let contacts = [];
let contactCounter = 1;
let tags = [];
let tagCounter = 1;

console.log('✓ Storage initialized');

// Parse LinkedIn CSV function
function parseLinkedInCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv({ skipEmptyLines: true, headers: true }))
      .on('data', (data) => {
        const contact = {
          firstName: data['First Name'] || data.firstName || '',
          lastName: data['Last Name'] || data.lastName || '',
          emailAddress: data['Email Address'] || data.email || '',
          company: data['Company'] || data.company || '',
          position: data['Position'] || data.position || data.title || '',
          connectedOn: data['Connected On'] || data.connectedOn || '',
          url: data['URL'] || data.url || ''
        };
        
        if (contact.firstName || contact.lastName || contact.company) {
          results.push(contact);
        }
      })
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// Root route
app.get('/', (req, res) => {
  console.log('→ Root route accessed');
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
        ul { margin: 20px 0; }
        li { margin: 10px 0; }
        a { color: #2563eb; text-decoration: none; padding: 8px 15px; background: #eff6ff; border-radius: 5px; display: inline-block; }
        a:hover { background: #dbeafe; }
        .form-section { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .form-section h3 { margin-top: 0; color: #374151; }
        input, button { padding: 10px; margin: 5px; border: 1px solid #d1d5db; border-radius: 5px; }
        button { background: #2563eb; color: white; border: none; cursor: pointer; }
        button:hover { background: #1d4ed8; }
        .linkedin-section { background: #0077b5; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .linkedin-section h3 { margin-top: 0; }
        .linkedin-section a { background: white; color: #0077b5; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🐝 BeeTagged</h1>
        <p class="tagline">Professional Contact Intelligence Platform</p>
        
        <div class="status">✓ Server running successfully on Heroku!</div>
        
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
          <li><a href="/test">Test Server Functions</a></li>
        </ul>

        <div class="form-section">
          <h3>➕ Add New Contact</h3>
          <form action="/api/contacts" method="post">
            <input type="text" name="name" placeholder="Full Name" required>
            <input type="text" name="company" placeholder="Company">
            <input type="text" name="title" placeholder="Job Title">
            <button type="submit">Add Contact</button>
          </form>
        </div>
      </div>
    </body>
    </html>
  `;
  res.send(html);
});

// LinkedIn import page
app.get('/li-import', (req, res) => {
  console.log('→ LinkedIn import page accessed');
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

// LinkedIn import API
app.post('/api/import/linkedin', upload.single('linkedinCsv'), async (req, res) => {
  try {
    console.log('→ LinkedIn import started');
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No CSV file uploaded' });
    }

    console.log('Processing file:', req.file.originalname);
    const csvData = await parseLinkedInCSV(req.file.path);
    
    if (csvData.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid contacts found in CSV file' });
    }

    const importedContacts = [];
    const newTags = new Set();
    
    csvData.forEach(row => {
      if (row.firstName || row.lastName || row.company) {
        const fullName = `${row.firstName} ${row.lastName}`.trim();
        
        const contact = {
          id: contactCounter++,
          name: fullName || 'Unknown',
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.emailAddress,
          company: row.company,
          title: row.position,
          linkedinUrl: row.url,
          connectedOn: row.connectedOn,
          source: 'linkedin_import',
          createdAt: new Date().toISOString(),
          tags: []
        };
        
        // Generate tags
        const contactTags = [];
        
        if (row.company) {
          contactTags.push({ name: row.company, category: 'company' });
          newTags.add(row.company);
        }
        
        if (row.position) {
          contactTags.push({ name: row.position, category: 'title' });
          
          // Add job function tags
          const position = row.position.toLowerCase();
          if (position.includes('engineer') || position.includes('developer')) {
            contactTags.push({ name: 'Engineering', category: 'function' });
            newTags.add('Engineering');
          } else if (position.includes('marketing')) {
            contactTags.push({ name: 'Marketing', category: 'function' });
            newTags.add('Marketing');
          } else if (position.includes('sales')) {
            contactTags.push({ name: 'Sales', category: 'function' });
            newTags.add('Sales');
          } else if (position.includes('manager') || position.includes('director')) {
            contactTags.push({ name: 'Management', category: 'function' });
            newTags.add('Management');
          }
        }
        
        contactTags.push({ name: 'LinkedIn Connection', category: 'source' });
        newTags.add('LinkedIn Connection');
        
        contact.tags = contactTags;
        contacts.push(contact);
        importedContacts.push(contact);
      }
    });
    
    // Add new tags to global tags array
    newTags.forEach(tagName => {
      if (!tags.find(t => t.name === tagName)) {
        tags.push({
          id: tagCounter++,
          name: tagName,
          color: '#0077b5',
          category: 'general',
          createdAt: new Date().toISOString()
        });
      }
    });
    
    // Clean up uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('File cleanup error:', err);
    });
    
    console.log(`✓ Imported ${importedContacts.length} LinkedIn contacts`);
    
    res.json({
      success: true,
      message: `Successfully imported ${importedContacts.length} contacts from LinkedIn`,
      contacts: importedContacts,
      count: importedContacts.length,
      totalContacts: contacts.length,
      newTags: newTags.size
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

// Search page
app.get('/search', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Search Contacts - BeeTagged</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f8fafc; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2563eb; }
        .search-box { width: 100%; padding: 15px; font-size: 16px; border: 2px solid #d1d5db; border-radius: 8px; margin: 20px 0; }
        .search-box:focus { outline: none; border-color: #2563eb; }
        .contact-card { background: #f8fafc; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #2563eb; }
        .contact-name { font-weight: bold; color: #374151; margin-bottom: 5px; }
        .contact-info { color: #64748b; font-size: 14px; }
        .no-results { text-align: center; color: #64748b; margin: 40px 0; }
        .back-link { display: inline-block; margin-top: 20px; color: #2563eb; text-decoration: none; }
      </style>
      <script>
        function searchContacts() {
          const query = document.getElementById('searchInput').value;
          const resultsDiv = document.getElementById('results');
          
          if (!query.trim()) {
            resultsDiv.innerHTML = '<div class="no-results">Enter a search term</div>';
            return;
          }
          
          fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: query })
          })
          .then(response => response.json())
          .then(data => {
            if (data.success && data.results.length > 0) {
              resultsDiv.innerHTML = data.results.map(contact => 
                '<div class="contact-card">' +
                '<div class="contact-name">' + contact.name + '</div>' +
                '<div class="contact-info">' + 
                (contact.company ? contact.company + ' • ' : '') +
                (contact.title || 'No title') +
                '</div></div>'
              ).join('');
            } else {
              resultsDiv.innerHTML = '<div class="no-results">No contacts found for "' + query + '"</div>';
            }
          })
          .catch(error => {
            resultsDiv.innerHTML = '<div class="no-results">Search error: ' + error.message + '</div>';
          });
        }
      </script>
    </head>
    <body>
      <div class="container">
        <h1>🔍 Search Contacts</h1>
        <input type="text" id="searchInput" class="search-box" placeholder="Search by name, company, or title..." onkeyup="searchContacts()">
        <div id="results">
          <div class="no-results">Start typing to search your ${contacts.length} contacts</div>
        </div>
        <a href="/" class="back-link">← Back to Dashboard</a>
      </div>
    </body>
    </html>
  `;
  res.send(html);
});

// Search API
app.post('/api/search', (req, res) => {
  const { query } = req.body;
  
  if (!query) {
    return res.status(400).json({ success: false, message: 'Search query required' });
  }
  
  const normalizedQuery = query.toLowerCase().trim();
  const results = contacts.filter(contact => {
    return (contact.name && contact.name.toLowerCase().includes(normalizedQuery)) ||
           (contact.company && contact.company.toLowerCase().includes(normalizedQuery)) ||
           (contact.title && contact.title.toLowerCase().includes(normalizedQuery));
  });
  
  res.json({
    success: true,
    results: results,
    total: results.length,
    query: query
  });
});

// Health check
app.get('/health', (req, res) => {
  console.log('→ Health check accessed');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    contacts: contacts.length,
    tags: tags.length,
    linkedinContacts: contacts.filter(c => c.source === 'linkedin_import').length,
    memory: process.memoryUsage(),
    port: process.env.PORT || 5000
  });
});

// Contacts API
app.get('/api/contacts', (req, res) => {
  console.log('→ Contacts API accessed');
  res.json({
    success: true,
    contacts: contacts,
    total: contacts.length,
    sources: {
      linkedin_import: contacts.filter(c => c.source === 'linkedin_import').length,
      manual: contacts.filter(c => c.source === 'manual').length
    }
  });
});

// Add contact
app.post('/api/contacts', (req, res) => {
  console.log('→ Adding contact:', req.body);
  
  const { name, company, title } = req.body;
  
  if (!name) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }
  
  const contact = {
    id: contactCounter++,
    name: name.trim(),
    company: company ? company.trim() : '',
    title: title ? title.trim() : '',
    source: 'manual',
    createdAt: new Date().toISOString(),
    tags: []
  };
  
  if (contact.company) {
    contact.tags.push({ name: contact.company, category: 'company' });
  }
  
  contacts.push(contact);
  
  console.log(`✓ Contact added: ${contact.name} (${contacts.length} total)`);
  
  res.redirect('/');
});

// Test page
app.get('/test', (req, res) => {
  console.log('→ Test page accessed');
  res.send(`
    <h1>🧪 Test Page</h1>
    <p><strong>Server Status:</strong> Running correctly!</p>
    <p><strong>Current Time:</strong> ${new Date().toISOString()}</p>
    <p><strong>Uptime:</strong> ${Math.round(process.uptime())} seconds</p>
    <p><strong>Contacts:</strong> ${contacts.length}</p>
    <p><strong>Tags:</strong> ${tags.length}</p>
    <p><a href="/">← Back to Dashboard</a></p>
  `);
});

// Start server
const PORT = process.env.PORT || 5000;

console.log(`✓ Using port: ${PORT}`);

const server = app.listen(PORT, function(err) {
  if (err) {
    console.error('❌ FATAL: Server failed to start:', err);
    process.exit(1);
  }
  
  console.log(`🚀 BeeTagged server with LinkedIn import running on port ${PORT}`);
  console.log('=== SERVER STARTUP COMPLETE ===');
});

// Error handling
server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

module.exports = app;