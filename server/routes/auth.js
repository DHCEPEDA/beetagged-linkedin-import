const express = require('express');
const router = express.Router();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Configuration
const FB_APP_ID = process.env.FACEBOOK_APP_ID || '1222790436230433';
const FB_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || '867adep5adc22g'; // Client ID provided by user
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET || 'WPL_AP1.j4ipPY9wll4iqDt7.w0yMCA=='; // Client secret provided by user

// Use the Replit domain or localhost for redirect URI
const HOSTNAME = process.env.REPL_SLUG && process.env.REPL_OWNER 
  ? `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` 
  : 'localhost:5000';

// For Facebook
const FB_REDIRECT_URI = process.env.FB_REDIRECT_URI || `https://${HOSTNAME}/api/auth/facebook/callback`;
// For LinkedIn
const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || `https://${HOSTNAME}/api/auth/linkedin/callback`;

// For backward compatibility
const REDIRECT_URI = process.env.REDIRECT_URI || `https://${HOSTNAME}/api/auth/callback`;

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

// Get LinkedIn auth URL
router.get('/linkedin/url', (req, res) => {
  // Create a session token
  const state = uuidv4();
  sessions[state] = { created: new Date() };
  
  // Build LinkedIn OAuth URL using LinkedIn-specific redirect URI
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(LINKEDIN_REDIRECT_URI)}&state=${state}&scope=r_liteprofile%20r_emailaddress`;
  
  // Log information for debugging
  console.log(`LinkedIn auth URL generated with redirect: ${LINKEDIN_REDIRECT_URI}`);
  
  res.json({ url: authUrl, state });
});

// LinkedIn OAuth callback
router.get('/linkedin/callback', async (req, res) => {
  const { code, state } = req.query;
  
  // Validate state to prevent CSRF
  if (!state || !sessions[state]) {
    return res.status(400).json({ message: 'Invalid state parameter' });
  }
  
  try {
    // Exchange authorization code for access token
    const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
      params: {
        grant_type: 'authorization_code',
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET,
        redirect_uri: LINKEDIN_REDIRECT_URI,
        code
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const { access_token, expires_in } = tokenResponse.data;
    
    // Get user profile data from LinkedIn
    const profileResponse = await axios.get('https://api.linkedin.com/v2/me', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });
    
    // Get user email from LinkedIn
    const emailResponse = await axios.get('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });
    
    // Format the profile data
    const profileData = {
      id: profileResponse.data.id,
      name: `${profileResponse.data.localizedFirstName} ${profileResponse.data.localizedLastName}`,
      email: emailResponse.data.elements?.[0]?.['handle~']?.emailAddress || '',
      picture: {
        data: {
          url: 'https://via.placeholder.com/200'  // LinkedIn doesn't provide picture in basic scope
        }
      },
      provider: 'linkedin'
    };
    
    // Create authenticated session
    const authToken = uuidv4();
    sessions[authToken] = {
      user: profileData,
      linkedin: {
        access_token,
        expires_in
      },
      created: new Date()
    };
    
    // Remove the state session
    delete sessions[state];
    
    // Return user data and token
    res.json({
      user: profileData,
      token: authToken
    });
  } catch (error) {
    console.error('LinkedIn auth error:', error.response?.data || error.message);
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

// Username/password login endpoint
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // In a real app, this would validate against a database
  // For demo purposes, we're using a simple check
  if (username === 'testuser' && password === 'password123') {
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
  } else {
    res.status(401).json({ message: 'Invalid username or password' });
  }
});

// Registration endpoint
router.post('/register', (req, res) => {
  const { username, password, email } = req.body;
  
  // In a real app, this would create a new user in the database
  // For demo purposes, we'll always succeed and create a session
  const authToken = uuidv4();
  sessions[authToken] = {
    user: {
      id: `user-${authToken.substring(0, 8)}`,
      name: username,
      email: email || `${username}@example.com`,
      picture: {
        data: {
          url: 'https://via.placeholder.com/200'
        }
      }
    },
    created: new Date()
  };
  
  res.status(201).json({
    user: sessions[authToken].user,
    token: authToken
  });
});

// Handle direct client-side authentication for LinkedIn
router.post('/linkedin', async (req, res) => {
  try {
    const { accessToken, userData } = req.body;
    
    if (!accessToken || !userData) {
      return res.status(400).json({ message: 'Missing required data' });
    }
    
    // In a production environment, we would validate the token with LinkedIn
    
    // Create authenticated session
    const authToken = uuidv4();
    sessions[authToken] = {
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email || '',
        picture: {
          data: {
            url: userData.picture || 'https://via.placeholder.com/200'
          }
        },
        provider: 'linkedin'
      },
      linkedin: {
        access_token: accessToken
      },
      created: new Date()
    };
    
    res.json({
      user: sessions[authToken].user,
      token: authToken
    });
  } catch (error) {
    console.error('LinkedIn client auth error:', error);
    res.status(500).json({
      message: 'Authentication failed',
      error: error.message
    });
  }
});

// Forgot password endpoint
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  
  try {
    // In a real application, we would:
    // 1. Check if the email exists in the database
    // 2. Generate a reset token and store it with expiration
    // 3. Send an email with a reset link
    
    // For demo purposes, we'll simulate success and log the request
    console.log(`Password reset requested for: ${email}`);
    
    // Check if we have SendGrid configured for sending emails
    const sendGridApiKey = process.env.SENDGRID_API_KEY;
    
    if (sendGridApiKey) {
      // If SendGrid is configured, we would send an actual email
      // This is simulated for now, but the code is ready to use with SendGrid
      try {
        // Simulate sending email
        console.log(`Would send password reset email to ${email} using SendGrid`);
        
        // In a real app with proper SendGrid setup:
        // const sgMail = require('@sendgrid/mail');
        // sgMail.setApiKey(sendGridApiKey);
        // const msg = {
        //   to: email,
        //   from: 'support@beetagged.com',
        //   subject: 'Reset Your BeeTagged Password',
        //   text: `Click the link to reset your password: https://${HOSTNAME}/reset-password?token=${resetToken}`,
        //   html: `<p>Click the link to reset your password: <a href="https://${HOSTNAME}/reset-password?token=${resetToken}">Reset Password</a></p>`,
        // };
        // await sgMail.send(msg);
      } catch (emailError) {
        console.error('Error sending password reset email:', emailError);
        // Continue with success response even if email fails
      }
    }
    
    // Return success response regardless of email status
    // This prevents email enumeration attacks
    res.json({ 
      success: true, 
      message: 'If this email is registered, you will receive password reset instructions.'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'An error occurred while processing your request' });
  }
});

// Reset password endpoint
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  
  if (!token || !password) {
    return res.status(400).json({ message: 'Token and password are required' });
  }
  
  try {
    // In a real application, we would:
    // 1. Validate the token and check if it's expired
    // 2. Find the user associated with the token
    // 3. Update the user's password
    // 4. Invalidate the token
    
    // For demo purposes, we'll simulate success
    console.log(`Password reset with token: ${token}`);
    
    res.json({ 
      success: true, 
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'An error occurred while resetting your password' });
  }
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
        } : null,
        linkedin: session.linkedin ? {
          ...session.linkedin,
          access_token: session.linkedin.access_token ? `${session.linkedin.access_token.substring(0, 10)}...` : null
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