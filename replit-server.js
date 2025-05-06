const express = require('express');
const path = require('path');
const cors = require('cors');

// Create Express app
const app = express();

// Configure middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from public

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'BeeTagged API is running on Replit',
    env: {
      replitDomains: process.env.REPLIT_DOMAINS || 'not set',
      port: process.env.PORT || '5000',
      nodeEnv: process.env.NODE_ENV || 'not set'
    }
  });
});

// Root endpoint - serve a simple HTML page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>BeeTagged - Express Server</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #f6b929; }
        .box { background: #f5f5f5; border-radius: 8px; padding: 15px; margin-top: 20px; }
        button { background: #f6b929; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
      </style>
    </head>
    <body>
      <h1>BeeTagged - Express Server</h1>
      <p>This is a test page to verify the server is working through Replit.</p>
      
      <div class="box">
        <h2>Server Info</h2>
        <p>Page loaded at: <span id="time"></span></p>
        <p>URL: <span id="url"></span></p>
      </div>
      
      <div class="box">
        <h2>API Test</h2>
        <button onclick="testApi()">Test API Health</button>
        <pre id="apiResult"></pre>
      </div>
      
      <script>
        // Display basic page info
        document.getElementById('time').textContent = new Date().toISOString();
        document.getElementById('url').textContent = window.location.href;
        
        // Test API endpoint
        function testApi() {
          fetch('/api/health')
            .then(response => response.json())
            .then(data => {
              document.getElementById('apiResult').textContent = JSON.stringify(data, null, 2);
            })
            .catch(error => {
              document.getElementById('apiResult').textContent = 'Error: ' + error.message;
            });
        }
        
        // Log that the page loaded (for console logs)
        console.log('BeeTagged express server page loaded at ' + new Date().toISOString());
      </script>
    </body>
    </html>
  `);
});

// Test endpoint
app.get('/test', (req, res) => {
  res.send('<h1>Test endpoint</h1><p>Server is working!</p>');
});

// Auth route
app.get('/auth', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>BeeTagged - Auth Page</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #f6b929; }
        .box { background: #f5f5f5; border-radius: 8px; padding: 15px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <h1>BeeTagged - Auth Page</h1>
      <p>Authentication status will be displayed here.</p>
      
      <div class="box">
        <h2>Auth Parameters</h2>
        <pre id="params"></pre>
      </div>
      
      <script>
        // Display URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash ? window.location.hash.substring(1) : '');
        
        const paramsDiv = document.getElementById('params');
        paramsDiv.innerHTML = 'URL Parameters:\\n';
        
        urlParams.forEach((value, key) => {
          paramsDiv.innerHTML += `${key}: ${value}\\n`;
        });
        
        paramsDiv.innerHTML += '\\nHash Parameters:\\n';
        hashParams.forEach((value, key) => {
          paramsDiv.innerHTML += `${key}: ${value}\\n`;
        });
        
        // Log that the page loaded (for console logs)
        console.log('BeeTagged auth page loaded at ' + new Date().toISOString());
      </script>
    </body>
    </html>
  `;
  
  res.send(html);
});

// Facebook direct login
app.get('/facebook', (req, res) => {
  const appId = '262648000122599';
  const redirectUri = `${req.protocol}://${req.get('host')}/auth`;
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>BeeTagged - Facebook Login</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        h1 { color: #f6b929; }
        .button { 
          background: #4267B2; 
          color: white; 
          border: none; 
          padding: 10px 15px; 
          border-radius: 4px; 
          cursor: pointer;
          font-size: 16px;
        }
      </style>
    </head>
    <body>
      <h1>BeeTagged - Facebook Login</h1>
      <p>Click the button below to login with Facebook:</p>
      
      <button class="button" id="fbLogin">Login with Facebook</button>
      <div id="status"></div>
      
      <script>
        document.getElementById('fbLogin').addEventListener('click', function() {
          const fbLoginUrl = 'https://www.facebook.com/v10.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=email&response_type=token';
          
          // Open in a popup window
          window.open(fbLoginUrl, '_blank', 'width=600,height=600');
          document.getElementById('status').textContent = 'Login window opened...';
        });
      </script>
    </body>
    </html>
  `);
});

// LinkedIn direct login
app.get('/linkedin', (req, res) => {
  const clientId = '77d6kq6d5t9olt';
  const redirectUri = `${req.protocol}://${req.get('host')}/auth`;
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>BeeTagged - LinkedIn Login</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        h1 { color: #f6b929; }
        .button { 
          background: #0077B5; 
          color: white; 
          border: none; 
          padding: 10px 15px; 
          border-radius: 4px; 
          cursor: pointer;
          font-size: 16px;
        }
      </style>
    </head>
    <body>
      <h1>BeeTagged - LinkedIn Login</h1>
      <p>Click the button below to login with LinkedIn:</p>
      
      <button class="button" id="liLogin">Login with LinkedIn</button>
      <div id="status"></div>
      
      <script>
        document.getElementById('liLogin').addEventListener('click', function() {
          const state = 'li' + Math.random().toString(36).substring(2);
          const scope = 'r_liteprofile';
          const liLoginUrl = 'https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scope}';
          
          // Store state for verification
          localStorage.setItem('li_auth_state', state);
          
          // Open in a popup window
          window.open(liLoginUrl, '_blank', 'width=600,height=600');
          document.getElementById('status').textContent = 'Login window opened...';
        });
      </script>
    </body>
    </html>
  `);
});

// Catch-all route - send the main index.html
app.get('*', (req, res) => {
  res.redirect('/');
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('============================');
  console.log(`Express server running on port ${PORT}`);
  console.log(`Local URL: http://localhost:${PORT}`);
  console.log(`Replit URL: https://${process.env.REPLIT_DOMAINS || 'unknown'}`);
  console.log('============================');
});