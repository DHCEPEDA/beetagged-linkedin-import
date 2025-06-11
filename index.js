const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');

const app = express();

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
app.use(express.static(path.join(__dirname, 'dist')));

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

// LinkedIn CSV parser
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
        
        const fields = {
          'First Name': 'firstName',
          'Last Name': 'lastName', 
          'Email Address': 'email',
          'Company': 'company',
          'Position': 'title',
          'Connected On': 'connectedOn',
          'Location': 'location',
          'Industry': 'industry',
          'Phone Number': 'phone'
        };
        
        Object.keys(data).forEach(col => {
          if (fields[col] && data[col]) {
            contact[fields[col]] = data[col].trim();
          }
        });
        
        contact.name = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
        
        const tags = [];
        if (contact.location) tags.push({ type: 'location', name: contact.location });
        if (contact.company) tags.push({ type: 'company', name: contact.company });
        if (contact.title) tags.push({ type: 'position', name: contact.title });
        if (contact.industry) tags.push({ type: 'industry', name: contact.industry });
        
        contact.tags = tags;
        contact.picture = 'https://cdn.jsdelivr.net/npm/simple-icons@v6/icons/linkedin.svg';
        
        results.push(contact);
      })
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'BeeTagged LinkedIn Import' 
  });
});

app.get('/status', (req, res) => {
  res.json({
    server: 'running',
    linkedinImport: 'available',
    routes: {
      import: '/li-import',
      api: '/api/import/linkedin'
    },
    timestamp: new Date().toISOString()
  });
});

// Test page
app.get('/li-import', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'li-import.html');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('LinkedIn import page not found');
  }
});

app.get('/squarespace-linkedin-import', (req, res) => {
  res.redirect('/li-import');
});

// LinkedIn import API
app.post('/api/import/linkedin', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No CSV file uploaded' 
      });
    }

    const contacts = await parseLinkedInCSV(req.file.path);
    
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('File cleanup error:', err);
    });
    
    res.json({
      success: true,
      message: `Successfully imported ${contacts.length} contacts from LinkedIn`,
      contacts,
      count: contacts.length
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

// Fallback routes
app.get('/', (req, res) => {
  res.redirect('/li-import');
});

app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Page not found');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`BeeTagged LinkedIn Import Server`);
  console.log(`Running on port: ${PORT}`);
  console.log(`Test page: /li-import`);
  console.log(`API: /api/import/linkedin`);
});

module.exports = app;