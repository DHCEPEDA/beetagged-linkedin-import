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
const compression = require('compression');
const multer = require('multer');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const logger = require('./utils/logger');

// Create Express app
const app = express();

// Detect Replit domain and environment
const replitDomain = process.env.REPLIT_DOMAIN || process.env.REPL_SLUG || null;
const isRunningOnReplit = !!replitDomain;

// Enable compression for all requests (required by Facebook crawler)
app.use(compression());

// Basic configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Set trust proxy for Replit environment
if (isRunningOnReplit) {
  app.set('trust proxy', true);
}

// Special middleware to handle Facebook crawlers
app.use((req, res, next) => {
  const userAgent = req.get('user-agent') || '';
  const isFacebookCrawler = 
    userAgent.includes('facebookexternalhit') || 
    userAgent.includes('facebookcatalog') || 
    userAgent.includes('meta-externalagent') || 
    userAgent.includes('meta-externalfetcher');
  
  if (isFacebookCrawler) {
    logger.info('Facebook crawler detected', { 
      userAgent,
      path: req.path,
      rangeHeader: req.get('Range')
    });
    
    // If Range header is present, ensure we handle it properly
    // Facebook crawler may use Range: bytes=0-524288
    if (req.get('Range')) {
      // For static files, Express.static will handle range requests
      // We're just logging it here for visibility
      logger.info('Facebook crawler range request', {
        range: req.get('Range'),
        path: req.path
      });
    }
  }
  
  next();
});

// Apply request logging middleware
app.use(logger.request);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Download route for Android project
app.get('/download/android-project.tar.gz', (req, res) => {
  const filePath = path.join(__dirname, 'android-project.tar.gz');
  res.download(filePath, 'BeeTagged-Android-Project.tar.gz', (err) => {
    if (err) {
      logger.error('Download error:', err);
      res.status(500).send('Download failed');
    }
  });
});

// Import and register social authentication routes
const socialAuthRoutes = require('./server/routes/social-auth-routes');
app.use('/api/auth', socialAuthRoutes);
// For backward compatibility
app.use('/', socialAuthRoutes);

// Import and register CSV import routes
const importRoutes = require('./server/routes/import-routes');
app.use('/api/import', importRoutes);

// Initialize session middleware for authentication
const session = require('express-session');
app.use(session({
  secret: process.env.JWT_SECRET || 'beetagged_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: isRunningOnReplit, maxAge: 7 * 24 * 60 * 60 * 1000 } // 7 days
}));

// Status endpoint for health checks
app.get('/api/status', (req, res) => {
  logger.info('Status check requested', { 
    ip: req.ip,
    path: req.path,
    host: req.get('host')
  });
  
  // Return basic server status information
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    domain: req.get('host'),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    facebook: process.env.FACEBOOK_APP_ID ? 'configured' : 'not configured',
    linkedin: process.env.LINKEDIN_CLIENT_ID ? 'configured' : 'not configured'
  });
});

// Simple ping endpoint for testing connectivity
app.get('/api/ping', (req, res) => {
  logger.info('Ping requested', { 
    ip: req.ip,
    path: req.path,
    host: req.get('host')
  });
  
  res.json({
    message: 'pong',
    timestamp: new Date().toISOString(),
    serverTime: new Date().toLocaleTimeString(),
    serverDate: new Date().toLocaleDateString()
  });
});

// Download endpoints for Android project files
app.get('/download', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'download.html'));
});

app.get('/download-android', (req, res) => {
  const filePath = path.join(__dirname, 'BeeTagged-Optimized-Android.tar.gz');
  
  if (fs.existsSync(filePath)) {
    res.download(filePath, 'BeeTagged-Optimized-Android.tar.gz', (err) => {
      if (err) {
        logger.error('Download error', { error: err.message });
        res.status(500).send('Download failed');
      } else {
        logger.info('Android project downloaded', { ip: req.ip });
      }
    });
  } else {
    res.status(404).send('File not found');
  }
});

app.get('/download-instructions', (req, res) => {
  const filePath = path.join(__dirname, 'Android-Studio-Build-Instructions.md');
  
  if (fs.existsSync(filePath)) {
    res.download(filePath, 'Android-Studio-Build-Instructions.md', (err) => {
      if (err) {
        logger.error('Download error', { error: err.message });
        res.status(500).send('Download failed');
      } else {
        logger.info('Build instructions downloaded', { ip: req.ip });
      }
    });
  } else {
    res.status(404).send('File not found');
  }
});

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
      <div style="margin-top: 10px;">
        <a href="/auth-diagnostic.html" style="padding: 8px 12px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Advanced Auth Diagnostics</a>
      </div>
      <pre id="authResult">Choose a login method to test...</pre>
    </div>
    
    <div class="card">
      <h2>Individual Auth Tests</h2>
      <p>Isolated authentication flows for debugging</p>
      <div style="display: flex; gap: 10px; margin-top: 10px;">
        <a href="/facebook-test.html" style="padding: 8px 12px; background: #4267B2; color: white; text-decoration: none; border-radius: 4px;">Facebook Test</a>
        <a href="/linkedin-test.html" style="padding: 8px 12px; background: #0077B5; color: white; text-decoration: none; border-radius: 4px;">LinkedIn Test</a>
      </div>
    </div>
    
    <div class="card">
      <h2>Contact Management</h2>
      <p>Extract metadata from social contacts for tagging and search</p>
      <div style="display: flex; gap: 10px; margin-top: 10px;">
        <a href="/contact-manager.html" style="padding: 8px 12px; background: #f5a623; color: white; text-decoration: none; border-radius: 4px;">Contact Manager</a>
      </div>
    </div>
    
    <div class="card">
      <h2>Contact Import</h2>
      <p>Test contact import from social platforms</p>
      <button onclick="testContactImport()">Test Import</button>
    </div>

    <div class="card">
      <h2>Android Project Download</h2>
      <p>Download the Android Studio project files for local APK building</p>
      <div style="display: flex; gap: 10px; margin-top: 10px;">
        <a href="/download/android-project.tar.gz" style="padding: 8px 12px; background: #32CD32; color: white; text-decoration: none; border-radius: 4px;" download>Download Android Project</a>
      </div>
    </div>
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
  maxLogs: 20,
  deletionRequests: {} // Store deletion requests by confirmation code
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

// Configure data deletion routes - these need to be defined before other routes
// Import external routes
try {
  // Load data deletion routes
  const dataDeletionRoutes = require('./server/routes/data-deletion');
  app.use('/api', dataDeletionRoutes);
  logger.info('Data deletion routes loaded successfully');
  
  // Load contact management routes
  const contactRoutes = require('./server/routes/contact-routes');
  app.use('/api/contacts', contactRoutes);
  logger.info('Contact management routes loaded successfully');
  
  // Load LinkedIn authentication routes
  const linkedinAuthRoutes = require('./server/routes/linkedin-auth');
  app.use('/api/auth/linkedin', linkedinAuthRoutes);
  logger.info('LinkedIn authentication routes loaded successfully');
  
  // Load import routes for LinkedIn CSV import functionality
  const importRoutes = require('./server/routes/import-routes');
  app.use('/api/import', importRoutes);
  logger.info('Import routes loaded successfully');
  
  // Load Squarespace integration routes
  const squarespaceImportRoutes = require('./server/routes/squarespace-import-routes');
  app.use('/api/squarespace', squarespaceImportRoutes);
  logger.info('Squarespace integration routes loaded successfully');
} catch (error) {
  logger.error('Failed to load routes', { error: error.message });
}

// Facebook Verification Endpoint - Specifically for App Review
app.get('/facebook-verify', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>BeeTagged Facebook Verification</title>
      <meta property="og:title" content="BeeTagged">
      <meta property="og:description" content="Smart contact management with social network integration">
      <meta property="fb:app_id" content="${process.env.FACEBOOK_APP_ID || '1222790436230433'}">
    </head>
    <body>
      <h1>BeeTagged Facebook Verification Page</h1>
      <p>This page confirms that the BeeTagged application is properly configured for Facebook integration.</p>
      <p>App ID: ${process.env.FACEBOOK_APP_ID || '1222790436230433'}</p>
    </body>
    </html>
  `);
  
  logger.info('Facebook verification page accessed', { ip: req.ip, userAgent: req.get('user-agent') });
});

// Squarespace LinkedIn Import Page
app.get('/squarespace-linkedin-import', (req, res) => {
  logger.info('Squarespace LinkedIn Import page accessed', {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    referer: req.get('referer')
  });
  
  res.sendFile(path.join(__dirname, 'public', 'squarespace-linkedin-import.html'));
});

// Android Test App Page
app.get('/android-test', (req, res) => {
  logger.info('Android Test page accessed', {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    referer: req.get('referer')
  });
  
  res.sendFile(path.join(__dirname, 'public', 'android-test.html'));
});

// Mobile Integration Documentation
app.get('/mobile-integration', (req, res) => {
  logger.info('Mobile integration page accessed', {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    referer: req.get('referer')
  });
  
  res.sendFile(path.join(__dirname, 'public', 'mobile-integration.html'));
});

// Configure file upload for LinkedIn import
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: function(req, file, cb) {
    const uniqueId = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, `linkedin-${uniqueId}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv' || 
      file.originalname.toLowerCase().endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// Function to generate random access code
function generateRandomCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Omitting similar looking characters
  let code = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
  }
  
  return code;
}

// In-memory storage for access codes
const accessCodes = {};

// LinkedIn CSV upload route
app.post('/api/squarespace/linkedin-upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded or file is not a CSV'
      });
    }
    
    logger.info('LinkedIn CSV file uploaded', {
      filename: file.filename,
      size: file.size,
      ip: req.ip
    });
    
    // Generate a 6-character access code
    const accessCode = generateRandomCode(6);
    
    // Store the access code with the file path
    accessCodes[accessCode] = {
      filePath: file.path,
      uploadTime: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hour expiration
      used: false
    };
    
    // Return success with the access code
    res.json({
      success: true,
      message: 'File uploaded successfully',
      accessCode: accessCode
    });
    
  } catch (error) {
    logger.error('Error uploading LinkedIn CSV file', {
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Error processing file: ' + error.message
    });
  }
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

// Facebook Configuration Endpoint for Test Pages
app.get('/api/auth/facebook/config', (req, res) => {
  logger.info('Facebook config requested', { 
    ip: req.ip,
    host: req.get('host')
  });
  
  const appId = process.env.FACEBOOK_APP_ID || 'APP_ID_REQUIRED';
  
  res.json({
    appId,
    apiVersion: 'v19.0'
  });
});

// Facebook Authentication URL
app.get('/api/auth/facebook/url', (req, res) => {
  logger.info('Facebook auth URL requested', { 
    ip: req.ip,
    host: req.get('host')
  });
  
  const clientId = process.env.FACEBOOK_APP_ID || 'APP_ID_REQUIRED';
  
  // Generate HTTPS base URL for Replit or HTTP for local development
  let baseUrl;
  let host = req.get('host');
  const isReplitDomain = replitDomain && host.includes(replitDomain);
  
  if (isReplitDomain) {
    // For Replit, always use the domain without port
    // This is critical for Facebook OAuth to work
    host = host.split(':')[0];
    baseUrl = `https://${host}`;
    
    // Log the actual host and baseUrl for debugging
    logger.info('Using Replit domain for Facebook auth', {
      originalHost: req.get('host'),
      parsedHost: host,
      baseUrl: baseUrl
    });
  } else {
    // For local development
    baseUrl = `${req.protocol}://${host}`;
    logger.info('Using local domain for Facebook auth', {
      host: host,
      baseUrl: baseUrl
    });
  }
  
  const redirectUri = `${baseUrl}/api/auth/facebook/callback`;
  const state = Math.random().toString(36).substring(2, 15);
  
  // Store state for CSRF protection (would use a real session store in production)
  
  // Using newer Facebook Graph API version and simplified parameters
  // Note: We've deliberately removed any port numbers for Facebook compatibility
  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&response_type=code&scope=email,public_profile`;
  
  logger.info('Generated Facebook auth URL', {
    redirectUri,
    baseUrl,
    state: state.substring(0, 5) + '...' // Log only part of the state for security
  });
  
  res.json({ url: authUrl });
});

// Facebook Authentication Callback
app.get('/api/auth/facebook/callback', async (req, res) => {
  const { code, state, error, error_reason, error_description } = req.query;
  
  logger.info('Facebook auth callback received', { 
    state,
    host: req.get('host'),
    origin: req.headers.origin || 'no-origin',
    hasError: !!error
  });
  
  // Check if Facebook returned an error
  if (error) {
    logger.error('Error returned from Facebook', {
      error,
      reason: error_reason,
      description: error_description
    });
    return res.redirect(`/?login=error&provider=facebook&error=${encodeURIComponent(error)}&reason=${encodeURIComponent(error_reason || '')}&description=${encodeURIComponent(error_description || 'No description provided')}`);
  }
  
  if (!code) {
    logger.error('No code received from Facebook');
    return res.status(400).json({ error: 'Authentication failed - no code received' });
  }
  
  try {
    const clientId = process.env.FACEBOOK_APP_ID;
    const clientSecret = process.env.FACEBOOK_APP_SECRET;
    
    // Generate HTTPS base URL for Replit or HTTP for local development
    let baseUrl;
    let host = req.get('host');
    const isReplitDomain = replitDomain && host.includes(replitDomain);
    
    if (isReplitDomain) {
      // For Replit, ensure clean domain without port
      host = host.split(':')[0];
      baseUrl = `https://${host}`;
      
      logger.info('Using Replit domain for Facebook callback', {
        originalHost: req.get('host'),
        parsedHost: host,
        baseUrl: baseUrl
      });
    } else {
      // For local development
      baseUrl = `${req.protocol}://${host}`;
      logger.info('Using local domain for Facebook callback', {
        host: host,
        baseUrl: baseUrl
      });
    }
    
    const redirectUri = `${baseUrl}/api/auth/facebook/callback`;
    logger.info('Using Facebook redirect URI', { redirectUri });
    
    // Log full details for token exchange troubleshooting
    logger.info('Facebook token exchange parameters', {
      codeLength: code ? code.length : 0,
      redirectUri,
      clientIdSet: !!clientId,
      clientSecretSet: !!clientSecret
    });
    
    // Exchange code for token
    const tokenResponse = await axios.get(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`
    );
    
    const { access_token } = tokenResponse.data;
    
    logger.info('Facebook token exchange successful', {
      accessTokenLength: access_token ? access_token.length : 0
    });
    
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
    
    // Enhanced error information for troubleshooting
    const errorDetails = error.response?.data ? JSON.stringify(error.response.data) : 'No additional details';
    
    res.redirect(`/?login=error&provider=facebook&error=${encodeURIComponent(error.message)}&details=${encodeURIComponent(errorDetails)}`);
  }
});

// LinkedIn Configuration Endpoint for Test Pages
app.get('/api/auth/linkedin/config', (req, res) => {
  logger.info('LinkedIn config requested', { 
    ip: req.ip,
    host: req.get('host')
  });
  
  const clientId = process.env.LINKEDIN_CLIENT_ID || 'CLIENT_ID_REQUIRED';
  
  // Generate HTTPS base URL for Replit or HTTP for local development
  let baseUrl;
  let host = req.get('host');
  const isReplitDomain = replitDomain && host.includes(replitDomain);
  
  if (isReplitDomain) {
    host = host.split(':')[0];
    baseUrl = `https://${host}`;
  } else {
    baseUrl = `${req.protocol}://${host}`;
  }
  
  const redirectUri = `${baseUrl}/api/auth/linkedin/callback`;
  
  res.json({
    clientId,
    redirectUri,
    apiVersion: 'v2',
    scopes: 'r_emailaddress r_liteprofile'
  });
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
    
    // Get user profile using LinkedIn's v2 API with proper headers and projection
    const profileResponse = await axios.get('https://api.linkedin.com/v2/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'X-Restli-Protocol-Version': '2.0.0'  // LinkedIn API version header
      },
      params: {
        projection: '(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))'
      }
    });
    
    // Also get email address with a separate call (requires the r_emailaddress scope)
    let email = null;
    try {
      const emailResponse = await axios.get('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });
      
      // Extract email from the response if available
      if (emailResponse.data && 
          emailResponse.data.elements && 
          emailResponse.data.elements.length > 0 && 
          emailResponse.data.elements[0]['handle~']) {
        email = emailResponse.data.elements[0]['handle~'].emailAddress;
      }
    } catch (emailError) {
      logger.warn('Could not retrieve LinkedIn email', {
        error: emailError.message,
        userId: profileResponse.data.id
      });
    }
    
    // Return user data to the client
    res.json({
      success: true,
      user: {
        id: profileResponse.data.id,
        firstName: profileResponse.data.localizedFirstName,
        lastName: profileResponse.data.localizedLastName,
        email: email || 'Email not available',
        accessToken: access_token.substring(0, 10) + '...' // Only return a snippet for security
      }
    });
  } catch (error) {
    logger.error('LinkedIn token exchange error', {
      message: error.message,
      response: error.response?.data
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to exchange LinkedIn token',
      error: error.message,
      details: error.response?.data
    });
  }
});

// LinkedIn Authentication URL
app.get('/api/auth/linkedin/url', (req, res) => {
  logger.info('LinkedIn auth URL requested', { 
    ip: req.ip,
    host: req.get('host')
  });
  
  const clientId = process.env.LINKEDIN_CLIENT_ID || 'CLIENT_ID_REQUIRED';
  
  // Generate HTTPS base URL for Replit or HTTP for local development
  let baseUrl;
  let host = req.get('host');
  const isReplitDomain = replitDomain && host.includes(replitDomain);
  
  if (isReplitDomain) {
    // For Replit, always use the domain without port
    // This is critical for LinkedIn OAuth to work properly
    host = host.split(':')[0];
    baseUrl = `https://${host}`;
    
    // Log the actual host and baseUrl for debugging
    logger.info('Using Replit domain for LinkedIn auth', {
      originalHost: req.get('host'),
      parsedHost: host,
      baseUrl: baseUrl
    });
  } else {
    // For local development
    baseUrl = `${req.protocol}://${host}`;
    logger.info('Using local domain for LinkedIn auth', {
      host: host,
      baseUrl: baseUrl
    });
  }
  
  const redirectUri = `${baseUrl}/api/auth/linkedin/callback`;
  const state = Math.random().toString(36).substring(2, 15);
  
  // Store state for CSRF protection (would use a real session store in production)
  
  // LinkedIn OAuth 2.0 authentication with proper scopes
  // r_emailaddress is required for retrieving user email
  // r_liteprofile is required for basic profile information
  const scopes = ['r_emailaddress', 'r_liteprofile'].join(' ');
  
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scopes)}`;
  
  logger.info('Generated LinkedIn auth URL', {
    redirectUri,
    baseUrl,
    state: state.substring(0, 5) + '...' // Log only part of the state for security
  });
  
  res.json({ url: authUrl });
});

// LinkedIn Authentication Callback
app.get('/api/auth/linkedin/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query;
  
  logger.info('LinkedIn auth callback received', { 
    state,
    host: req.get('host'),
    origin: req.headers.origin || 'no-origin',
    hasError: !!error
  });
  
  // Check if LinkedIn returned an error
  if (error) {
    logger.error('Error returned from LinkedIn', {
      error,
      description: error_description
    });
    return res.redirect(`/?login=error&provider=linkedin&error=${encodeURIComponent(error)}&description=${encodeURIComponent(error_description || 'No description provided')}`);
  }
  
  if (!code) {
    logger.error('No code received from LinkedIn');
    return res.status(400).json({ error: 'Authentication failed - no code received' });
  }
  
  try {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    
    // Generate HTTPS base URL for Replit or HTTP for local development
    let baseUrl;
    let host = req.get('host');
    const isReplitDomain = replitDomain && host.includes(replitDomain);
    
    if (isReplitDomain) {
      // For Replit, ensure clean domain without port
      host = host.split(':')[0];
      baseUrl = `https://${host}`;
      
      logger.info('Using Replit domain for LinkedIn callback', {
        originalHost: req.get('host'),
        parsedHost: host,
        baseUrl: baseUrl
      });
    } else {
      // For local development
      baseUrl = `${req.protocol}://${host}`;
      logger.info('Using local domain for LinkedIn callback', {
        host: host,
        baseUrl: baseUrl
      });
    }
    
    const redirectUri = `${baseUrl}/api/auth/linkedin/callback`;
    logger.info('Using LinkedIn redirect URI', { redirectUri });
    
    // Log full details for token exchange troubleshooting
    logger.info('LinkedIn token exchange parameters', {
      grantType: 'authorization_code',
      codeLength: code ? code.length : 0,
      redirectUri,
      clientIdSet: !!clientId,
      clientSecretSet: !!clientSecret
    });
    
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
    
    logger.info('LinkedIn token exchange successful', {
      accessTokenLength: access_token ? access_token.length : 0
    });
    
    // Get user profile using LinkedIn's v2 API with proper headers and projection
    const profileResponse = await axios.get('https://api.linkedin.com/v2/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'X-Restli-Protocol-Version': '2.0.0'  // LinkedIn API version header
      },
      params: {
        projection: '(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))'
      }
    });
    
    // Also get email address with a separate call (requires the r_emailaddress scope)
    let email = null;
    try {
      const emailResponse = await axios.get('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });
      
      // Extract email from the response if available
      if (emailResponse.data && 
          emailResponse.data.elements && 
          emailResponse.data.elements.length > 0 && 
          emailResponse.data.elements[0]['handle~']) {
        email = emailResponse.data.elements[0]['handle~'].emailAddress;
      }
    } catch (emailError) {
      logger.warn('Could not retrieve LinkedIn email', {
        error: emailError.message,
        userId: profileResponse.data.id
      });
    }
    
    logger.info('LinkedIn authentication successful', {
      userId: profileResponse.data.id,
      firstName: profileResponse.data.localizedFirstName,
      lastName: profileResponse.data.localizedLastName,
      hasEmail: !!email
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
    
    // Enhanced error information for troubleshooting
    const errorDetails = error.response?.data ? JSON.stringify(error.response.data) : 'No additional details';
    
    res.redirect(`/?login=error&provider=linkedin&error=${encodeURIComponent(error.message)}&details=${encodeURIComponent(errorDetails)}`);
  }
});

// Process phone contacts and enhance with Facebook data
app.post('/api/contacts/enhance-with-facebook', async (req, res) => {
  const { contacts, facebookToken } = req.body;
  
  logger.info('Facebook contact enhancement requested', {
    contactCount: contacts?.length || 0,
    hasToken: !!facebookToken
  });
  
  if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid contacts array is required'
    });
  }
  
  if (!facebookToken) {
    return res.status(400).json({
      success: false,
      message: 'Facebook access token is required'
    });
  }
  
  try {
    // Fetch user's Facebook friends to find matches with phone contacts
    const friendsResponse = await axios.get(
      `https://graph.facebook.com/v19.0/me/friends?fields=id,name,email&access_token=${facebookToken}`
    );
    
    const facebookFriends = friendsResponse.data.data || [];
    logger.info(`Retrieved ${facebookFriends.length} Facebook friends`);
    
    // Match phone contacts with Facebook friends based on name and email
    const enhancedContacts = await Promise.all(contacts.map(async (contact) => {
      // Look for a match by email (more reliable)
      const emailMatch = contact.email ? 
        facebookFriends.find(friend => 
          friend.email && friend.email.toLowerCase() === contact.email.toLowerCase()
        ) : null;
      
      // If no email match, try name match (less reliable)
      const nameMatch = !emailMatch && contact.name ? 
        facebookFriends.find(friend => 
          friend.name && friend.name.toLowerCase() === contact.name.toLowerCase()
        ) : null;
      
      const facebookMatch = emailMatch || nameMatch;
      
      // If we found a Facebook match, get detailed profile info
      if (facebookMatch) {
        try {
          // Get detailed profile for the matched friend
          const profileResponse = await axios.get(
            `https://graph.facebook.com/${facebookMatch.id}?fields=id,name,email,hometown,location,work,education&access_token=${facebookToken}`
          );
          
          const fbData = profileResponse.data;
          
          // Generate tags from Facebook data
          const tags = [];
          
          // Location tags
          if (fbData.location && fbData.location.name) {
            tags.push({
              name: fbData.location.name,
              category: 'location',
              source: 'facebook'
            });
          }
          
          if (fbData.hometown && fbData.hometown.name) {
            tags.push({
              name: fbData.hometown.name,
              category: 'hometown',
              source: 'facebook'
            });
          }
          
          // Work tags
          if (fbData.work && Array.isArray(fbData.work)) {
            fbData.work.forEach(work => {
              if (work.employer && work.employer.name) {
                tags.push({
                  name: work.employer.name,
                  category: 'workplace',
                  source: 'facebook'
                });
              }
              
              if (work.position && work.position.name) {
                tags.push({
                  name: work.position.name,
                  category: 'profession',
                  source: 'facebook'
                });
              }
            });
          }
          
          // Education tags
          if (fbData.education && Array.isArray(fbData.education)) {
            fbData.education.forEach(edu => {
              if (edu.school && edu.school.name) {
                tags.push({
                  name: edu.school.name,
                  category: 'education',
                  source: 'facebook'
                });
              }
              
              if (edu.concentration && Array.isArray(edu.concentration)) {
                edu.concentration.forEach(conc => {
                  if (conc.name) {
                    tags.push({
                      name: conc.name,
                      category: 'field_of_study',
                      source: 'facebook'
                    });
                  }
                });
              }
            });
          }
          
          return {
            ...contact,
            facebookId: fbData.id,
            facebookData: fbData,
            tags: tags,
            matched: true,
            matchSource: emailMatch ? 'email' : 'name'
          };
        } catch (profileError) {
          logger.error('Error fetching detailed profile', {
            friendId: facebookMatch.id,
            error: profileError.message
          });
          
          return {
            ...contact,
            facebookId: facebookMatch.id,
            matched: true,
            matchSource: emailMatch ? 'email' : 'name',
            error: 'Failed to fetch detailed profile'
          };
        }
      }
      
      // Return original contact if no match found
      return {
        ...contact,
        matched: false
      };
    }));
    
    const matchCount = enhancedContacts.filter(c => c.matched).length;
    logger.info(`Enhanced ${matchCount} contacts with Facebook data`);
    
    res.json({
      success: true,
      message: `Enhanced ${matchCount} out of ${contacts.length} contacts with Facebook data`,
      contacts: enhancedContacts
    });
  } catch (error) {
    logger.error('Facebook contact enhancement error', {
      message: error.message,
      response: error.response?.data
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to enhance contacts with Facebook data',
      error: error.message,
      details: error.response?.data || 'No additional details'
    });
  }
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
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`
    );
    
    const { access_token } = tokenResponse.data;
    
    // Get user profile with extended information
    const profileResponse = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email,hometown,location,work,education,friends&access_token=${access_token}`
    );
    
    // Construct user data object with extended information
    const userData = {
      id: profileResponse.data.id,
      name: profileResponse.data.name,
      email: profileResponse.data.email,
      provider: 'facebook',
      accessToken: access_token,
      hometown: profileResponse.data.hometown,
      location: profileResponse.data.location,
      work: profileResponse.data.work,
      education: profileResponse.data.education
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

// Facebook Data Deletion Callback
// Required for Facebook Login App Review and GDPR/privacy compliance
const dataDeletionRouter = require('./server/routes/data-deletion');
app.use('/api', dataDeletionRouter);

// Add documentation route for data deletion status
app.get('/api/deletion-status', (req, res) => {
  const { code, id } = req.query;
  
  logger.info('Data deletion status requested', {
    confirmationCode: code,
    userId: id
  });
  
  // In a real implementation, this would check the actual status in the database
  res.json({
    status: 'processing',
    confirmationCode: code || 'UNKNOWN',
    userId: id || 'UNKNOWN',
    estimatedCompletionTime: '30 days',
    message: 'Your data deletion request is being processed in accordance with our Privacy Policy.'
  });
});

// Error handler middleware (always at the end)
app.use(logger.errorHandler);

// For Replit, we need to ensure we're listening on port 5000
// as this is the primary port for web traffic
const PRIMARY_PORT = 5000;
const SECONDARY_PORT = 3000; // Secondary port for backward compatibility

// Bind to all interfaces for better Replit compatibility
// First bind to the primary port 5000, which is the Replit standard
app.listen(PRIMARY_PORT, "0.0.0.0", () => {
  logger.info(`BeeTagged Primary Server started`, { port: PRIMARY_PORT, host: "0.0.0.0" });
  
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║     BeeTagged Server - Ready for Connections                   ║
║     Running on port ${PRIMARY_PORT} - PRIMARY PORT             ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`);

  // Also listen on port 3000 for backward compatibility
  app.listen(SECONDARY_PORT, "0.0.0.0", () => {
    logger.info(`BeeTagged Secondary Server started`, { port: SECONDARY_PORT, host: "0.0.0.0" });
    
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║     BeeTagged Secondary Server - Ready for Connections         ║
║     Running on port ${SECONDARY_PORT} for compatibility        ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
    `);
  });
});