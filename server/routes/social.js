const express = require('express');
const router = express.Router();
const axios = require('axios');

// In-memory session store (imported from auth.js)
// This is for demonstration purposes only
const { sessions } = require('./auth');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  const authToken = req.headers['x-auth-token'] || req.query.token;
  
  if (!authToken || !sessions[authToken] || !sessions[authToken].user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  req.user = sessions[authToken].user;
  req.authToken = authToken;
  req.facebook = sessions[authToken].facebook;
  next();
};

// Get Facebook friends
router.get('/facebook/friends', isAuthenticated, async (req, res) => {
  if (!req.facebook || !req.facebook.access_token) {
    return res.status(400).json({ message: 'No Facebook access token' });
  }
  
  try {
    const response = await axios.get('https://graph.facebook.com/v18.0/me/friends', {
      params: {
        access_token: req.facebook.access_token
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching Facebook friends:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Failed to fetch friends',
      error: error.response?.data || error.message
    });
  }
});

// Get Facebook profile
router.get('/facebook/profile', isAuthenticated, async (req, res) => {
  if (!req.facebook || !req.facebook.access_token) {
    return res.status(400).json({ message: 'No Facebook access token' });
  }
  
  try {
    const response = await axios.get('https://graph.facebook.com/v18.0/me', {
      params: {
        fields: 'id,name,email,picture,link,hometown,location,gender',
        access_token: req.facebook.access_token
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching Facebook profile:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Failed to fetch profile',
      error: error.response?.data || error.message
    });
  }
});

// Match contacts with Facebook friends (demo endpoint)
router.post('/contacts/match', isAuthenticated, (req, res) => {
  const { contacts } = req.body;
  
  if (!contacts || !Array.isArray(contacts)) {
    return res.status(400).json({ message: 'Invalid contacts array' });
  }
  
  // This is a simple mock implementation for demo purposes
  // In a real application, this would use sophisticated matching algorithms
  const enhancedContacts = contacts.map(contact => {
    // Simulate a 30% match rate
    const hasMatch = Math.random() < 0.3;
    
    if (!hasMatch) {
      return contact;
    }
    
    return {
      ...contact,
      facebook: {
        id: `fb_${Math.floor(Math.random() * 1000000000)}`,
        name: contact.name,
        picture: {
          data: {
            url: `https://picsum.photos/id/${Math.floor(Math.random() * 100)}/200`
          }
        }
      }
    };
  });
  
  res.json({
    total: contacts.length,
    matched: enhancedContacts.filter(c => c.facebook).length,
    contacts: enhancedContacts
  });
});

module.exports = router;