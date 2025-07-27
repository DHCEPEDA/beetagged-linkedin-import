const express = require('express');
const router = express.Router();
const multer = require('multer');
const { parseLinkedInCSV } = require('../services/linkedinService');
const { generateTags } = require('../utils/dataProcessor');
const Contact = require('../models/Contact');

// File upload setup
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// LinkedIn CSV Import - Enhanced version from existing code
router.post('/import', upload.single('linkedinCsv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const csvData = req.file.buffer.toString('utf8');
    console.log('Processing LinkedIn CSV file...');

    // Parse CSV using enhanced parser
    const { contacts, stats } = await parseLinkedInCSV(csvData);
    
    if (contacts.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No valid contacts found in CSV file' 
      });
    }

    // Add metadata and save to database
    const processedContacts = contacts.map(contact => ({
      ...contact,
      tags: generateTags(contact),
      source: 'linkedin_import',
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // Save to database
    try {
      await Contact.insertMany(processedContacts, { ordered: false });
      
      console.log(`Successfully imported ${processedContacts.length} contacts`);
      res.json({
        success: true,
        count: processedContacts.length,
        processed: stats.processed,
        skipped: stats.skipped,
        message: `Successfully imported ${processedContacts.length} LinkedIn contacts`
      });
    } catch (error) {
      // Handle duplicate entries gracefully
      const insertedCount = processedContacts.length - (error.writeErrors?.length || 0);
      res.json({
        success: true,
        count: insertedCount,
        processed: stats.processed,
        skipped: stats.skipped + (error.writeErrors?.length || 0),
        message: `Processed ${insertedCount} contacts (some may have been duplicates)`
      });
    }

  } catch (error) {
    console.error('LinkedIn import error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// OAuth callback handler (for future LinkedIn API integration)
router.get('/oauth/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    // TODO: Implement LinkedIn OAuth flow
    res.json({ success: true, message: 'LinkedIn OAuth not yet implemented' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Fetch user's LinkedIn connections via API (for future implementation)
router.post('/import-contacts', async (req, res) => {
  try {
    const { accessToken, userId } = req.body;
    // TODO: Implement LinkedIn API contact fetching
    res.json({ message: 'LinkedIn API integration coming soon' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;