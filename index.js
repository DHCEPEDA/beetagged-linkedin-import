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

// Storage arrays
let contacts = [];
let tags = [];
let contactIdCounter = 1;
let tagIdCounter = 1;

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
          const contact = {
            name: row['First Name'] + ' ' + row['Last Name'] || row['Name'] || '',
            email: row['Email Address'] || row['Email'] || '',
            company: row['Company'] || row['Current Company'] || '',
            title: row['Position'] || row['Title'] || '',
            location: row['Location'] || '',
            source: 'linkedin_import',
            picture: 'https://cdn.jsdelivr.net/npm/simple-icons@v6/icons/linkedin.svg',
            tags: []
          };
          
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
app.use(express.static(path.join(__dirname, 'dist')));

// API Routes
app.get('/api/contacts', (req, res) => {
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
      staticFiles: fs.existsSync(path.join(__dirname, 'dist', 'index.html'))
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
    
    // Clear existing LinkedIn imports
    contacts = contacts.filter(c => c.source !== 'linkedin_import');
    
    // Add new contacts
    importedContacts.forEach(contact => {
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
      contacts.push(newContact);
    });
    
    // Clean up uploaded file
    fs.unlink(req.file.path, () => {});
    
    res.json({
      success: true,
      message: `Successfully imported ${importedContacts.length} contacts from LinkedIn`,
      count: importedContacts.length,
      totalContacts: contacts.length
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

// Homepage route - serve React app
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Fallback to simple HTML page with links to functionality
    const html = `<!DOCTYPE html>
<html>
<head>
    <title>BeeTagged</title>
    <style>
        body { font-family: Arial; margin: 40px; background: #f8fafc; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
        h1 { color: #2563eb; }
        .status { color: #059669; background: #dcfce7; padding: 10px; border-radius: 5px; margin: 20px 0; }
        .linkedin-section { background: #0077b5; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .linkedin-section a { background: white; color: #0077b5; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
        .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .feature-card { background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .feature-card h3 { margin: 0 0 10px 0; color: #1e293b; }
        .feature-card a { color: #2563eb; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🐝 BeeTagged</h1>
        <div class="status">Professional Contact Intelligence Platform - Server Running</div>
        
        <div class="linkedin-section">
            <h3>LinkedIn Import</h3>
            <p>Import your LinkedIn connections for intelligent contact search</p>
            <a href="/li-import">Import LinkedIn Connections</a>
        </div>

        <div class="features">
            <div class="feature-card">
                <h3>Contact Management</h3>
                <p>View and manage your imported contacts</p>
                <a href="/api/contacts">View Contacts API</a>
            </div>
            <div class="feature-card">
                <h3>Health Status</h3>
                <p>Check server health and statistics</p>
                <a href="/health">Server Health</a>
            </div>
            <div class="feature-card">
                <h3>Squarespace Integration</h3>
                <p>Facebook connect widget for Squarespace</p>
                <a href="/squarespace-linkedin-import">Squarespace Widget</a>
            </div>
        </div>
    </div>
</body>
</html>`;
    res.send(html);
  }
});

// Catch-all for React Router
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
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
  console.log(`Build exists: ${fs.existsSync(path.join(__dirname, 'dist', 'index.html'))}`);
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