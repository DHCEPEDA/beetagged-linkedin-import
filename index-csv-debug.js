const express = require('express');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

console.log('=== BEETAGGED SERVER WITH ENHANCED CSV DEBUG ===');

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
    console.log('File upload details:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files allowed'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Simple storage
let contacts = [];
let contactCounter = 1;
let tags = [];
let tagCounter = 1;

// Enhanced CSV parser with extensive debugging
function parseLinkedInCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    let headers = [];
    let rowCount = 0;
    
    console.log('Starting to parse CSV file:', filePath);
    
    // First, read a few lines to inspect the file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n').slice(0, 5);
    console.log('First 5 lines of CSV:');
    lines.forEach((line, index) => {
      console.log(`Line ${index + 1}: "${line}"`);
    });
    
    fs.createReadStream(filePath)
      .pipe(csv({ 
        skipEmptyLines: true, 
        headers: true,
        separator: ',',
        mapHeaders: ({ header, index }) => {
          const cleanHeader = header.toLowerCase().trim().replace(/[^\w\s]/g, '');
          headers.push({ original: header, cleaned: cleanHeader, index });
          console.log(`Header ${index}: "${header}" -> "${cleanHeader}"`);
          return cleanHeader;
        }
      }))
      .on('data', (data) => {
        rowCount++;
        console.log(`\n--- Row ${rowCount} ---`);
        console.log('Raw data keys:', Object.keys(data));
        console.log('Raw data values:', Object.values(data));
        
        // Try multiple strategies to extract contact info
        const strategies = [
          // Strategy 1: Standard LinkedIn export format
          {
            firstName: data['first name'] || data['firstname'],
            lastName: data['last name'] || data['lastname'],
            company: data['company'],
            position: data['position'],
            email: data['email address'] || data['email']
          },
          // Strategy 2: Alternative field names
          {
            firstName: data['name'] ? data['name'].split(' ')[0] : '',
            lastName: data['name'] ? data['name'].split(' ').slice(1).join(' ') : '',
            company: data['organization'] || data['employer'],
            position: data['title'] || data['job title'],
            email: data['email']
          },
          // Strategy 3: Find any text fields
          {
            firstName: Object.values(data)[0] || '',
            lastName: Object.values(data)[1] || '',
            company: Object.values(data)[2] || '',
            position: Object.values(data)[3] || '',
            email: Object.values(data).find(val => val && val.includes('@')) || ''
          }
        ];
        
        let contact = null;
        
        for (let i = 0; i < strategies.length; i++) {
          const candidate = strategies[i];
          console.log(`Strategy ${i + 1}:`, candidate);
          
          if (candidate.firstName || candidate.lastName || candidate.company) {
            contact = {
              firstName: candidate.firstName || '',
              lastName: candidate.lastName || '',
              emailAddress: candidate.email || '',
              company: candidate.company || '',
              position: candidate.position || '',
              connectedOn: data['connected on'] || '',
              url: data['url'] || ''
            };
            console.log(`Strategy ${i + 1} SUCCESS:`, contact);
            break;
          }
        }
        
        if (contact) {
          results.push(contact);
          console.log(`Contact ${results.length} added:`, contact.firstName, contact.lastName, contact.company);
        } else {
          console.log('No valid contact found in this row');
        }
      })
      .on('end', () => {
        console.log('\n=== CSV PARSING COMPLETE ===');
        console.log('Headers found:', headers);
        console.log('Total rows processed:', rowCount);
        console.log('Valid contacts extracted:', results.length);
        console.log('Sample contacts:', results.slice(0, 3));
        resolve(results);
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        reject(error);
      });
  });
}

// Root route
app.get('/', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>BeeTagged - CSV Debug Version</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f8fafc; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
        h1 { color: #2563eb; }
        .debug-info { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .status { color: #059669; font-weight: bold; background: #dcfce7; padding: 10px; border-radius: 5px; }
        .linkedin-section { background: #0077b5; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .linkedin-section a { background: white; color: #0077b5; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🐝 BeeTagged - CSV Debug Version</h1>
        
        <div class="status">✓ Server running with enhanced CSV debugging</div>
        
        <div class="debug-info">
          <h3>🔍 Debug Features Active</h3>
          <ul>
            <li>Detailed CSV header inspection</li>
            <li>Multiple parsing strategies</li>
            <li>Row-by-row processing logs</li>
            <li>Flexible field mapping</li>
          </ul>
        </div>
        
        <div class="linkedin-section">
          <h3>📋 LinkedIn Import (Debug Mode)</h3>
          <p>Upload your CSV file to see detailed parsing information.</p>
          <a href="/li-import">Import LinkedIn Connections</a>
        </div>
        
        <p>Contacts stored: ${contacts.length}</p>
        <p><a href="/api/contacts">View Contacts API</a></p>
      </div>
    </body>
    </html>
  `;
  res.send(html);
});

// LinkedIn import page
app.get('/li-import', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>LinkedIn Import Debug - BeeTagged</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
        h1 { color: #0077b5; }
        .upload-area { border: 2px dashed #0077b5; padding: 40px; text-align: center; border-radius: 10px; margin: 20px 0; }
        button { background: #0077b5; color: white; padding: 15px 30px; border: none; border-radius: 5px; cursor: pointer; }
        .debug-note { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📋 LinkedIn Import (Debug Mode)</h1>
        
        <div class="debug-note">
          <h3>🔍 Debug Mode Active</h3>
          <p>This version will show detailed information about your CSV file structure and parsing process. Check the server logs for detailed output.</p>
        </div>

        <form action="/api/import/linkedin" method="post" enctype="multipart/form-data">
          <div class="upload-area">
            <h3>📁 Upload LinkedIn CSV</h3>
            <input type="file" name="linkedinCsv" accept=".csv" required>
            <p>Any CSV format accepted - will attempt multiple parsing strategies</p>
            <button type="submit">Import & Debug</button>
          </div>
        </form>

        <a href="/">← Back to Dashboard</a>
      </div>
    </body>
    </html>
  `;
  res.send(html);
});

// LinkedIn import API with enhanced debugging
app.post('/api/import/linkedin', upload.single('linkedinCsv'), async (req, res) => {
  try {
    console.log('\n=== LINKEDIN IMPORT REQUEST ===');
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No CSV file uploaded' });
    }

    console.log('File received:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });

    const csvData = await parseLinkedInCSV(req.file.path);
    
    console.log('CSV parsing result:', {
      totalRows: csvData.length,
      sample: csvData.slice(0, 2)
    });
    
    if (csvData.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No valid contacts found in CSV file. Check server logs for detailed parsing information.',
        debug: 'Enable debug mode to see detailed parsing logs'
      });
    }

    const importedContacts = [];
    
    csvData.forEach(row => {
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
      }
      
      if (row.position) {
        contactTags.push({ name: row.position, category: 'title' });
      }
      
      contactTags.push({ name: 'LinkedIn Connection', category: 'source' });
      
      contact.tags = contactTags;
      contacts.push(contact);
      importedContacts.push(contact);
    });
    
    // Clean up uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('File cleanup error:', err);
    });
    
    console.log(`✓ Successfully imported ${importedContacts.length} LinkedIn contacts`);
    
    res.json({
      success: true,
      message: `Successfully imported ${importedContacts.length} contacts from LinkedIn`,
      contacts: importedContacts,
      count: importedContacts.length,
      totalContacts: contacts.length,
      debug: {
        originalRowCount: csvData.length,
        processedContacts: importedContacts.length
      }
    });
    
  } catch (error) {
    console.error('LinkedIn import error:', error);
    
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to import LinkedIn contacts',
      error: error.message,
      debug: 'Check server logs for detailed error information'
    });
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

app.post('/api/contacts', (req, res) => {
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
  
  contacts.push(contact);
  res.redirect('/');
});

// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, function(err) {
  if (err) {
    console.error('❌ FATAL: Server failed to start:', err);
    process.exit(1);
  }
  
  console.log(`🚀 BeeTagged CSV Debug server running on port ${PORT}`);
});

module.exports = app;