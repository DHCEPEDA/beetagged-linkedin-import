/**
 * LinkedIn Authentication Routes
 * 
 * Handles OAuth authentication with LinkedIn for user login and contact import
 */
const express = require('express');
const router = express.Router();
const axios = require('axios');
const querystring = require('querystring');
const linkedinConfig = require('../config/linkedin');
const logger = require('../../utils/logger');
const contactSyncService = require('../services/contact-sync-service');

// LinkedIn Configuration Endpoint
router.get('/config', (req, res) => {
  logger.info('LinkedIn config requested', { 
    ip: req.ip,
    host: req.get('host')
  });
  
  // Return only the client ID and not the secret
  res.json({
    clientId: linkedinConfig.clientId,
    redirectUri: linkedinConfig.redirectUri,
    scope: linkedinConfig.scope
  });
});

// LinkedIn Authentication URL
router.get('/url', (req, res) => {
  logger.info('LinkedIn auth URL requested', { 
    ip: req.ip,
    host: req.get('host')
  });
  
  // Generate state for CSRF protection
  const state = Math.random().toString(36).substring(2, 15);
  
  // Construct the LinkedIn OAuth URL
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
    `response_type=code&` +
    `client_id=${linkedinConfig.clientId}&` +
    `redirect_uri=${encodeURIComponent(linkedinConfig.redirectUri)}&` +
    `state=${state}&` +
    `scope=${linkedinConfig.scope}`;
  
  logger.info('Generated LinkedIn auth URL', {
    redirectUri: linkedinConfig.redirectUri,
    state: state.substring(0, 5) + '...'
  });
  
  res.json({ url: authUrl });
});

// LinkedIn Authentication Callback
router.get('/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query;
  
  logger.info('LinkedIn auth callback received', { 
    state,
    host: req.get('host'),
    hasError: !!error
  });
  
  // Check if LinkedIn returned an error
  if (error) {
    logger.error('Error returned from LinkedIn', {
      error,
      error_description
    });
    
    // Redirect to error page with LinkedIn error
    return res.redirect(`/auth-error.html?error=${encodeURIComponent(error)}&message=${encodeURIComponent(error_description || 'Authentication failed')}`);
  }
  
  if (!code) {
    logger.error('No authorization code received from LinkedIn');
    return res.redirect('/auth-error.html?error=no_code&message=No authorization code received');
  }
  
  try {
    // Exchange code for access token
    const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', 
      querystring.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: linkedinConfig.redirectUri,
        client_id: linkedinConfig.clientId,
        client_secret: linkedinConfig.clientSecret
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    const { access_token, expires_in } = tokenResponse.data;
    
    logger.info('LinkedIn token exchanged successfully', {
      expiresIn: expires_in,
      tokenPreview: access_token.substring(0, 5) + '...'
    });
    
    // Get user profile
    const profileResponse = await axios.get('https://api.linkedin.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    
    const profile = profileResponse.data;
    
    logger.info('LinkedIn profile retrieved', {
      profileId: profile.id
    });
    
    // Store user info and token in session (or database in a real app)
    // req.session.linkedinUser = profile;
    // req.session.linkedinToken = access_token;
    
    // Here we'd typically create or update a user record
    // And associate the LinkedIn account with that user
    
    // For now, we'll redirect to a success page with the token
    // In a real app, we wouldn't expose the token, but would store it securely
    res.redirect(`/linkedin-success.html?token=${encodeURIComponent(access_token)}`);
  } catch (error) {
    logger.error('LinkedIn authentication error', {
      error: error.message,
      responseData: error.response?.data
    });
    
    let errorMessage = 'Authentication failed';
    if (error.response && error.response.data) {
      errorMessage = `${error.response.data.error}: ${error.response.data.error_description}`;
    }
    
    res.redirect(`/auth-error.html?error=${encodeURIComponent(error.message)}&message=${encodeURIComponent(errorMessage)}`);
  }
});

// Import LinkedIn contacts
router.post('/import-contacts', async (req, res) => {
  const { accessToken } = req.body;
  
  if (!accessToken) {
    return res.status(400).json({ error: 'Access token is required' });
  }
  
  try {
    // Verify the token is valid by making a simple API call
    await axios.get('https://api.linkedin.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    // Call the contact sync service to import LinkedIn contacts
    const result = await contactSyncService.syncLinkedInContacts(req.user, accessToken);
    
    res.json(result);
  } catch (error) {
    logger.error('LinkedIn contact import error', {
      error: error.message,
      responseData: error.response?.data
    });
    
    res.status(500).json({ 
      error: 'Failed to import LinkedIn contacts',
      message: error.message,
      details: error.response?.data
    });
  }
});

module.exports = router;