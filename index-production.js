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
  origin: ['https://beetagged.com', 'https://www.beetagged.com', 'https://beetagged-app.herokuapp.com', 'http://localhost:3000', '*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Static files - serve public folder only
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

// In-memory data storage
let contacts = [];
let tags = [];
let tagIdCounter = 1;
let contactIdCounter = 1;

// Helper function to parse LinkedIn CSV data
function parseLinkedInCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = fs.createReadStream(filePath)
      .pipe(csv({
        skipEmptyLines: true,
        headers: true
      }))
      .on('data', (data) => {
        // Handle different CSV formats
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
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    contacts: contacts.length,
    tags: tags.length
  });
});

// Main LinkedIn import endpoint
app.post('/api/import/linkedin', upload.single('linkedinCsv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No CSV file uploaded'
      });
    }

    console.log('Processing LinkedIn CSV:', req.file.originalname);
    const csvData = await parseLinkedInCSV(req.file.path);
    console.log('Parsed CSV data:', csvData.length, 'rows');
    
    if (csvData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid contacts found in CSV file'
      });
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
          phoneNumber: '',
          company: row.company,
          title: row.position,
          linkedinUrl: row.url,
          connectedOn: row.connectedOn,
          source: 'linkedin_import',
          createdAt: new Date().toISOString(),
          tags: [],
          allTags: []
        };
        
        // Generate tags
        const contactTags = [];
        
        if (row.company) {
          contactTags.push({ name: row.company, category: 'company' });
        }
        
        if (row.position) {
          contactTags.push({ name: row.position, category: 'title' });
          
          // Add job function tags
          const position = row.position.toLowerCase();
          if (position.includes('engineer') || position.includes('developer')) {
            contactTags.push({ name: 'Engineering', category: 'function' });
          } else if (position.includes('marketing')) {
            contactTags.push({ name: 'Marketing', category: 'function' });
          } else if (position.includes('sales')) {
            contactTags.push({ name: 'Sales', category: 'function' });
          } else if (position.includes('manager') || position.includes('director')) {
            contactTags.push({ name: 'Management', category: 'function' });
          }
        }
        
        contactTags.push({ name: 'LinkedIn Connection', category: 'source' });
        
        contact.tags = contactTags;
        contact.allTags = contactTags;
        
        contacts.push(contact);
        importedContacts.push(contact);
        
        // Add new tags to global tags array
        contactTags.forEach(tag => {
          const tagName = tag.name;
          if (tagName && !tags.find(t => t.name.toLowerCase() === tagName.toLowerCase())) {
            newTags.add(JSON.stringify({
              _id: tagIdCounter++,
              name: tagName,
              color: tag.category === 'company' ? '#1e40af' : 
                     tag.category === 'location' ? '#059669' : 
                     tag.category === 'function' ? '#dc2626' : 
                     tag.category === 'source' ? '#4f46e5' : '#7c2d12',
              category: tag.category || 'general',
              createdAt: new Date().toISOString(),
              usageCount: 1,
              source: 'linkedin_import'
            }));
          }
        });
      }
    });
    
    newTags.forEach(tagStr => {
      tags.push(JSON.parse(tagStr));
    });
    
    // Clean up uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('File cleanup error:', err);
    });
    
    res.json({
      success: true,
      message: `Successfully imported ${importedContacts.length} contacts from LinkedIn`,
      contacts: importedContacts,
      count: importedContacts.length,
      totalContacts: contacts.length,
      newTags: Array.from(newTags).map(t => JSON.parse(t))
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

// Contact and Tag management endpoints
app.get('/api/tags', (req, res) => {
  res.json({
    success: true,
    tags: tags
  });
});

app.get('/api/contacts', (req, res) => {
  res.json({
    success: true,
    contacts: contacts,
    total: contacts.length,
    sources: {
      linkedin_import: contacts.filter(c => c.source === 'linkedin_import').length,
      manual: contacts.filter(c => c.source === 'manual').length,
      other: contacts.filter(c => c.source && c.source !== 'linkedin_import' && c.source !== 'manual').length
    }
  });
});

app.get('/api/contacts/stats', (req, res) => {
  const stats = {
    total: contacts.length,
    bySource: {
      linkedin_import: contacts.filter(c => c.source === 'linkedin_import').length,
      manual: contacts.filter(c => c.source === 'manual').length,
      other: contacts.filter(c => c.source && c.source !== 'linkedin_import' && c.source !== 'manual').length
    },
    companies: [...new Set(contacts.map(c => c.company).filter(Boolean))].length,
    tags: tags.length,
    lastImport: contacts.filter(c => c.source === 'linkedin_import').length > 0 ? 
      Math.max(...contacts.filter(c => c.source === 'linkedin_import').map(c => new Date(c.createdAt).getTime())) : null
  };
  
  res.json({
    success: true,
    stats: stats
  });
});

// Search API endpoint
app.post('/api/search/natural', (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
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
    const results = [];
    
    contacts.forEach(contact => {
      let score = 0;
      let matches = false;
      
      // Natural language pattern matching
      if (normalizedQuery.includes('who works at')) {
        const companyMatch = normalizedQuery.match(/who works at (.+?)(\?|$)/);
        if (companyMatch) {
          const companyName = companyMatch[1].trim();
          if (contact.company && contact.company.toLowerCase().includes(companyName)) {
            score += 100;
            matches = true;
          }
        }
      } else {
        // General search across all fields
        if (contact.name && contact.name.toLowerCase().includes(normalizedQuery)) {
          score += 50;
          matches = true;
        }
        if (contact.company && contact.company.toLowerCase().includes(normalizedQuery)) {
          score += 40;
          matches = true;
        }
        if (contact.title && contact.title.toLowerCase().includes(normalizedQuery)) {
          score += 35;
          matches = true;
        }
        if (contact.allTags && contact.allTags.some(tag => 
          tag.name.toLowerCase().includes(normalizedQuery)
        )) {
          score += 30;
          matches = true;
        }
      }
      
      if (matches) {
        results.push({
          ...contact,
          searchScore: score / 100
        });
      }
    });
    
    results.sort((a, b) => b.searchScore - a.searchScore);
    
    res.json({
      success: true,
      results: results,
      total: results.length,
      query: query
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
});

// LinkedIn Import standalone page
app.get('/li-import', (req, res) => {
  const importPath = path.join(__dirname, 'public', 'linkedin-import-standalone.html');
  if (fs.existsSync(importPath)) {
    res.sendFile(importPath);
  } else {
    res.status(404).send('LinkedIn import page not found');
  }
});

// Root route
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send(`
      <h1>BeeTagged Server</h1>
      <p>Server running successfully!</p>
      <ul>
        <li><a href="/li-import">LinkedIn Import Tool</a></li>
        <li><a href="/api/contacts">View Contacts API</a></li>
        <li><a href="/health">Health Check</a></li>
      </ul>
    `);
  }
});

// Catch all other routes
app.get('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    availableRoutes: [
      '/',
      '/li-import',
      '/api/contacts',
      '/api/tags',
      '/health'
    ]
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`BeeTagged Server running on port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`LinkedIn Import: /li-import`);
  console.log(`API Health Check: /health`);
});

module.exports = app;