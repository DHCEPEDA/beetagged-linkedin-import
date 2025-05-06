const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

// Create Express app
const app = express();

// Log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Enable CORS for all routes
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// For parsing application/json
app.use(express.json());

// For parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Middleware to handle preflight requests
app.options('*', cors());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public'), {
  dotfiles: 'allow',
  etag: false,
  extensions: ['htm', 'html'],
  index: ['index.html', 'index.htm'],
  maxAge: '1d',
  redirect: false,
}));

// Special route for client-auth.html
app.get('/auth', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'client-auth.html');
  fs.readFile(filePath, (err, content) => {
    if (err) {
      console.error('Error reading file:', err);
      return res.status(500).send('Error loading authentication page');
    }
    res.setHeader('Content-Type', 'text/html');
    res.send(content);
  });
});

// Basic route
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>BeeTagged Server</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #f6b929; }
          .card { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <h1>BeeTagged Server</h1>
        <p>This is a simple server for the BeeTagged application.</p>
        
        <div class="card">
          <h2>Server Information</h2>
          <p>Time: ${new Date().toISOString()}</p>
          <p>NodeJS Version: ${process.version}</p>
        </div>
        
        <div class="card">
          <h2>Environment</h2>
          <p>NODE_ENV: ${process.env.NODE_ENV || 'Not set'}</p>
          <p>REPLIT_DOMAINS: ${process.env.REPLIT_DOMAINS || 'Not available'}</p>
        </div>
      </body>
    </html>
  `);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'The simplified server is running correctly'
  });
});

// API endpoints for testing
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'The API is running correctly'
  });
});

// Facebook authentication test page
app.get('/facebook', (req, res) => {
  const appId = process.env.FACEBOOK_APP_ID || 'Not configured';
  const appSecret = !!process.env.FACEBOOK_APP_SECRET ? 'Configured' : 'Not configured';
  
  res.send(`
    <html>
      <head>
        <title>Facebook Auth Test</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #3b5998; }
          .card { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 15px; }
          button { background: #3b5998; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; }
        </style>
      </head>
      <body>
        <h1>Facebook Authentication Test</h1>
        <p>This page tests the Facebook authentication for BeeTagged.</p>
        
        <div class="card">
          <h2>Configuration</h2>
          <p>App ID: ${appId}</p>
          <p>App Secret: ${appSecret}</p>
          <p>Redirect URL: https://${process.env.REPLIT_DOMAINS}/facebook-callback</p>
        </div>
        
        <div class="card">
          <h2>Manual Test Login</h2>
          <p>Click the button below to test the Facebook login:</p>
          <button id="fb-login">Login with Facebook</button>
        </div>
        
        <script>
          document.getElementById('fb-login').addEventListener('click', function() {
            const appId = '${appId}';
            if (appId === 'Not configured') {
              alert('Facebook App ID is not configured!');
              return;
            }
            
            const redirectUri = 'https://${process.env.REPLIT_DOMAINS}/facebook-callback';
            const url = 'https://www.facebook.com/v18.0/dialog/oauth?client_id=' + 
                appId + '&redirect_uri=' + encodeURIComponent(redirectUri) + 
                '&state=randomstate&scope=email,public_profile';
            
            window.location.href = url;
          });
        </script>
      </body>
    </html>
  `);
});

// LinkedIn authentication test page
app.get('/linkedin', (req, res) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID || 'Not configured';
  const clientSecret = !!process.env.LINKEDIN_CLIENT_SECRET ? 'Configured' : 'Not configured';
  
  res.send(`
    <html>
      <head>
        <title>LinkedIn Auth Test</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #0077B5; }
          .card { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 15px; }
          button { background: #0077B5; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; }
        </style>
      </head>
      <body>
        <h1>LinkedIn Authentication Test</h1>
        <p>This page tests the LinkedIn authentication for BeeTagged.</p>
        
        <div class="card">
          <h2>Configuration</h2>
          <p>Client ID: ${clientId}</p>
          <p>Client Secret: ${clientSecret}</p>
          <p>Redirect URL: https://${process.env.REPLIT_DOMAINS}/linkedin-callback</p>
        </div>
        
        <div class="card">
          <h2>Manual Test Login</h2>
          <p>Click the button below to test the LinkedIn login:</p>
          <button id="li-login">Login with LinkedIn</button>
        </div>
        
        <script>
          document.getElementById('li-login').addEventListener('click', function() {
            const clientId = '${clientId}';
            if (clientId === 'Not configured') {
              alert('LinkedIn Client ID is not configured!');
              return;
            }
            
            const redirectUri = 'https://${process.env.REPLIT_DOMAINS}/linkedin-callback';
            const scope = 'r_liteprofile,r_emailaddress';
            const state = 'random_state_string';
            
            const url = 'https://www.linkedin.com/oauth/v2/authorization?response_type=code' +
                '&client_id=' + clientId +
                '&redirect_uri=' + encodeURIComponent(redirectUri) +
                '&state=' + state +
                '&scope=' + scope;
            
            window.location.href = url;
          });
        </script>
      </body>
    </html>
  `);
});

// Callback endpoints for OAuth
app.get('/facebook-callback', (req, res) => {
  const code = req.query.code || 'No code provided';
  const state = req.query.state || 'No state provided';
  
  res.send(`
    <html>
      <head>
        <title>Facebook Callback</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #3b5998; }
          .card { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 15px; }
          pre { background: #eee; padding: 10px; border-radius: 3px; overflow-x: auto; }
        </style>
      </head>
      <body>
        <h1>Facebook Auth Callback</h1>
        <p>This page shows the result of the Facebook authentication callback.</p>
        
        <div class="card">
          <h2>Auth Parameters</h2>
          <p><strong>Code:</strong> ${code}</p>
          <p><strong>State:</strong> ${state}</p>
          <p><strong>Error:</strong> ${req.query.error || 'None'}</p>
        </div>
        
        <div class="card">
          <h2>What happens next?</h2>
          <p>The server would normally exchange this code for an access token by making a request to Facebook.</p>
          <p>Then it would use the access token to fetch the user's profile information.</p>
          <p><a href="/">Back to Home</a></p>
        </div>
      </body>
    </html>
  `);
});

app.get('/linkedin-callback', (req, res) => {
  const code = req.query.code || 'No code provided';
  const state = req.query.state || 'No state provided';
  
  res.send(`
    <html>
      <head>
        <title>LinkedIn Callback</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #0077B5; }
          .card { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 15px; }
          pre { background: #eee; padding: 10px; border-radius: 3px; overflow-x: auto; }
        </style>
      </head>
      <body>
        <h1>LinkedIn Auth Callback</h1>
        <p>This page shows the result of the LinkedIn authentication callback.</p>
        
        <div class="card">
          <h2>Auth Parameters</h2>
          <p><strong>Code:</strong> ${code}</p>
          <p><strong>State:</strong> ${state}</p>
          <p><strong>Error:</strong> ${req.query.error || 'None'}</p>
        </div>
        
        <div class="card">
          <h2>What happens next?</h2>
          <p>The server would normally exchange this code for an access token by making a request to LinkedIn.</p>
          <p>Then it would use the access token to fetch the user's profile information.</p>
          <p><a href="/">Back to Home</a></p>
        </div>
      </body>
    </html>
  `);
});

// Catch-all route
app.use('*', (req, res) => {
  res.status(404).send(`
    <html>
      <head>
        <title>Page Not Found</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #f6b929; }
        </style>
      </head>
      <body>
        <h1>Page Not Found</h1>
        <p>The requested URL ${req.originalUrl} was not found on this server.</p>
        <p><a href="/">Back to Home</a></p>
      </body>
    </html>
  `);
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Local URL: http://localhost:${PORT}`);
  console.log(`Replit URL: https://${process.env.REPLIT_DOMAINS || 'not-available'}`);
});