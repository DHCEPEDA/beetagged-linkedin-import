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
    // Check for error parameters returned by Facebook
    if (req.query.error) {
      const errorReason = req.query.error_reason || '';
      const errorDescription = req.query.error_description || 'Unknown Facebook error';
      
      let customErrorMessage = errorDescription;
      
      // Check for common Facebook errors and provide more helpful messages
      if (errorReason === 'user_denied') {
        customErrorMessage = 'You declined to authorize the application.';
      } else if (errorDescription.includes('redirect_uri') || errorDescription.includes('URL')) {
        customErrorMessage = 'The redirect URI does not match the one registered in the Facebook Developer Console. ' +
          'Please update your Facebook app settings to include: ' + 
          process.env.FACEBOOK_REDIRECT_URI || `https://${req.get('host')}/api/auth/facebook/callback`;
      }
      
      throw new Error(customErrorMessage);
    }
    
    const result = await authService.facebook.handleCallback(req);
    
    // Store token in session
    req.session.facebookToken = result.token;
    req.session.facebookUser = result.profile;
    
    // Redirect to success page
    res.redirect(`/facebook-success.html?token=${result.token}&name=${encodeURIComponent(result.profile.name)}&id=${result.profile.id}`);
  } catch (error) {
    console.error('Facebook callback error:', error);
    
    // Provide a more user-friendly error message
    let errorMessage = error.message;
    
    // Add special instructions for redirect_uri issues
    if (errorMessage.includes('redirect_uri') || errorMessage.includes('URL')) {
      errorMessage = 'Facebook configuration error: ' + errorMessage + 
        ' Please verify your Facebook Developer Console settings.';
    }
    
    res.redirect(`/?auth=error&provider=facebook&message=${encodeURIComponent(errorMessage)}`);
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
    // Check for error parameters returned by LinkedIn
    if (req.query.error) {
      const errorDescription = req.query.error_description || 'Unknown LinkedIn error';
      
      let customErrorMessage = errorDescription;
      
      // Check for common LinkedIn errors and provide more helpful messages
      if (errorDescription.includes('redirect_uri') || errorDescription.includes('redirect uri')) {
        customErrorMessage = 'The redirect URI does not match the one registered in the LinkedIn Developer Console. ' +
          'Please update your LinkedIn app settings to include: ' + 
          process.env.LINKEDIN_REDIRECT_URI || `https://${req.get('host')}/api/auth/linkedin/callback`;
      }
      
      throw new Error(customErrorMessage);
    }
    
    const result = await authService.linkedin.handleCallback(req);
    
    // Store token in session
    req.session.linkedinToken = result.token;
    req.session.linkedinUser = result.profile;
    
    // Redirect to success page
    res.redirect(`/linkedin-success.html?token=${result.token}&name=${encodeURIComponent(result.profile.name || '')}&id=${result.profile.id}`);
  } catch (error) {
    console.error('LinkedIn callback error:', error);
    
    // Provide a more user-friendly error message
    let errorMessage = error.message;
    
    // Add special instructions for redirect_uri issues
    if (errorMessage.includes('redirect_uri') || errorMessage.includes('redirect URI')) {
      errorMessage = 'LinkedIn configuration error: ' + errorMessage + 
        ' Please verify your LinkedIn Developer Console settings.';
    }
    
    res.redirect(`/?auth=error&provider=linkedin&message=${encodeURIComponent(errorMessage)}`);
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