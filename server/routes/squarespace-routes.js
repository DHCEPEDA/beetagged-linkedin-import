/**
 * Squarespace Integration Routes
 * Handles file uploads and access code generation for LinkedIn imports
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { generateRandomCode } = require('../utils/code-generator');

// Configure file storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Generate a unique name for the file
    const uniqueId = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, `linkedin-${uniqueId}${extension}`);
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

// Configure multer with our storage and filter
const upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// In-memory storage for access codes (replace with database in production)
const accessCodes = {};

// LinkedIn CSV upload route (for Squarespace integration)
router.post('/linkedin-upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded or file is not a CSV'
      });
    }
    
    logger.info('LinkedIn CSV file uploaded', {
      filename: file.filename,
      size: file.size,
      ip: req.ip
    });
    
    // Generate a 6-character access code
    const accessCode = generateRandomCode(6);
    
    // Store the access code with the file path
    accessCodes[accessCode] = {
      filePath: file.path,
      uploadTime: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hour expiration
      used: false
    };
    
    // Return success with the access code
    res.json({
      success: true,
      message: 'File uploaded successfully',
      accessCode: accessCode
    });
    
  } catch (error) {
    logger.error('Error uploading LinkedIn CSV file', {
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Error processing file: ' + error.message
    });
  }
});

// Route to check if an access code is valid
router.get('/check-code/:code', (req, res) => {
  const accessCode = req.params.code;
  
  if (!accessCode || accessCode.length !== 6) {
    return res.status(400).json({
      success: false,
      message: 'Invalid access code format'
    });
  }
  
  // Check if code exists
  const codeData = accessCodes[accessCode];
  
  if (!codeData) {
    return res.status(404).json({
      success: false,
      message: 'Access code not found'
    });
  }
  
  // Check if code is expired
  if (Date.now() > codeData.expiresAt) {
    return res.status(400).json({
      success: false,
      message: 'Access code has expired'
    });
  }
  
  // Check if code has been used
  if (codeData.used) {
    return res.status(400).json({
      success: false,
      message: 'Access code has already been used'
    });
  }
  
  // Code is valid
  res.json({
    success: true,
    message: 'Access code is valid'
  });
});

// Route to retrieve LinkedIn data using an access code
router.get('/retrieve/:code', (req, res) => {
  const accessCode = req.params.code;
  
  if (!accessCode || accessCode.length !== 6) {
    return res.status(400).json({
      success: false,
      message: 'Invalid access code format'
    });
  }
  
  // Check if code exists
  const codeData = accessCodes[accessCode];
  
  if (!codeData) {
    return res.status(404).json({
      success: false,
      message: 'Access code not found'
    });
  }
  
  // Check if code is expired
  if (Date.now() > codeData.expiresAt) {
    return res.status(400).json({
      success: false,
      message: 'Access code has expired'
    });
  }
  
  // Check if code has been used
  if (codeData.used) {
    return res.status(400).json({
      success: false,
      message: 'Access code has already been used'
    });
  }
  
  // Read and parse the CSV file
  try {
    const filePath = codeData.filePath;
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // Mark code as used
    codeData.used = true;
    
    // Read file and process CSV data here
    // In a real implementation, we would parse the CSV and return the data
    // For now, we'll just return a success message with mock data
    
    // Read file content
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Process the CSV (basic example)
    const lines = fileContent.trim().split('\n');
    const headers = lines[0].split(',');
    
    const connections = [];
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      // Handle possible commas within quoted fields
      let currentLine = lines[i];
      const values = [];
      let insideQuotes = false;
      let currentValue = '';
      
      for (let j = 0; j < currentLine.length; j++) {
        const char = currentLine[j];
        
        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          values.push(currentValue);
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      
      // Add the last value
      values.push(currentValue);
      
      // Create an object from headers and values
      const connection = {};
      for (let j = 0; j < headers.length && j < values.length; j++) {
        // Clean up field names and values
        const fieldName = headers[j].trim().replace(/^"/, '').replace(/"$/, '');
        const fieldValue = values[j].trim().replace(/^"/, '').replace(/"$/, '');
        connection[fieldName] = fieldValue;
      }
      
      connections.push(connection);
    }
    
    logger.info('LinkedIn data retrieved successfully', {
      accessCode: accessCode,
      connectionCount: connections.length
    });
    
    res.json({
      success: true,
      message: 'LinkedIn data retrieved successfully',
      connections: connections
    });
    
  } catch (error) {
    logger.error('Error retrieving LinkedIn data', {
      error: error.message,
      stack: error.stack,
      accessCode: accessCode
    });
    
    res.status(500).json({
      success: false,
      message: 'Error retrieving data: ' + error.message
    });
  }
});

module.exports = router;