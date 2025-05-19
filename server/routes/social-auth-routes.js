const express = require('express');
const router = express.Router();
const authService = require('../services/auth-service');

// Facebook Authentication Routes
router.get('/facebook/url', (req, res) => {
  try {
    const authUrl = authService.facebook.getAuthUrl(req);
    res.json(authUrl);
  } catch (error) {
    console.error('Error generating Facebook auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authentication URL' });
  }
});

router.get('/facebook/callback', async (req, res) => {
  try {
    const result = await authService.facebook.handleCallback(req);
    
    // Store token in session
    req.session.facebookToken = result.token;
    req.session.facebookUser = result.profile;
    
    // Redirect to success page
    res.redirect(`/facebook-success.html?token=${result.token}&name=${encodeURIComponent(result.profile.name)}&id=${result.profile.id}`);
  } catch (error) {
    console.error('Facebook callback error:', error);
    res.redirect(`/?auth=error&provider=facebook&message=${encodeURIComponent(error.message)}`);
  }
});

router.get('/facebook/contacts', async (req, res) => {
  try {
    const token = req.session.facebookToken || req.query.token;
    
    if (!token) {
      return res.status(401).json({ error: 'No Facebook token available' });
    }
    
    const contacts = await authService.facebook.getContacts(token);
    res.json({ contacts });
  } catch (error) {
    console.error('Error fetching Facebook contacts:', error);
    res.status(500).json({ error: error.message });
  }
});

// LinkedIn Authentication Routes
router.get('/linkedin/url', (req, res) => {
  try {
    const authUrl = authService.linkedin.getAuthUrl(req);
    res.json(authUrl);
  } catch (error) {
    console.error('Error generating LinkedIn auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authentication URL' });
  }
});

router.get('/linkedin/callback', async (req, res) => {
  try {
    const result = await authService.linkedin.handleCallback(req);
    
    // Store token in session
    req.session.linkedinToken = result.token;
    req.session.linkedinUser = result.profile;
    
    // Redirect to success page
    res.redirect(`/linkedin-success.html?token=${result.token}&name=${encodeURIComponent(result.profile.name || '')}&id=${result.profile.id}`);
  } catch (error) {
    console.error('LinkedIn callback error:', error);
    res.redirect(`/?auth=error&provider=linkedin&message=${encodeURIComponent(error.message)}`);
  }
});

router.get('/linkedin/contacts', async (req, res) => {
  try {
    const token = req.session.linkedinToken || req.query.token;
    
    if (!token) {
      return res.status(401).json({ error: 'No LinkedIn token available' });
    }
    
    const contacts = await authService.linkedin.getContacts(token);
    res.json({ contacts });
  } catch (error) {
    console.error('Error fetching LinkedIn contacts:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;