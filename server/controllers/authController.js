const axios = require('axios');
const crypto = require('crypto');
const { logger } = require('../../utils/logger');

// Session storage for authentication
const authSessions = {};

// Facebook configuration
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

// LinkedIn configuration
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;

// Clean domain helpers
function getDomainWithoutPort(host) {
  if (!host) return null;
  // Remove port if present
  return host.includes(':') ? host.substring(0, host.lastIndexOf(':')) : host;
}

function getBaseUrl(req) {
  const host = req.get('host');
  const domain = getDomainWithoutPort(host);
  return `https://${domain}`;
}

// ======== FACEBOOK AUTHENTICATION CONTROLLER ========

exports.getFacebookAuthUrl = (req, res) => {
  try {
    const host = req.get('host');
    logger.info('Facebook auth URL requested', { ip: req.ip, host });
    
    // Generate base URL without port
    const baseUrl = getBaseUrl(req);
    logger.info('Using base URL for Facebook auth', { host, baseUrl });
    
    // Generate a state parameter to prevent CSRF attacks
    const state = crypto.randomBytes(8).toString('hex').substring(0, 8);
    
    // Store the state in the session
    authSessions[state] = { 
      created: Date.now(),
      redirectUri: `${baseUrl}/api/auth/facebook/callback`
    };
    
    // Build the redirect URI without port
    const redirectUri = `${baseUrl}/api/auth/facebook/callback`;
    
    // Create the Facebook authorization URL
    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&response_type=code&scope=email,public_profile`;
    
    logger.info('Generated Facebook auth URL', { 
      redirectUri, 
      baseUrl,
      state: state.substring(0, 5) + '...'
    });
    
    // Return the URL to the client
    res.json({ url: authUrl });
  } catch (error) {
    logger.error('Error generating Facebook auth URL', { errorMessage: error.message });
    res.status(500).json({ error: 'Failed to generate authentication URL' });
  }
};

exports.handleFacebookCallback = async (req, res) => {
  try {
    const { code, state, error } = req.query;
    
    logger.info('Facebook callback received', { 
      hasCode: !!code, 
      hasState: !!state,
      hasError: !!error 
    });
    
    // Handle errors from Facebook
    if (error) {
      logger.error('Facebook auth error', { error });
      return res.redirect('/?auth=facebook-error&error=' + encodeURIComponent(error));
    }
    
    // Verify state parameter to prevent CSRF attacks
    if (!state || !authSessions[state]) {
      logger.error('Invalid Facebook auth state', { receivedState: state });
      return res.redirect('/?auth=facebook-error&error=invalid_state');
    }
    
    // Get stored redirect URI
    const storedSession = authSessions[state];
    const redirectUri = storedSession.redirectUri;
    
    // Exchange authorization code for access token
    try {
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
      
      // Get user profile data
      const profileUrl = `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${access_token}`;
      const profileResponse = await axios.get(profileUrl);
      const profile = profileResponse.data;
      
      logger.info('Facebook profile received', { 
        id: profile.id,
        name: profile.name,
        hasEmail: !!profile.email,
        hasPicture: !!profile.picture
      });
      
      // Clean up the used state
      delete authSessions[state];
      
      // Successful authentication - redirect to success page
      return res.redirect(`/facebook-success.html?token=${access_token}&name=${encodeURIComponent(profile.name)}&userId=${profile.id}`);
    } catch (tokenError) {
      logger.error('Facebook token exchange error', { errorMessage: tokenError.message });
      if (tokenError.response) {
        logger.error('Facebook API response', { 
          status: tokenError.response.status,
          data: tokenError.response.data 
        });
      }
      return res.redirect('/?auth=facebook-error&error=token_exchange_failed');
    }
  } catch (error) {
    logger.error('Facebook callback processing error', { errorMessage: error.message });
    res.redirect('/?auth=facebook-error&error=' + encodeURIComponent(error.message));
  }
};

exports.getFacebookConfig = (req, res) => {
  try {
    logger.info('Facebook config requested', { ip: req.ip, host: req.get('host') });
    
    const baseUrl = getBaseUrl(req);
    const redirectUrl = `${baseUrl}/api/auth/facebook/callback`;
    
    res.json({
      appId: FACEBOOK_APP_ID,
      redirectUrl
    });
  } catch (error) {
    logger.error('Error getting Facebook config', { errorMessage: error.message });
    res.status(500).json({ error: 'Failed to get Facebook configuration' });
  }
};

// ======== LINKEDIN AUTHENTICATION CONTROLLER ========

exports.getLinkedInAuthUrl = (req, res) => {
  try {
    const host = req.get('host');
    logger.info('LinkedIn auth URL requested', { ip: req.ip, host });
    
    // Generate a state parameter
    const state = crypto.randomBytes(8).toString('hex').substring(0, 8);
    
    // Get base URL without port
    const baseUrl = getBaseUrl(req);
    
    // Store the redirect URI with the state
    const redirectUri = `${baseUrl}/api/auth/linkedin/callback`;
    authSessions[state] = { 
      created: Date.now(),
      redirectUri
    };
    
    // Build the LinkedIn authorization URL
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=r_liteprofile%20r_emailaddress`;
    
    logger.info('Generated LinkedIn auth URL', { 
      redirectUri,
      state: state.substring(0, 5) + '...'
    });
    
    res.json({ url: authUrl });
  } catch (error) {
    logger.error('Error generating LinkedIn auth URL', { errorMessage: error.message });
    res.status(500).json({ error: 'Failed to generate authentication URL' });
  }
};

exports.handleLinkedInCallback = async (req, res) => {
  try {
    const { code, state, error } = req.query;
    
    logger.info('LinkedIn callback received', { 
      hasCode: !!code, 
      hasState: !!state, 
      hasError: !!error 
    });
    
    // Handle errors from LinkedIn
    if (error) {
      logger.error('LinkedIn auth error', { error });
      return res.redirect('/?auth=linkedin-error&error=' + encodeURIComponent(error));
    }
    
    // Verify state parameter
    if (!state || !authSessions[state]) {
      logger.error('Invalid LinkedIn auth state', { receivedState: state });
      return res.redirect('/?auth=linkedin-error&error=invalid_state');
    }
    
    // Get stored redirect URI
    const storedSession = authSessions[state];
    const redirectUri = storedSession.redirectUri;
    
    try {
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
      
      // Get user profile data
      const profileResponse = await axios.get('https://api.linkedin.com/v2/me', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'cache-control': 'no-cache',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });
      
      const profile = profileResponse.data;
      
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
      
      logger.info('LinkedIn data received', {
        id: profile.id,
        hasEmail: !!email
      });
      
      // Clean up used state
      delete authSessions[state];
      
      // Try to construct the user's name from profile data
      let name = '';
      if (profile.firstName?.localized?.en_US && profile.lastName?.localized?.en_US) {
        name = profile.firstName.localized.en_US + ' ' + profile.lastName.localized.en_US;
      } else if (profile.localizedFirstName && profile.localizedLastName) {
        name = profile.localizedFirstName + ' ' + profile.localizedLastName;
      }
      
      // Redirect to success page
      return res.redirect(`/linkedin-success.html?token=${access_token}&name=${encodeURIComponent(name)}&userId=${profile.id}`);
    } catch (apiError) {
      logger.error('LinkedIn API error', { errorMessage: apiError.message });
      if (apiError.response) {
        logger.error('LinkedIn API response', { 
          status: apiError.response.status,
          data: apiError.response.data 
        });
      }
      return res.redirect('/?auth=linkedin-error&error=' + encodeURIComponent(apiError.message));
    }
  } catch (error) {
    logger.error('LinkedIn callback processing error', { errorMessage: error.message });
    res.redirect('/?auth=linkedin-error&error=' + encodeURIComponent(error.message));
  }
};