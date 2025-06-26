/**
 * Advanced Authentication Routes
 * Provides a robust and consistent API for authenticating with various providers
 */
const express = require('express');
const router = express.Router();
const { PROVIDERS, authService } = require('../services/AuthService');
const { isAuthenticated, optionalAuth } = require('../middleware/authMiddleware');
const axios = require('axios');

/**
 * Error handling wrapper for async route handlers
 * @param {function} fn - Async route handler function
 * @returns {function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Get authentication URL for a provider
 * Generates state token and returns auth URL for the specified provider
 * @route GET /api/v2/auth/:provider/url
 * @access Public
 */
router.get('/:provider/url', asyncHandler(async (req, res) => {
  const { provider } = req.params;
  const { returnUrl } = req.query;
  
  // Validate provider
  if (!Object.values(PROVIDERS).includes(provider)) {
    return res.status(400).json({
      success: false,
      message: `Unsupported provider: ${provider}`
    });
  }
  
  try {
    // Get full host with protocol
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const host = `${protocol}://${req.get('host')}`;
    
    // Generate authorization URL
    const { url, state } = authService.getAuthorizationUrl(provider, {
      returnUrl,
      host,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });
    
    res.json({
      success: true,
      url,
      state
    });
  } catch (error) {
    console.error(`Error generating ${provider} auth URL:`, error);
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}));

/**
 * OAuth callback handler for a provider
 * Exchanges code for token, gets user profile, creates session
 * @route GET /api/v2/auth/:provider/callback
 * @access Public
 */
router.get('/:provider/callback', asyncHandler(async (req, res) => {
  const { provider } = req.params;
  const { code, state, error: oauthError } = req.query;
  
  // Check for OAuth error
  if (oauthError) {
    return res.status(400).json({
      success: false,
      message: `Authentication error: ${oauthError}`
    });
  }
  
  // Validate provider
  if (!Object.values(PROVIDERS).includes(provider)) {
    return res.status(400).json({
      success: false,
      message: `Unsupported provider: ${provider}`
    });
  }
  
  // Validate state parameter
  const stateData = authService.validateState(state);
  if (!stateData) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired state parameter'
    });
  }
  
  try {
    // Get return URL from state data
    const returnUrl = stateData.returnUrl || '/';
    
    // Get protocol and host for building redirect URI
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const host = `${protocol}://${req.get('host')}`;
    const redirectUri = `${host}/api/v2/auth/${provider}/callback`;
    
    // Exchange code for token
    const tokenData = await authService.exchangeCodeForToken(provider, code, redirectUri);
    
    // Get user profile
    const userProfile = await authService.getUserProfile(provider, tokenData.access_token);
    
    // Create session
    const authToken = authService.createSession(userProfile, {
      provider,
      ...tokenData
    });
    
    // Clean up state
    authService.cleanupState(state);
    
    // Check if this is a test page redirect
    if (returnUrl.includes('simple-fb-test')) {
      // For testing page, redirect with data in URL parameters
      const userData = encodeURIComponent(JSON.stringify(userProfile));
      return res.redirect(`${returnUrl}?token=${authToken}&userData=${userData}`);
    } else if (returnUrl.includes('wizard')) {
      // For wizard page, redirect with token
      return res.redirect(`${returnUrl}?token=${authToken}`);
    } else if (req.xhr) {
      // For XHR/AJAX requests, return JSON
      return res.json({
        success: true,
        user: userProfile,
        token: authToken
      });
    } else {
      // For regular requests, redirect to the main app with token
      return res.redirect(`/?token=${authToken}`);
    }
  } catch (error) {
    console.error(`Error in ${provider} callback:`, error);
    
    // Clean up state even if there's an error
    authService.cleanupState(state);
    
    const returnUrl = stateData.returnUrl || '/';
    const errorMessage = encodeURIComponent(error.message);
    
    // Return error based on context
    if (returnUrl.includes('simple-fb-test') || returnUrl.includes('wizard')) {
      return res.redirect(`${returnUrl}?error=${errorMessage}`);
    } else if (req.xhr) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    } else {
      return res.redirect(`/?error=${errorMessage}`);
    }
  }
}));

/**
 * Get the current user profile
 * @route GET /api/v2/auth/me
 * @access Private
 */
router.get('/me', isAuthenticated, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

/**
 * Logout (invalidate current session)
 * @route POST /api/v2/auth/logout
 * @access Private
 */
router.post('/logout', isAuthenticated, (req, res) => {
  const result = authService.destroySession(req.authToken);
  
  res.json({
    success: result,
    message: result ? 'Logged out successfully' : 'Session not found'
  });
});

/**
 * Login with username/password
 * @route POST /api/v2/auth/login
 * @access Public
 */
router.post('/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required'
    });
  }
  
  // In a real app, this would validate against a database
  // For demo purposes, we're using a simple check
  if (username === 'testuser' && password === 'password123') {
    const userData = {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      picture: {
        data: {
          url: 'https://via.placeholder.com/200'
        }
      }
    };
    
    // Create session
    const authToken = authService.createSession(userData, {
      provider: 'local',
      method: 'password'
    });
    
    return res.json({
      success: true,
      user: userData,
      token: authToken
    });
  } else {
    return res.status(401).json({
      success: false,
      message: 'Invalid username or password'
    });
  }
}));

/**
 * Register a new user
 * @route POST /api/v2/auth/register
 * @access Public
 */
router.post('/register', asyncHandler(async (req, res) => {
  const { username, password, email } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required'
    });
  }
  
  // In a real app, this would create a new user in the database
  // For demo purposes, we'll always succeed and create a session
  const userData = {
    id: `user-${Date.now().toString(36)}`,
    name: username,
    email: email || `${username}@example.com`,
    picture: {
      data: {
        url: 'https://via.placeholder.com/200'
      }
    }
  };
  
  // Create session
  const authToken = authService.createSession(userData, {
    provider: 'local',
    method: 'registration'
  });
  
  res.status(201).json({
    success: true,
    user: userData,
    token: authToken
  });
}));

/**
 * Handle direct authentication from client-side (for compatibility)
 * @route POST /api/v2/auth/:provider
 * @access Public
 */
router.post('/:provider', asyncHandler(async (req, res) => {
  const { provider } = req.params;
  const { accessToken, userData } = req.body;
  
  // Validate provider
  if (!Object.values(PROVIDERS).includes(provider)) {
    return res.status(400).json({
      success: false,
      message: `Unsupported provider: ${provider}`
    });
  }
  
  if (!accessToken) {
    return res.status(400).json({
      success: false,
      message: 'Access token is required'
    });
  }
  
  try {
    // In production, we would verify the token with the provider
    // For now, we'll trust the client-provided data
    
    // Create normalized user data structure
    const normalizedUserData = provider === PROVIDERS.FACEBOOK ? {
      id: userData.id,
      name: userData.name,
      email: userData.email || '',
      picture: userData.picture || {
        data: {
          url: 'https://via.placeholder.com/200'
        }
      },
      provider: PROVIDERS.FACEBOOK
    } : {
      id: userData.id,
      name: userData.name,
      email: userData.email || '',
      picture: {
        data: {
          url: userData.picture || 'https://via.placeholder.com/200'
        }
      },
      provider: provider
    };
    
    // Create session
    const authToken = authService.createSession(normalizedUserData, {
      provider,
      access_token: accessToken
    });
    
    res.json({
      success: true,
      user: normalizedUserData,
      token: authToken
    });
  } catch (error) {
    console.error(`Error in direct ${provider} auth:`, error);
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}));

module.exports = router;