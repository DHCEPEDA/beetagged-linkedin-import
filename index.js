const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Set up file upload configuration
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 } // 5MB max
});

// Serve static files from dist (React build) and public
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date().toISOString() });
});

// API ping
app.get('/api/ping', (req, res) => {
  res.json({
    success: true,
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

// LinkedIn CSV parser function
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
        
        const fieldMapping = {
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
        
        Object.keys(data).forEach(column => {
          if (fieldMapping[column] && data[column]) {
            contact[fieldMapping[column]] = data[column].trim();
          }
        });
        
        contact.name = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
        
        const potentialTags = [];
        if (contact.location) potentialTags.push({ type: 'location', name: contact.location });
        if (contact.company) potentialTags.push({ type: 'company', name: contact.company });
        if (contact.title) potentialTags.push({ type: 'position', name: contact.title });
        if (contact.industry) potentialTags.push({ type: 'industry', name: contact.industry });
        
        contact.picture = 'https://cdn.jsdelivr.net/npm/simple-icons@v6/icons/linkedin.svg';
        contact.tags = potentialTags;
        
        results.push(contact);
      })
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

// LinkedIn import endpoint
app.post('/api/import/linkedin', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded or file is not a CSV' 
      });
    }

    const contacts = await parseLinkedInCSV(req.file.path);
    
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting file:', err);
    });
    
    res.status(200).json({
      success: true,
      message: `Successfully imported ${contacts.length} contacts from LinkedIn`,
      contacts
    });
  } catch (error) {
    console.error('LinkedIn import error:', error);
    
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to import LinkedIn contacts',
      error: error.message
    });
  }
});

// Squarespace LinkedIn import page
app.get('/squarespace-linkedin-import', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'squarespace-linkedin-import.html'));
});

// LinkedIn import page
app.get('/linkedin-import', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'linkedin-import.html'));
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('App not found');
  }
});

// Debug route to verify server is running
app.get('/debug', (req, res) => {
  res.json({
    status: 'Server is running',
    port: PORT,
    timestamp: new Date().toISOString(),
    routes: [
      '/squarespace-linkedin-import',
      '/linkedin-import', 
      '/api/import/linkedin',
      '/health',
      '/api/ping'
    ]
  });
});

// Start server on port that Replit expects
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`BeeTagged server running on port ${PORT}`);
  console.log(`LinkedIn import: http://localhost:${PORT}/squarespace-linkedin-import`);
  console.log(`External domain should serve: https://beetagged-server.replit.app/squarespace-linkedin-import`);
  console.log(`Debug endpoint: https://beetagged-server.replit.app/debug`);
  console.log(`Access at: http://localhost:${PORT}`);
});