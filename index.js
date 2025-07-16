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
  const filePath = path.join(__dirname, 'squarespace-embed-code.html');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({
      error: 'LinkedIn import page not found',
      message: 'The squarespace-embed-code.html file is missing'
    });
  }
});

// Homepage route
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({
      message: 'BeeTagged Server Running',
      status: 'healthy',
      endpoints: ['/health', '/status', '/api/contacts', '/api/tags', '/squarespace-linkedin-import']
    });
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