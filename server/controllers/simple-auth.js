const axios = require('axios');
const crypto = require('crypto');

// In-memory session storage (would use a database in production)
const sessions = {};

// Helper for generating random state parameters
function generateState() {
  return crypto.randomBytes(16).toString('hex');
}

// Format error logs properly
function formatError(error) {
  return {
    message: error.message,
    code: error.code,
    responseData: error.response ? error.response.data : null,
    responseStatus: error.response ? error.response.status : null
  };
}

// Facebook authentication controller
exports.getFacebookAuthUrl = (req, res) => {
  try {
    const appId = process.env.FACEBOOK_APP_ID;
    if (!appId) {
      return res.status(500).json({ error: 'Facebook App ID not configured' });
    }
    
    // Generate and store state to prevent CSRF
    const state = generateState();
    const redirectUri = `https://${req.get('host').split(':')[0]}/api/auth/facebook/callback`;
    
    // Store state with session info
    sessions[state] = {
      provider: 'facebook',
      created: Date.now(),
      redirectUri
    };
    
    // Build the auth URL
    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&response_type=code&scope=email,public_profile`;
    
    res.json({ url: authUrl });
  } catch (error) {
    console.error('Error generating Facebook auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authentication URL' });
  }
};

exports.handleFacebookCallback = async (req, res) => {
  try {
    const { code, state, error: fbError } = req.query;
    
    // Handle errors from Facebook
    if (fbError) {
      return res.redirect(`/?auth=error&provider=facebook&message=${encodeURIComponent(fbError)}`);
    }
    
    // Validate state
    if (!state || !sessions[state]) {
      return res.redirect('/?auth=error&provider=facebook&message=Invalid state parameter');
    }
    
    const session = sessions[state];
    const redirectUri = session.redirectUri;
    
    try {
      // Exchange code for token
      const tokenResponse = await axios.post('https://graph.facebook.com/v19.0/oauth/access_token', null, {
        params: {
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          redirect_uri: redirectUri,
          code
        }
      });
      
      const { access_token } = tokenResponse.data;
      
      // Get user profile
      const profileResponse = await axios.get(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${access_token}`);
      const profile = profileResponse.data;
      
      // Clean up session
      delete sessions[state];
      
      // Redirect to success page
      return res.redirect(`/facebook-success.html?token=${access_token}&name=${encodeURIComponent(profile.name || '')}&id=${profile.id}`);
    } catch (apiError) {
      console.error('Facebook API error:', formatError(apiError));
      return res.redirect(`/?auth=error&provider=facebook&message=${encodeURIComponent('API request failed')}`);
    }
  } catch (error) {
    console.error('Facebook callback error:', error);
    res.redirect(`/?auth=error&provider=facebook&message=${encodeURIComponent('Server error')}`);
  }
};

// LinkedIn authentication controller
exports.getLinkedInAuthUrl = (req, res) => {
  try {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: 'LinkedIn Client ID not configured' });
    }
    
    // Generate and store state to prevent CSRF
    const state = generateState();
    const redirectUri = `https://${req.get('host').split(':')[0]}/api/auth/linkedin/callback`;
    
    // Store state with session info
    sessions[state] = {
      provider: 'linkedin',
      created: Date.now(),
      redirectUri
    };
    
    // Build the auth URL
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=r_liteprofile%20r_emailaddress`;
    
    res.json({ url: authUrl });
  } catch (error) {
    console.error('Error generating LinkedIn auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authentication URL' });
  }
};

exports.handleLinkedInCallback = async (req, res) => {
  try {
    const { code, state, error: liError } = req.query;
    
    // Handle errors from LinkedIn
    if (liError) {
      return res.redirect(`/?auth=error&provider=linkedin&message=${encodeURIComponent(liError)}`);
    }
    
    // Validate state
    if (!state || !sessions[state]) {
      return res.redirect('/?auth=error&provider=linkedin&message=Invalid state parameter');
    }
    
    const session = sessions[state];
    const redirectUri = session.redirectUri;
    
    try {
      // Exchange code for token
      const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
        params: {
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: process.env.LINKEDIN_CLIENT_ID,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      const { access_token } = tokenResponse.data;
      
      // Get user profile
      const profileResponse = await axios.get('https://api.linkedin.com/v2/me', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });
      
      const profile = profileResponse.data;
      let name = '';
      
      // Extract name from LinkedIn response
      if (profile.localizedFirstName && profile.localizedLastName) {
        name = `${profile.localizedFirstName} ${profile.localizedLastName}`;
      }
      
      // Clean up session
      delete sessions[state];
      
      // Redirect to success page
      return res.redirect(`/linkedin-success.html?token=${access_token}&name=${encodeURIComponent(name)}&id=${profile.id}`);
    } catch (apiError) {
      console.error('LinkedIn API error:', formatError(apiError));
      return res.redirect(`/?auth=error&provider=linkedin&message=${encodeURIComponent('API request failed')}`);
    }
  } catch (error) {
    console.error('LinkedIn callback error:', error);
    res.redirect(`/?auth=error&provider=linkedin&message=${encodeURIComponent('Server error')}`);
  }
};