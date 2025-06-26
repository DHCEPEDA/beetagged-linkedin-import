const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Simple upload setup
const upload = multer({ dest: 'uploads/' });

// In-memory storage
let contacts = [];
let tags = [];
let contactIdCounter = 1;

// Helper function
function parseLinkedInCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        if (data['First Name'] || data['Last Name'] || data.Company) {
          results.push({
            firstName: data['First Name'] || '',
            lastName: data['Last Name'] || '',
            company: data.Company || '',
            position: data.Position || '',
            email: data['Email Address'] || ''
          });
        }
      })
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// Routes
app.get('/', (req, res) => {
  res.send(`
    <h1>BeeTagged Server</h1>
    <p>Server is running! Contacts: ${contacts.length}</p>
    <ul>
      <li><a href="/li-import">LinkedIn Import</a></li>
      <li><a href="/api/contacts">View Contacts</a></li>
    </ul>
  `);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', contacts: contacts.length });
});

app.post('/api/import/linkedin', upload.single('linkedinCsv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const csvData = await parseLinkedInCSV(req.file.path);
    
    csvData.forEach(row => {
      const contact = {
        _id: contactIdCounter++,
        name: `${row.firstName} ${row.lastName}`.trim(),
        company: row.company,
        title: row.position,
        email: row.email,
        source: 'linkedin_import',
        createdAt: new Date().toISOString()
      };
      contacts.push(contact);
    });

    // Clean up
    fs.unlink(req.file.path, () => {});

    res.json({
      success: true,
      message: `Imported ${csvData.length} contacts`,
      count: csvData.length,
      totalContacts: contacts.length
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ success: false, message: 'Import failed' });
  }
});

app.get('/api/contacts', (req, res) => {
  res.json({
    success: true,
    contacts: contacts,
    total: contacts.length
  });
});

app.get('/li-import', (req, res) => {
  res.send(`
    <h1>LinkedIn Import</h1>
    <form action="/api/import/linkedin" method="post" enctype="multipart/form-data">
      <p>Upload your LinkedIn connections CSV file:</p>
      <input type="file" name="linkedinCsv" accept=".csv" required>
      <button type="submit">Import Contacts</button>
    </form>
    <p><a href="/">Back to Home</a></p>
  `);
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, (err) => {
  if (err) {
    console.error('Server failed to start:', err);
    process.exit(1);
  }
  console.log(`Server running on port ${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

module.exports = app;