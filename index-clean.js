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

// Storage arrays - declared once at the top
let contacts = [];
let tags = [];
let contactIdCounter = 1;
let tagIdCounter = 1;

// Static files
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.static(path.join(__dirname, 'public')));

// Upload configuration
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

// LinkedIn CSV parser with flexible field mapping
function parseLinkedInCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        const contact = {
          id: `linkedin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          source: 'linkedin_import',
          tags: []
        };
        
        // Map CSV fields to contact fields (case-insensitive)
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
          { csvField: 'Name', contactField: 'fullName' },
          { csvField: 'Full Name', contactField: 'fullName' }
        ];
        
        fieldMappings.forEach(mapping => {
          if (data[mapping.csvField] && data[mapping.csvField].trim()) {
            contact[mapping.contactField] = data[mapping.csvField].trim();
          }
        });
        
        // Handle full name splitting
        if (contact.fullName && !contact.firstName && !contact.lastName) {
          const nameParts = contact.fullName.split(' ');
          contact.firstName = nameParts[0] || '';
          contact.lastName = nameParts.slice(1).join(' ') || '';
        }
        
        contact.name = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
        
        // Only add contacts with valid data
        const hasValidData = contact.name || contact.company || contact.email || contact.title || contact.fullName;
        
        if (hasValidData) {
          // Generate tags
          const tags = [];
          if (contact.location) tags.push({ type: 'location', name: contact.location });
          if (contact.company) tags.push({ type: 'company', name: contact.company });
          if (contact.title) tags.push({ type: 'position', name: contact.title });
          if (contact.industry) tags.push({ type: 'industry', name: contact.industry });
          
          contact.tags = tags;
          contact.picture = 'https://cdn.jsdelivr.net/npm/simple-icons@v6/icons/linkedin.svg';
          
          results.push(contact);
        }
      })
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// Routes
app.get('/', (req, res) => {
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
    </style>
</head>
<body>
    <div class="container">
        <h1>🐝 BeeTagged</h1>
        <div class="status">Server running - Contacts: ${contacts.length}</div>
        <div class="linkedin-section">
            <h3>LinkedIn Import</h3>
            <a href="/li-import">Import LinkedIn Connections</a>
        </div>
        <p><a href="/api/contacts">View Contacts API</a></p>
    </div>
</body>
</html>`;
  res.send(html);
});

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
        <a href="/">← Back</a>
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
        _id: contactIdCounter++,
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

// API endpoints
app.get('/api/contacts', (req, res) => {
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

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    contacts: contacts.length,
    port: process.env.PORT || '5000'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`BeeTagged LinkedIn Import Server`);
  console.log(`Running on port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Test page: /li-import`);
  console.log(`API: /api/import/linkedin`);
});

module.exports = app;