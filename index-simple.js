const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');
const compression = require('compression');

const app = express();

// Enable compression
app.use(compression());

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Static files
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
    cb(null, `${file.fieldname}-${timestamp}${path.extname(file.originalname)}`);
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

// In-memory storage
let contacts = [];
let tags = [];
let tagIdCounter = 1;
let contactIdCounter = 1;

// Parse LinkedIn CSV
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

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    contacts: contacts.length,
    tags: tags.length,
    timestamp: new Date().toISOString()
  });
});

// LinkedIn import
app.post('/api/import/linkedin', upload.single('linkedinCsv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No CSV file uploaded' });
    }

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
          _id: contactIdCounter++,
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
        }
        
        if (row.position) {
          contactTags.push({ name: row.position, category: 'title' });
        }
        
        contactTags.push({ name: 'LinkedIn Connection', category: 'source' });
        
        contact.tags = contactTags;
        contact.allTags = contactTags;
        
        contacts.push(contact);
        importedContacts.push(contact);
        
        // Add new tags
        contactTags.forEach(tag => {
          if (tag.name && !tags.find(t => t.name.toLowerCase() === tag.name.toLowerCase())) {
            newTags.add(JSON.stringify({
              _id: tagIdCounter++,
              name: tag.name,
              color: tag.category === 'company' ? '#1e40af' : 
                     tag.category === 'title' ? '#dc2626' : '#4f46e5',
              category: tag.category || 'general',
              createdAt: new Date().toISOString(),
              usageCount: 1
            }));
          }
        });
      }
    });
    
    newTags.forEach(tagStr => {
      tags.push(JSON.parse(tagStr));
    });
    
    // Clean up file
    fs.unlink(req.file.path, () => {});
    
    res.json({
      success: true,
      message: `Successfully imported ${importedContacts.length} contacts from LinkedIn`,
      contacts: importedContacts,
      count: importedContacts.length,
      totalContacts: contacts.length
    });
    
  } catch (error) {
    console.error('LinkedIn import error:', error);
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(500).json({ success: false, message: 'Failed to import LinkedIn contacts' });
  }
});

// API endpoints
app.get('/api/contacts', (req, res) => {
  res.json({
    success: true,
    contacts: contacts,
    total: contacts.length
  });
});

app.get('/api/tags', (req, res) => {
  res.json({
    success: true,
    tags: tags
  });
});

app.post('/api/search/natural', (req, res) => {
  const { query } = req.body;
  
  if (!query) {
    return res.status(400).json({ success: false, message: 'Search query is required' });
  }
  
  if (contacts.length === 0) {
    return res.json({
      success: true,
      message: 'No contacts found. Please import your LinkedIn connections first.',
      results: [],
      total: 0,
      query: query
    });
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

// LinkedIn import page
app.get('/li-import', (req, res) => {
  const importPath = path.join(__dirname, 'public', 'linkedin-import-standalone.html');
  if (fs.existsSync(importPath)) {
    res.sendFile(importPath);
  } else {
    res.send(`
      <h1>LinkedIn Import</h1>
      <form action="/api/import/linkedin" method="post" enctype="multipart/form-data">
        <input type="file" name="linkedinCsv" accept=".csv" required>
        <button type="submit">Import Contacts</button>
      </form>
    `);
  }
});

// Root route
app.get('/', (req, res) => {
  res.send(`
    <h1>BeeTagged Server</h1>
    <p>Server running successfully!</p>
    <ul>
      <li><a href="/li-import">LinkedIn Import Tool</a></li>
      <li><a href="/api/contacts">View Contacts (${contacts.length})</a></li>
      <li><a href="/health">Health Check</a></li>
    </ul>
  `);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`BeeTagged Server running on port: ${PORT}`);
});

module.exports = app;