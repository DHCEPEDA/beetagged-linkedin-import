const express = require('express');
const router = express.Router();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Configuration
const FB_APP_ID = process.env.FACEBOOK_APP_ID || '1222790436230433';
const FB_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'https://workspace.dhcepeda.repl.co/login';

// In-memory session store for demo (in production, use Redis or a database)
// This simulates server-side sessions without cookies for the demo
const sessions = {};

// Export sessions for use in other modules
module.exports.sessions = sessions;

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  const authToken = req.headers['x-auth-token'] || req.query.token;
  
  if (!authToken || !sessions[authToken] || !sessions[authToken].user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  req.user = sessions[authToken].user;
  req.authToken = authToken;
  next();
};

// Get Facebook auth URL
router.get('/facebook/url', (req, res) => {
  // Create a session token
  const state = uuidv4();
  sessions[state] = { created: new Date() };
  
  // Build Facebook OAuth URL
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}&scope=public_profile,email,user_friends`;
  
  res.json({ url: authUrl, state });
});

// Facebook OAuth callback
router.get('/facebook/callback', async (req, res) => {
  const { code, state } = req.query;
  
  // Validate state to prevent CSRF
  if (!state || !sessions[state]) {
    return res.status(400).json({ message: 'Invalid state parameter' });
  }
  
  try {
    // Exchange authorization code for access token
    const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: FB_APP_ID,
        client_secret: FB_APP_SECRET,
        redirect_uri: REDIRECT_URI,
        code
      }
    });
    
    const { access_token, expires_in } = tokenResponse.data;
    
    // Get user data from Facebook
    const userResponse = await axios.get('https://graph.facebook.com/v18.0/me', {
      params: {
        fields: 'id,name,email,picture',
        access_token
      }
    });
    
    // Create authenticated session
    const authToken = uuidv4();
    sessions[authToken] = {
      user: userResponse.data,
      facebook: {
        access_token,
        expires_in
      },
      created: new Date()
    };
    
    // Remove the state session
    delete sessions[state];
    
    // Return user data and token
    res.json({
      user: userResponse.data,
      token: authToken
    });
  } catch (error) {
    console.error('Facebook auth error:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Authentication failed',
      error: error.response?.data || error.message
    });
  }
});

// Get current user
router.get('/me', isAuthenticated, (req, res) => {
  res.json(req.user);
});

// Logout
router.post('/logout', isAuthenticated, (req, res) => {
  delete sessions[req.authToken];
  res.json({ message: 'Logged out successfully' });
});

// For testing purposes only - in a real app, these endpoints would be properly secured
if (process.env.NODE_ENV !== 'production') {
  // Debug endpoint to get all sessions
  router.get('/debug/sessions', (req, res) => {
    const sanitizedSessions = {};
    for (const [key, session] of Object.entries(sessions)) {
      sanitizedSessions[key] = {
        ...session,
        facebook: session.facebook ? {
          ...session.facebook,
          access_token: session.facebook.access_token ? `${session.facebook.access_token.substring(0, 10)}...` : null
        } : null
      };
    }
    res.json(sanitizedSessions);
  });
  
  // Test login endpoint for development
  router.get('/test/login', (req, res) => {
    const authToken = uuidv4();
    sessions[authToken] = {
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        picture: {
          data: {
            url: 'https://via.placeholder.com/200'
          }
        }
      },
      created: new Date()
    };
    
    res.json({
      user: sessions[authToken].user,
      token: authToken
    });
  });
}

module.exports = router;