/**
 * Squarespace Integration Routes
 * Handles LinkedIn CSV imports from Squarespace site
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { parseLinkedInCSV } = require('../utils/linkedin-csv-parser');
const logger = require('../../utils/logger');

// Set up storage for uploaded files
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
    cb(null, 'linkedin-' + uniqueSuffix + path.extname(file.originalname));
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
  limits: { fileSize: 5 * 1024 * 1024 } // Limit to 5MB
});

// Store for upload codes and processed data
// In a production environment, this should be in a proper database
const uploadStore = {
  // Structure: { code: { data: parsedData, expiry: timestamp, filename: originalFileName } }
  uploads: {},
  
  // Generate a new code and store data
  createUpload: function(data, filename) {
    // Generate 6-character alphanumeric code (easy for users to type)
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now
    
    this.uploads[code] = {
      data: data,
      expiry: expiry,
      filename: filename,
      createdAt: Date.now()
    };
    
    return code;
  },
  
  // Get data by code
  getUpload: function(code) {
    const upload = this.uploads[code];
    if (!upload) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > upload.expiry) {
      delete this.uploads[code];
      return null;
    }
    
    return upload;
  },
  
  // Clean up after successful retrieval
  removeUpload: function(code) {
    if (this.uploads[code]) {
      delete this.uploads[code];
      return true;
    }
    return false;
  },
  
  // Run cleanup routine to remove expired uploads
  cleanup: function() {
    const now = Date.now();
    let count = 0;
    
    for (const code in this.uploads) {
      if (now > this.uploads[code].expiry) {
        delete this.uploads[code];
        count++;
      }
    }
    
    return count;
  }
};

// Run cleanup every hour
setInterval(() => {
  const removed = uploadStore.cleanup();
  if (removed > 0) {
    logger.info(`Cleaned up ${removed} expired LinkedIn uploads`);
  }
}, 60 * 60 * 1000);

/**
 * @route POST /api/squarespace/linkedin-upload
 * @desc Upload LinkedIn CSV from Squarespace site
 * @access Public
 */
router.post('/linkedin-upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    logger.info('LinkedIn CSV file uploaded from Squarespace', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
    
    // Parse the CSV file
    const filePath = req.file.path;
    const contactsData = await parseLinkedInCSV(filePath);
    
    if (!contactsData || contactsData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to parse contacts from the CSV file'
      });
    }
    
    // Generate access code
    const accessCode = uploadStore.createUpload(contactsData, req.file.originalname);
    
    logger.info('LinkedIn contacts processed successfully', {
      contacts: contactsData.length,
      accessCode: accessCode
    });
    
    // Return success with access code
    res.status(200).json({
      success: true,
      message: `Successfully processed ${contactsData.length} contacts`,
      accessCode: accessCode,
      expiresIn: '24 hours'
    });
    
    // Remove the file after processing
    fs.unlink(filePath, (err) => {
      if (err) {
        logger.error('Error deleting file after processing', {
          error: err.message,
          file: filePath
        });
      }
    });
  } catch (error) {
    logger.error('Error processing LinkedIn CSV upload', {
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: `Error processing file: ${error.message}`
    });
  }
});

/**
 * @route GET /api/squarespace/retrieve/:code
 * @desc Retrieve processed LinkedIn contacts using access code
 * @access Public
 */
router.get('/retrieve/:code', (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const uploadData = uploadStore.getUpload(code);
    
    if (!uploadData) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired access code'
      });
    }
    
    logger.info('LinkedIn contacts retrieved using access code', {
      accessCode: code,
      contacts: uploadData.data.length
    });
    
    // Return the data
    res.status(200).json({
      success: true,
      message: `Successfully retrieved ${uploadData.data.length} contacts`,
      contacts: uploadData.data,
      originalFilename: uploadData.filename
    });
    
    // Remove the upload data after retrieval (one-time use)
    uploadStore.removeUpload(code);
  } catch (error) {
    logger.error('Error retrieving LinkedIn contacts', {
      error: error.message,
      code: req.params.code
    });
    
    res.status(500).json({
      success: false,
      message: `Error retrieving contacts: ${error.message}`
    });
  }
});

/**
 * @route GET /api/squarespace/check-code/:code
 * @desc Check if an access code is valid without retrieving data
 * @access Public
 */
router.get('/check-code/:code', (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const uploadData = uploadStore.getUpload(code);
    
    if (!uploadData) {
      return res.status(200).json({
        valid: false,
        message: 'Invalid or expired access code'
      });
    }
    
    res.status(200).json({
      valid: true,
      message: 'Access code is valid',
      contacts: uploadData.data.length,
      expiresAt: new Date(uploadData.expiry).toISOString()
    });
  } catch (error) {
    res.status(500).json({
      valid: false,
      message: `Error checking access code: ${error.message}`
    });
  }
});

module.exports = router;