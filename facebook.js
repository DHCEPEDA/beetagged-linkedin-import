const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const { generateTags } = require('../utils/dataProcessor');

// Facebook Contact Import - Enhanced from existing code
router.post('/import', async (req, res) => {
  try {
    const { contacts } = req.body;
    
    if (!contacts || !Array.isArray(contacts)) {
      return res.status(400).json({ error: 'Invalid contacts data' });
    }
    
    const savedContacts = [];
    
    for (const contactData of contacts) {
      const contact = new Contact({
        name: contactData.name,
        email: contactData.email || '',
        source: 'facebook',
        profileImage: contactData.profileImage,
        tags: ['facebook-friend', ...generateTags(contactData)],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      const saved = await contact.save();
      savedContacts.push(saved);
    }
    
    console.log(`Imported ${savedContacts.length} Facebook contacts`);
    res.json({ 
      success: true, 
      message: `Successfully imported ${savedContacts.length} contacts`,
      contacts: savedContacts 
    });
    
  } catch (error) {
    console.error('Facebook import error:', error);
    res.status(500).json({ error: 'Failed to import Facebook contacts' });
  }
});

// Facebook OAuth callback
router.get('/oauth/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    // TODO: Implement Facebook OAuth flow
    res.json({ success: true, message: 'Facebook OAuth callback received' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get Facebook user profile
router.get('/profile/:userId', async (req, res) => {
  try {
    // TODO: Fetch Facebook profile data
    res.json({ message: 'Facebook profile endpoint' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;