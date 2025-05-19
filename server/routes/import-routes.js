/**
 * BeeTagged - Import Routes
 * This file handles routes for importing contacts from different sources,
 * including LinkedIn CSV exports.
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { parseLinkedInCSV, saveImportedContacts } = require('../utils/linkedin-csv-parser');

// Set up file storage for uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads');
    
    // Create uploads directory if it doesn't exist
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

// File filter to only accept CSV files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv' || 
      file.originalname.toLowerCase().endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'), false);
  }
};

// Initialize multer upload
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5 // 5MB max file size
  }
});

/**
 * @route POST /api/import/linkedin
 * @desc Import LinkedIn connections from CSV file
 * @access Private
 */
router.post('/linkedin', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded or file is not a CSV' 
      });
    }

    // Parse the CSV file
    const contacts = await parseLinkedInCSV(req.file.path);
    
    // Save contacts (in a real app, this would save to a database)
    // Here we're just returning the parsed contacts
    // const savedContacts = await saveImportedContacts(contacts, req.user.id);
    
    // Clean up the uploaded file
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
    
    // Clean up the uploaded file if it exists
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

/**
 * @route GET /api/import/linkedin/instructions
 * @desc Get instructions for exporting LinkedIn connections
 * @access Public
 */
router.get('/linkedin/instructions', (req, res) => {
  const instructions = {
    title: 'How to Export Your LinkedIn Connections',
    steps: [
      'Sign in to your LinkedIn account',
      'Click on "Me" icon at top of your LinkedIn homepage',
      'Select "Settings & Privacy" from the dropdown menu',
      'Click on "Data privacy" in the left panel',
      'In the "How LinkedIn uses your data" section, click on "Get a copy of your data"',
      'Select "Connections" under "Want something in particular?"',
      'Click "Request archive"',
      'LinkedIn will email you a download link when your file is ready',
      'After downloading, upload the CSV file using our import tool'
    ],
    notes: [
      'LinkedIn typically delivers the export within minutes or hours',
      'The CSV file contains your connections\' details like name, email, company, position, etc.',
      'Our system will automatically generate tags based on your connections\' data',
      'Your data is transmitted securely and no one else can access your contacts'
    ]
  };
  
  res.status(200).json(instructions);
});

module.exports = router;