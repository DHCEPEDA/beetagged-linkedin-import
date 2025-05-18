const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const router = express.Router();
const { logger } = require('../../utils/logger');

// Load environment variables with appropriate fallbacks for development
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;

// Session storage for auth state
const authStates = {};

// ======== FACEBOOK AUTHENTICATION ROUTES ========

// Generate and return Facebook auth URL
router.get('/facebook/url', (req, res) => {
  try {
    const host = req.get('host');
    logger.info('Facebook auth URL requested', { ip: req.ip, host });
    
    let baseUrl = `https://${host}`;
    // Remove port if present in the host
    if (baseUrl.includes(':')) {
      baseUrl = baseUrl.substring(0, baseUrl.lastIndexOf(':'));
    }
    
    logger.info('Using local domain for Facebook auth', { host, baseUrl });
    
    // Generate a unique state to prevent CSRF
    const state = crypto.randomBytes(8).toString('hex').substring(0, 8);
    authStates[state] = { 
      created: Date.now(),
      redirectUri: `${baseUrl}/api/auth/facebook/callback`
    };
    
    // Build the auth URL
    const redirectUri = `${baseUrl}/api/auth/facebook/callback`;
    const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&response_type=code&scope=email,public_profile`;
    
    logger.info('Generated Facebook auth URL', { 
      redirectUri, 
      baseUrl,
      state: state.substring(0, 5) + '...' 
    });
    
    res.json({ url });
  } catch (error) {
    logger.error('Error generating Facebook auth URL', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Facebook callback endpoint
router.get('/facebook/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    
    logger.info('Facebook callback received', { 
      hasCode: !!code, 
      hasState: !!state,
      hasError: !!error 
    });
    
    // Handle authentication errors
    if (error) {
      logger.error('Facebook auth error', { error: req.query.error_description || error });
      return res.redirect('/?auth=facebook-error&error=' + encodeURIComponent(req.query.error_description || error));
    }
    
    // Validate state to prevent CSRF attacks
    if (!state || !authStates[state]) {
      logger.error('Invalid Facebook auth state', { receivedState: state });
      return res.redirect('/?auth=facebook-error&error=invalid_state');
    }
    
    const storedState = authStates[state];
    const redirectUri = storedState.redirectUri;

    // Exchange code for access token
    const tokenUrl = 'https://graph.facebook.com/v19.0/oauth/access_token';
    const params = new URLSearchParams();
    params.append('client_id', FACEBOOK_APP_ID);
    params.append('client_secret', FACEBOOK_APP_SECRET);
    params.append('redirect_uri', redirectUri);
    params.append('code', code);
    
    logger.info('Exchanging Facebook code for token', { redirectUri });
    
    const tokenResponse = await axios.post(tokenUrl, params);
    const { access_token, expires_in } = tokenResponse.data;
    
    if (!access_token) {
      logger.error('Facebook token exchange failed', { response: tokenResponse.data });
      return res.redirect('/?auth=facebook-error&error=token_exchange_failed');
    }
    
    logger.info('Facebook token received', { 
      expiresIn: expires_in,
      tokenPreview: access_token.substring(0, 5) + '...' + access_token.substring(access_token.length - 5)
    });
    
    // Get user profile data from Facebook
    try {
      const profileUrl = `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${access_token}`;
      const profileResponse = await axios.get(profileUrl);
      const profile = profileResponse.data;
      
      logger.info('Facebook profile received', { 
        id: profile.id,
        name: profile.name,
        hasEmail: !!profile.email,
        hasPicture: !!profile.picture
      });
      
      // Clean up used state
      delete authStates[state];
      
      // Successful auth, redirect to success page with token and profile data
      return res.redirect(`/facebook-success.html?token=${access_token}&name=${encodeURIComponent(profile.name)}&userId=${profile.id}`);
    } catch (profileError) {
      logger.error('Error fetching Facebook profile', { error: profileError.message });
      return res.redirect('/?auth=facebook-error&error=profile_fetch_failed');
    }
  } catch (error) {
    logger.error('Facebook callback error', { error: error.message });
    res.redirect('/?auth=facebook-error&error=' + encodeURIComponent(error.message));
  }
});

// Get the Facebook app configuration
router.get('/facebook/config', (req, res) => {
  logger.info('Facebook config requested', { ip: req.ip, host: req.get('host') });
  
  const host = req.get('host');
  const baseUrl = `https://${host}`;
  
  // Create adjusted callback URL for client-side flows
  const redirectUrl = `${baseUrl}/api/auth/facebook/callback`;
  
  res.json({
    appId: FACEBOOK_APP_ID,
    redirectUrl
  });
});

// ======== LINKEDIN AUTHENTICATION ROUTES ========

// Generate and return LinkedIn auth URL
router.get('/linkedin/url', (req, res) => {
  try {
    const host = req.get('host');
    logger.info('LinkedIn auth URL requested', { ip: req.ip, host });
    
    // Generate a random state
    const state = crypto.randomBytes(8).toString('hex').substring(0, 8);
    
    // Define the redirect URI - for LinkedIn, we need to handle port issues
    let baseUrl = `https://${host}`;
    
    // Store the state and redirect URI
    const redirectUri = `${baseUrl}/api/auth/linkedin/callback`;
    authStates[state] = { 
      created: Date.now(),
      redirectUri
    };
    
    // Build the auth URL
    const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=r_liteprofile%20r_emailaddress`;
    
    logger.info('Generated LinkedIn auth URL', { 
      redirectUri,
      state: state.substring(0, 5) + '...' 
    });
    
    res.json({ url });
  } catch (error) {
    logger.error('Error generating LinkedIn auth URL', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// LinkedIn callback endpoint
router.get('/linkedin/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    
    logger.info('LinkedIn callback received', { 
      hasCode: !!code, 
      hasState: !!state,
      hasError: !!error 
    });
    
    // Handle authentication errors
    if (error) {
      logger.error('LinkedIn auth error', { error });
      return res.redirect('/?auth=linkedin-error&error=' + encodeURIComponent(error));
    }
    
    // Validate state parameter
    if (!state || !authStates[state]) {
      logger.error('Invalid LinkedIn auth state', { receivedState: state });
      return res.redirect('/?auth=linkedin-error&error=invalid_state');
    }
    
    const storedState = authStates[state];
    const redirectUri = storedState.redirectUri;
    
    // Exchange code for access token
    const tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', redirectUri);
    params.append('client_id', LINKEDIN_CLIENT_ID);
    params.append('client_secret', LINKEDIN_CLIENT_SECRET);
    
    logger.info('Exchanging LinkedIn code for token', { redirectUri });
    
    const tokenResponse = await axios.post(tokenUrl, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    const { access_token, expires_in } = tokenResponse.data;
    
    if (!access_token) {
      logger.error('LinkedIn token exchange failed', { response: tokenResponse.data });
      return res.redirect('/?auth=linkedin-error&error=token_exchange_failed');
    }
    
    logger.info('LinkedIn token received', { 
      expiresIn: expires_in,
      tokenPreview: access_token.substring(0, 5) + '...' + access_token.substring(access_token.length - 5)
    });
    
    // Get user profile
    try {
      const profileResponse = await axios.get('https://api.linkedin.com/v2/me', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'cache-control': 'no-cache',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });
      
      const profile = profileResponse.data;
      
      logger.info('LinkedIn profile received', {
        id: profile.id,
        firstName: profile.firstName?.localized?.en_US || null,
        lastName: profile.lastName?.localized?.en_US || null
      });
      
      // Get email address
      const emailResponse = await axios.get('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'cache-control': 'no-cache',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });
      
      const emailData = emailResponse.data;
      const email = emailData?.elements?.[0]?.['handle~']?.emailAddress || null;
      
      logger.info('LinkedIn email received', { hasEmail: !!email });
      
      // Clean up used state
      delete authStates[state];
      
      // Redirect to success page with token
      let name = '';
      if (profile.firstName?.localized?.en_US && profile.lastName?.localized?.en_US) {
        name = profile.firstName.localized.en_US + ' ' + profile.lastName.localized.en_US;
      } else if (profile.localizedFirstName && profile.localizedLastName) {
        name = profile.localizedFirstName + ' ' + profile.localizedLastName;
      }
      
      return res.redirect(`/linkedin-success.html?token=${access_token}&name=${encodeURIComponent(name)}&userId=${profile.id}&email=${encodeURIComponent(email || '')}`);
    } catch (profileError) {
      logger.error('Error fetching LinkedIn profile', { error: profileError.message });
      if (profileError.response) {
        logger.error('LinkedIn API error details', { 
          status: profileError.response.status,
          data: profileError.response.data 
        });
      }
      return res.redirect('/?auth=linkedin-error&error=profile_fetch_failed');
    }
  } catch (error) {
    logger.error('LinkedIn callback error', { error: error.message });
    if (error.response) {
      logger.error('LinkedIn API error details', { 
        status: error.response.status,
        data: error.response.data 
      });
    }
    res.redirect('/?auth=linkedin-error&error=' + encodeURIComponent(error.message));
  }
});

module.exports = router;