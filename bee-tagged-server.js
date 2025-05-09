/**
 * BeeTagged Robust Server
 * Combines our successful connectivity approach with enhanced features
 */
// Load environment variables if .env file exists
try {
  require('dotenv').config();
  console.log('Environment variables loaded from .env file');
} catch (err) {
  console.log('No .env file found, using environment variables');
}

const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const mongoose = require('mongoose');
const logger = require('./utils/logger');

// Create Express app
const app = express();

// Detect Replit domain and environment
const replitDomain = process.env.REPLIT_DOMAIN || process.env.REPL_SLUG || null;
const isRunningOnReplit = !!replitDomain;

// Basic configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Set trust proxy for Replit environment
if (isRunningOnReplit) {
  app.set('trust proxy', true);
}

// Apply request logging middleware
app.use(logger.request);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Basic HTML for home page
const homePage = `
<!DOCTYPE html>
<html>
<head>
  <title>BeeTagged Connectivity Test</title>
  <link rel="stylesheet" href="/css/styles.css">
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #f5a623; }
    .container { display: flex; flex-wrap: wrap; gap: 20px; }
    .card { 
      border: 1px solid #ddd; 
      border-radius: 8px; 
      padding: 20px; 
      width: 45%; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      background: #fff;
    }
    button { 
      padding: 10px 15px; 
      background: #f5a623; 
      color: white; 
      border: none; 
      cursor: pointer;
      border-radius: 4px;
    }
    pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto; }
    .social-login { display: flex; gap: 10px; margin-top: 15px; }
    .social-login button { display: flex; align-items: center; }
    .social-login button img { margin-right: 8px; height: 20px; }
  </style>
</head>
<body>
  <h1>BeeTagged Platform</h1>
  <p>Testing connectivity and authentication for the BeeTagged application.</p>
  
  <div class="container">
    <div class="card">
      <h2>API Connection</h2>
      <p>Test the server API connection</p>
      <p><button onclick="testApi()">Test API</button></p>
      <pre id="apiResult">Click the button to test the API...</pre>
    </div>
    
    <div class="card">
      <h2>Authentication</h2>
      <p>Test social login connectivity</p>
      <div class="social-login">
        <button onclick="testFacebookAuth()">
          <img src="https://cdn.jsdelivr.net/npm/simple-icons@v6/icons/facebook.svg" alt="Facebook" />
          Facebook Login
        </button>
        <button onclick="testLinkedInAuth()">
          <img src="https://cdn.jsdelivr.net/npm/simple-icons@v6/icons/linkedin.svg" alt="LinkedIn" />
          LinkedIn Login
        </button>
      </div>
      <pre id="authResult">Choose a login method to test...</pre>
    </div>
    
    <div class="card">
      <h2>Contact Import</h2>
      <p>Test contact import from social platforms</p>
      <button onclick="testContactImport()">Test Import</button>
      <pre id="importResult">Click to test contact import...</pre>
    </div>
    
    <div class="card">
      <h2>Server Logs</h2>
      <p>View recent server activity</p>
      <button onclick="fetchLogs()">Fetch Logs</button>
      <pre id="logsResult">Click to fetch logs...</pre>
    </div>
  </div>
  
  <script>
    // Test API connection
    function testApi() {
      document.getElementById('apiResult').textContent = 'Loading...';
      
      fetch('/api/ping')
        .then(response => response.json())
        .then(data => {
          document.getElementById('apiResult').textContent = JSON.stringify(data, null, 2);
        })
        .catch(error => {
          document.getElementById('apiResult').textContent = 'Error: ' + error.message;
        });
    }
    
    // Test Facebook authentication
    function testFacebookAuth() {
      document.getElementById('authResult').textContent = 'Redirecting to Facebook...';
      // Redirect to the Facebook OAuth URL
      fetch('/api/auth/facebook/url')
        .then(response => response.json())
        .then(data => {
          document.getElementById('authResult').textContent = 'Redirecting to Facebook login...';
          // Actually redirect to Facebook OAuth URL
          window.location.href = data.url;
        })
        .catch(error => {
          document.getElementById('authResult').textContent = 'Error: ' + error.message;
        });
    }
    
    // Test LinkedIn authentication
    function testLinkedInAuth() {
      document.getElementById('authResult').textContent = 'Redirecting to LinkedIn...';
      // Redirect to the LinkedIn OAuth URL
      fetch('/api/auth/linkedin/url')
        .then(response => response.json())
        .then(data => {
          document.getElementById('authResult').textContent = 'Redirecting to LinkedIn login...';
          // Actually redirect to LinkedIn OAuth URL
          window.location.href = data.url;
        })
        .catch(error => {
          document.getElementById('authResult').textContent = 'Error: ' + error.message;
        });
    }
    
    // Test contact import
    function testContactImport() {
      document.getElementById('importResult').textContent = 'Testing import...';
      
      fetch('/api/contacts/import/test')
        .then(response => response.json())
        .then(data => {
          document.getElementById('importResult').textContent = JSON.stringify(data, null, 2);
        })
        .catch(error => {
          document.getElementById('importResult').textContent = 'Error: ' + error.message;
        });
    }
    
    // Fetch server logs
    function fetchLogs() {
      document.getElementById('logsResult').textContent = 'Fetching logs...';
      
      fetch('/api/logs/recent')
        .then(response => response.json())
        .then(data => {
          document.getElementById('logsResult').textContent = JSON.stringify(data, null, 2);
        })
        .catch(error => {
          document.getElementById('logsResult').textContent = 'Error: ' + error.message;
        });
    }
    
    // Log page load
    console.log('BeeTagged test page loaded at ' + new Date().toISOString());
  </script>
</body>
</html>
`;

// MongoDB connection
let mongoConnected = false;
async function connectToMongoDB() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      logger.warn('MONGODB_URI not found in environment variables. Database features will be disabled.');
      return false;
    }
    
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    logger.info('MongoDB connected successfully');
    mongoConnected = true;
    return true;
  } catch (error) {
    logger.error('MongoDB connection error', { 
      error: error.message,
      stack: error.stack
    });
    return false;
  }
}

// Call the connection function
connectToMongoDB();

// In-memory storage for recent logs and application state
const appState = {
  recentLogs: [],
  maxLogs: 20
};

// Log capture middleware to keep recent logs in memory
app.use((req, res, next) => {
  const log = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.ip
  };
  
  appState.recentLogs.unshift(log);
  
  // Trim logs to max size
  if (appState.recentLogs.length > appState.maxLogs) {
    appState.recentLogs = appState.recentLogs.slice(0, appState.maxLogs);
  }
  
  next();
});

// API Routes ----------------------------------------------

// Basic ping endpoint
app.get('/api/ping', (req, res) => {
  logger.info('Ping received', { 
    source: req.ip,
    host: req.get('host'),
    origin: req.headers.origin || 'no-origin' 
  });
  
  res.json({
    success: true,
    message: 'BeeTagged API is working!',
    timestamp: new Date().toISOString(),
    env: {
      node_version: process.version,
      replit_domain: replitDomain || 'not set',
      is_replit: isRunningOnReplit,
      port: PORT || 3000,
      host: req.get('host')
    },
    auth: {
      facebook_configured: process.env.FACEBOOK_APP_ID ? true : false,
      linkedin_configured: process.env.LINKEDIN_CLIENT_ID ? true : false,
      facebook_token_exchange_available: true,
      linkedin_token_exchange_available: true
    },
    mongodb: {
      connected: mongoConnected,
      connectionState: mongoose.connection.readyState
    }
  });
});

// Special Replit webview compatible endpoint
app.get('/__replit', (req, res) => {
  logger.info('Replit special path accessed');
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>BeeTagged Replit Health Check</title>
        <meta http-equiv="refresh" content="0;URL='/'" />
      </head>
      <body>
        <p>Redirecting to the BeeTagged application...</p>
      </body>
    </html>
  `);
});

// Facebook Authentication URL
app.get('/api/auth/facebook/url', (req, res) => {
  logger.info('Facebook auth URL requested', { 
    ip: req.ip,
    host: req.get('host')
  });
  
  const clientId = process.env.FACEBOOK_APP_ID || 'APP_ID_REQUIRED';
  
  // Handle both Replit and local development by removing port from redirect URI if on Replit
  let host = req.get('host');
  const isReplitDomain = replitDomain && host.includes(replitDomain);
  
  // Remove port if it's a Replit domain to avoid OAuth issues
  if (isReplitDomain && host.includes(':')) {
    host = host.split(':')[0];
  }
  
  const redirectUri = `${req.protocol}://${host}/api/auth/facebook/callback`;
  const state = Math.random().toString(36).substring(2, 15);
  
  // Store state for CSRF protection (would use a real session store in production)
  
  const authUrl = `https://www.facebook.com/v13.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=email,public_profile,user_friends`;
  
  logger.info('Generated Facebook auth URL', {
    redirectUri,
    state: state.substring(0, 5) + '...' // Log only part of the state for security
  });
  
  res.json({ url: authUrl });
});

// Facebook Authentication Callback
app.get('/api/auth/facebook/callback', async (req, res) => {
  const { code, state } = req.query;
  
  logger.info('Facebook auth callback received', { 
    state,
    host: req.get('host'),
    origin: req.headers.origin || 'no-origin'
  });
  
  if (!code) {
    logger.error('No code received from Facebook');
    return res.status(400).json({ error: 'Authentication failed - no code received' });
  }
  
  try {
    const clientId = process.env.FACEBOOK_APP_ID;
    const clientSecret = process.env.FACEBOOK_APP_SECRET;
    
    // Handle both Replit and local development by removing port from redirect URI if on Replit
    let host = req.get('host');
    const isReplitDomain = replitDomain && host.includes(replitDomain);
    
    // Remove port if it's a Replit domain to avoid OAuth issues
    if (isReplitDomain && host.includes(':')) {
      host = host.split(':')[0];
    }
    
    const redirectUri = `${req.protocol}://${host}/api/auth/facebook/callback`;
    logger.info('Using Facebook redirect URI', { redirectUri });
    
    // Exchange code for token
    const tokenResponse = await axios.get(
      `https://graph.facebook.com/v13.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`
    );
    
    const { access_token } = tokenResponse.data;
    
    // Get user profile
    const profileResponse = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email&access_token=${access_token}`
    );
    
    logger.info('Facebook authentication successful', {
      userId: profileResponse.data.id,
      name: profileResponse.data.name
    });
    
    // In a real app, you would:
    // 1. Create or update the user in your database
    // 2. Generate a session token
    // 3. Redirect to the app with the token
    
    res.redirect(`/?login=success&provider=facebook&name=${encodeURIComponent(profileResponse.data.name)}`);
  } catch (error) {
    logger.error('Facebook authentication error', {
      message: error.message,
      response: error.response?.data
    });
    
    res.redirect(`/?login=error&provider=facebook&error=${encodeURIComponent(error.message)}`);
  }
});

// LinkedIn Authentication URL
app.get('/api/auth/linkedin/url', (req, res) => {
  logger.info('LinkedIn auth URL requested', { 
    ip: req.ip,
    host: req.get('host')
  });
  
  const clientId = process.env.LINKEDIN_CLIENT_ID || 'CLIENT_ID_REQUIRED';
  
  // Handle both Replit and local development by removing port from redirect URI if on Replit
  let host = req.get('host');
  const isReplitDomain = replitDomain && host.includes(replitDomain);
  
  // Remove port if it's a Replit domain to avoid OAuth issues
  if (isReplitDomain && host.includes(':')) {
    host = host.split(':')[0];
  }
  
  const redirectUri = `${req.protocol}://${host}/api/auth/linkedin/callback`;
  const state = Math.random().toString(36).substring(2, 15);
  
  // Store state for CSRF protection (would use a real session store in production)
  
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=r_liteprofile%20r_emailaddress`;
  
  logger.info('Generated LinkedIn auth URL', {
    redirectUri,
    state: state.substring(0, 5) + '...' // Log only part of the state for security
  });
  
  res.json({ url: authUrl });
});

// LinkedIn Authentication Callback
app.get('/api/auth/linkedin/callback', async (req, res) => {
  const { code, state } = req.query;
  
  logger.info('LinkedIn auth callback received', { 
    state,
    host: req.get('host'),
    origin: req.headers.origin || 'no-origin'
  });
  
  if (!code) {
    logger.error('No code received from LinkedIn');
    return res.status(400).json({ error: 'Authentication failed - no code received' });
  }
  
  try {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    
    // Handle both Replit and local development by removing port from redirect URI if on Replit
    let host = req.get('host');
    const isReplitDomain = replitDomain && host.includes(replitDomain);
    
    // Remove port if it's a Replit domain to avoid OAuth issues
    if (isReplitDomain && host.includes(':')) {
      host = host.split(':')[0];
    }
    
    const redirectUri = `${req.protocol}://${host}/api/auth/linkedin/callback`;
    logger.info('Using redirect URI', { redirectUri });
    
    // Exchange code for token
    const tokenResponse = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      null,
      {
        params: {
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    const { access_token } = tokenResponse.data;
    
    // Get user profile
    const profileResponse = await axios.get('https://api.linkedin.com/v2/me', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });
    
    logger.info('LinkedIn authentication successful', {
      userId: profileResponse.data.id,
      firstName: profileResponse.data.localizedFirstName,
      lastName: profileResponse.data.localizedLastName
    });
    
    // In a real app, you would:
    // 1. Create or update the user in your database
    // 2. Generate a session token
    // 3. Redirect to the app with the token
    
    const fullName = `${profileResponse.data.localizedFirstName} ${profileResponse.data.localizedLastName}`;
    res.redirect(`/?login=success&provider=linkedin&name=${encodeURIComponent(fullName)}`);
  } catch (error) {
    logger.error('LinkedIn authentication error', {
      message: error.message,
      response: error.response?.data
    });
    
    res.redirect(`/?login=error&provider=linkedin&error=${encodeURIComponent(error.message)}`);
  }
});

// Test contact import endpoint
app.get('/api/contacts/import/test', (req, res) => {
  logger.info('Contact import test requested');
  
  // This would connect to the actual API in a real implementation
  const mockContacts = [
    { id: 1, name: 'Alex Johnson', email: 'alex@example.com', source: 'facebook' },
    { id: 2, name: 'Sara Miller', email: 'sara@example.com', source: 'linkedin' }
  ];
  
  res.json({
    success: true,
    message: 'Contact import simulation successful',
    contacts: mockContacts
  });
});

// Recent logs endpoint
app.get('/api/logs/recent', (req, res) => {
  logger.info('Recent logs requested');
  res.json({
    logs: appState.recentLogs
  });
});

// Facebook token exchange endpoint for client-side flows
app.post('/api/auth/facebook/token', async (req, res) => {
  const { code, redirectUri } = req.body;
  
  logger.info('Facebook token exchange requested', { 
    codeLength: code ? code.length : 0,
    redirectUri 
  });
  
  if (!code) {
    logger.error('No code provided for Facebook token exchange');
    return res.status(400).json({ 
      success: false, 
      message: 'Authorization code is required' 
    });
  }
  
  try {
    const clientId = process.env.FACEBOOK_APP_ID;
    const clientSecret = process.env.FACEBOOK_APP_SECRET;
    
    // Exchange code for token
    const tokenResponse = await axios.get(
      `https://graph.facebook.com/v13.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`
    );
    
    const { access_token } = tokenResponse.data;
    
    // Get user profile
    const profileResponse = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email&access_token=${access_token}`
    );
    
    // Construct user data object
    const userData = {
      id: profileResponse.data.id,
      name: profileResponse.data.name,
      email: profileResponse.data.email,
      provider: 'facebook',
      accessToken: access_token
    };
    
    logger.info('Facebook token exchange successful', {
      userId: userData.id,
      name: userData.name
    });
    
    // In a real app, you would create/update the user in your DB
    // and generate a session token here
    
    res.json({
      success: true,
      user: userData
    });
  } catch (error) {
    logger.error('Facebook token exchange error', {
      message: error.message,
      response: error.response?.data
    });
    
    res.status(400).json({
      success: false,
      message: error.message,
      details: error.response?.data || 'No additional details'
    });
  }
});

// LinkedIn token exchange endpoint for client-side flows
app.post('/api/auth/linkedin/token', async (req, res) => {
  const { code, redirectUri } = req.body;
  
  logger.info('LinkedIn token exchange requested', { 
    codeLength: code ? code.length : 0,
    redirectUri 
  });
  
  if (!code) {
    logger.error('No code provided for LinkedIn token exchange');
    return res.status(400).json({ 
      success: false, 
      message: 'Authorization code is required' 
    });
  }
  
  try {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    
    // Exchange code for token
    const tokenResponse = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      null,
      {
        params: {
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    const { access_token } = tokenResponse.data;
    
    // Get user profile
    const profileResponse = await axios.get('https://api.linkedin.com/v2/me', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });
    
    // Get email address if available
    let email = null;
    try {
      const emailResponse = await axios.get('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      });
      
      if (emailResponse.data && 
          emailResponse.data.elements && 
          emailResponse.data.elements.length > 0) {
        email = emailResponse.data.elements[0]['handle~'].emailAddress;
      }
    } catch (emailErr) {
      logger.warn('Could not retrieve LinkedIn email', { error: emailErr.message });
    }
    
    // Construct user data object
    const userData = {
      id: profileResponse.data.id,
      firstName: profileResponse.data.localizedFirstName,
      lastName: profileResponse.data.localizedLastName,
      fullName: `${profileResponse.data.localizedFirstName} ${profileResponse.data.localizedLastName}`,
      email: email,
      provider: 'linkedin',
      accessToken: access_token
    };
    
    logger.info('LinkedIn token exchange successful', {
      userId: userData.id,
      name: userData.fullName
    });
    
    // In a real app, you would create/update the user in your DB
    // and generate a session token here
    
    res.json({
      success: true,
      user: userData
    });
  } catch (error) {
    logger.error('LinkedIn token exchange error', {
      message: error.message,
      response: error.response?.data
    });
    
    res.status(400).json({
      success: false,
      message: error.message,
      details: error.response?.data || 'No additional details'
    });
  }
});

// Auth status endpoint
app.get('/api/auth/status', (req, res) => {
  logger.info('Auth status requested');
  // In a real app, we would check the session or token
  // For now, just return a mock status
  res.json({
    authenticated: false,
    message: "No active session found",
    providers: {
      facebook: {
        connected: false,
        lastSync: null
      },
      linkedin: {
        connected: false,
        lastSync: null
      }
    }
  });
});

// Special health check endpoints for Replit
app.get('/__replit_health_check', (req, res) => {
  logger.info('Replit health check requested');
  res.status(200).send('OK');
});

app.get('/health', (req, res) => {
  logger.info('Health check requested');
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    mongodb: {
      connected: mongoConnected,
      connectionState: mongoose.connection.readyState
    }
  });
});

// Database status endpoint
app.get('/api/database/status', (req, res) => {
  logger.info('Database status requested');
  
  const dbStatus = {
    connected: mongoConnected,
    connectionState: mongoose.connection.readyState,
    connectionStateText: getConnectionStateText(mongoose.connection.readyState)
  };
  
  if (mongoConnected) {
    dbStatus.details = {
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      port: mongoose.connection.port
    };
  }
  
  res.json(dbStatus);
});

// Helper function to get connection state text
function getConnectionStateText(state) {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized'
  };
  return states[state] || 'unknown';
}

// Direct auth endpoint (for testing with access token)
app.post('/api/auth/:provider/direct', (req, res) => {
  const { provider } = req.params;
  const { access_token } = req.body;
  
  logger.info(`Direct ${provider} auth requested`, { tokenLength: access_token ? access_token.length : 0 });
  
  if (!access_token) {
    return res.status(400).json({ 
      success: false, 
      message: "Access token is required" 
    });
  }
  
  // In a real app, we would validate the token with the provider
  // For now, just return a mock response
  res.json({
    success: true,
    message: `Direct ${provider} authentication simulation successful`,
    token: {
      truncated: `${access_token.substring(0, 5)}...${access_token.slice(-5)}`
    }
  });
});

// Health check endpoints (for Replit webview)
app.get('/healthcheck', (req, res) => {
  logger.info('Health check requested');
  res.status(200).send('OK');
});

// Special Replit webview health check
app.get('/index.html', (req, res) => {
  logger.info('Index.html requested by Replit webview');
  res.send(homePage);
});

// Home page
app.get('/', (req, res) => {
  logger.info('Home page requested', { ip: req.ip });
  res.send(homePage);
});

// Error handler middleware (always at the end)
app.use(logger.errorHandler);

// Listen on port 3000 for Replit compatibility
const PORT = 3000;
const REPLIT_PORT = 5000; // Additional port for Replit's tools

// Bind to all interfaces for better Replit compatibility
app.listen(PORT, "0.0.0.0", () => {
  logger.info(`BeeTagged Server started`, { port: PORT, host: "0.0.0.0" });
  
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║     BeeTagged Server - Ready for Connections                   ║
║     Running on port ${PORT} - bound to all interfaces          ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`);

  // Also listen on port 5000 for compatibility with Replit tools
  app.listen(REPLIT_PORT, "0.0.0.0", () => {
    logger.info(`BeeTagged Secondary Server started`, { port: REPLIT_PORT, host: "0.0.0.0" });
    
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║     BeeTagged Secondary Server - Ready for Connections         ║
║     Running on port ${REPLIT_PORT} - bound to all interfaces   ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
    `);
  });
});