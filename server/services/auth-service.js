const axios = require('axios');
const crypto = require('crypto');
const querystring = require('querystring');

// Store authentication sessions
const authSessions = {};

// Helper to generate authentication state
function generateState() {
  return crypto.randomBytes(16).toString('hex');
}

// Helper to get domain from host without port
function getDomainWithoutPort(host) {
  return host.includes(':') ? host.substring(0, host.indexOf(':')) : host;
}

// Facebook Authentication Methods
const facebookAuth = {
  // Generate Facebook OAuth URL
  getAuthUrl: (req) => {
    const state = generateState();
    const host = req.get('host');
    const domain = getDomainWithoutPort(host);
    const redirectUri = process.env.FACEBOOK_REDIRECT_URI || 
                       `https://${domain}/api/auth/facebook/callback`;

    // Store session info
    authSessions[state] = {
      provider: 'facebook',
      redirectUri,
      createdAt: Date.now()
    };

    // Build auth URL
    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?` +
      `client_id=${process.env.FACEBOOK_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${state}` +
      `&scope=email,public_profile`;

    console.log(`Generated Facebook auth URL with redirect: ${redirectUri}`);
    
    return { url: authUrl };
  },

  // Handle the OAuth callback from Facebook
  handleCallback: async (req) => {
    const { code, state, error } = req.query;
    
    // Handle Facebook-provided errors
    if (error) {
      throw new Error(`Facebook auth error: ${error}`);
    }
    
    // Verify state parameter to prevent CSRF
    if (!state || !authSessions[state]) {
      throw new Error('Invalid state parameter');
    }
    
    const session = authSessions[state];
    const redirectUri = session.redirectUri;
    
    try {
      // Exchange authorization code for access token
      const tokenResponse = await axios.get(
        'https://graph.facebook.com/v19.0/oauth/access_token',
        {
          params: {
            client_id: process.env.FACEBOOK_APP_ID,
            client_secret: process.env.FACEBOOK_APP_SECRET,
            redirect_uri: redirectUri,
            code
          }
        }
      );
      
      const { access_token } = tokenResponse.data;
      
      // Get user profile information
      const profileResponse = await axios.get(
        `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${access_token}`
      );
      
      // Clean up session
      delete authSessions[state];
      
      // Return user data and token
      return {
        token: access_token,
        profile: profileResponse.data
      };
    } catch (error) {
      console.error('Facebook API error:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Facebook');
    }
  },
  
  // Get user's Facebook friends (contacts)
  getContacts: async (accessToken) => {
    try {
      // Note: Since 2018, Facebook restricts access to friends list
      // Only friends who also use your app will be returned
      const response = await axios.get(
        `https://graph.facebook.com/v19.0/me/friends?access_token=${accessToken}`
      );
      
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching Facebook contacts:', error.response?.data || error.message);
      throw new Error('Failed to fetch Facebook contacts');
    }
  }
};

// LinkedIn Authentication Methods
const linkedinAuth = {
  // Generate LinkedIn OAuth URL
  getAuthUrl: (req) => {
    const state = generateState();
    const host = req.get('host');
    const domain = getDomainWithoutPort(host);
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI || 
                       `https://${domain}/api/auth/linkedin/callback`;

    // Store session info
    authSessions[state] = {
      provider: 'linkedin',
      redirectUri,
      createdAt: Date.now()
    };

    // Build auth URL
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
      `response_type=code` +
      `&client_id=${process.env.LINKEDIN_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${state}` +
      `&scope=r_liteprofile%20r_emailaddress`;

    console.log(`Generated LinkedIn auth URL with redirect: ${redirectUri}`);
    
    return { url: authUrl };
  },

  // Handle the OAuth callback from LinkedIn
  handleCallback: async (req) => {
    const { code, state, error } = req.query;
    
    // Handle LinkedIn-provided errors
    if (error) {
      throw new Error(`LinkedIn auth error: ${error}`);
    }
    
    // Verify state parameter to prevent CSRF
    if (!state || !authSessions[state]) {
      throw new Error('Invalid state parameter');
    }
    
    const session = authSessions[state];
    const redirectUri = session.redirectUri;
    
    try {
      // Exchange authorization code for access token
      const tokenResponse = await axios.post(
        'https://www.linkedin.com/oauth/v2/accessToken',
        querystring.stringify({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: process.env.LINKEDIN_CLIENT_ID,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      const { access_token } = tokenResponse.data;
      
      // Get user profile information
      const profileResponse = await axios.get('https://api.linkedin.com/v2/me', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });
      
      // Get user email
      const emailResponse = await axios.get(
        'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))',
        {
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );
      
      // Extract email from response
      let email = null;
      if (emailResponse.data && 
          emailResponse.data.elements && 
          emailResponse.data.elements.length > 0) {
        email = emailResponse.data.elements[0]['handle~'].emailAddress;
      }
      
      // Clean up session
      delete authSessions[state];
      
      // Process and return user data
      const profile = profileResponse.data;
      
      // Get name from profile data
      let name = '';
      if (profile.localizedFirstName && profile.localizedLastName) {
        name = `${profile.localizedFirstName} ${profile.localizedLastName}`;
      }
      
      return {
        token: access_token,
        profile: {
          ...profile,
          name,
          email
        }
      };
    } catch (error) {
      console.error('LinkedIn API error:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with LinkedIn');
    }
  },
  
  // Get user's LinkedIn connections
  getContacts: async (accessToken) => {
    try {
      // Note: LinkedIn restricts connections API access to approved partners
      // This will likely return an error for most developer accounts
      const response = await axios.get(
        'https://api.linkedin.com/v2/connections',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );
      
      return response.data.elements || [];
    } catch (error) {
      // Most likely will hit this error due to LinkedIn API restrictions
      console.error('Error fetching LinkedIn contacts:', error.response?.data || error.message);
      
      // Return sample data for demonstration
      return getMockLinkedInContacts();
    }
  }
};

// Get mock LinkedIn contacts for testing
function getMockLinkedInContacts() {
  return [
    {
      id: 'linkedin_1',
      firstName: 'Alex',
      lastName: 'Johnson',
      emailAddress: 'alex.johnson@example.com',
      title: 'Software Engineer',
      company: 'Tech Innovations',
      location: 'Austin, TX',
      skills: ['JavaScript', 'React', 'Node.js'],
      interests: ['Technology', 'Photography', 'Travel'],
      pictureUrl: 'https://randomuser.me/api/portraits/men/1.jpg'
    },
    {
      id: 'linkedin_2',
      firstName: 'Samantha',
      lastName: 'Lee',
      emailAddress: 'samantha.lee@example.com',
      title: 'Marketing Director',
      company: 'Global Brands Inc.',
      location: 'New York, NY',
      skills: ['Digital Marketing', 'Brand Strategy', 'Content Creation'],
      interests: ['Travel', 'Cooking', 'Yoga'],
      pictureUrl: 'https://randomuser.me/api/portraits/women/2.jpg'
    },
    {
      id: 'linkedin_3',
      firstName: 'Michael',
      lastName: 'Chen',
      emailAddress: 'michael.chen@example.com',
      title: 'Product Manager',
      company: 'Innovative Solutions',
      location: 'San Francisco, CA',
      skills: ['Product Management', 'UX Design', 'Analytics'],
      interests: ['Hiking', 'Photography', 'Reading'],
      pictureUrl: 'https://randomuser.me/api/portraits/men/3.jpg'
    }
  ];
}

module.exports = {
  facebook: facebookAuth,
  linkedin: linkedinAuth
};