// Main entry point for Replit - Replit looks for this file by default
const express = require('express');
const path = require('path');

// Create express app
const app = express();

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API route for health check
app.get('/api/health', (req, res) => {
  console.log(`[${new Date().toISOString()}] Health check requested`);
  res.json({
    status: 'ok',
    message: 'BeeTagged API is running',
    timestamp: new Date().toISOString()
  });
});

// Root route - serves a basic home page
app.get('/', (req, res) => {
  console.log(`[${new Date().toISOString()}] Home page requested`);
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>BeeTagged</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #f6b929; }
          button { background: #f6b929; color: #000; border: none; padding: 10px 15px; cursor: pointer; }
        </style>
      </head>
      <body>
        <h1>BeeTagged</h1>
        <p>Welcome to the BeeTagged application!</p>
        
        <div>
          <h2>Test the API</h2>
          <button onclick="testApi()">Check API Health</button>
          <pre id="result"></pre>
        </div>
        
        <script>
          function testApi() {
            fetch('/api/health')
              .then(res => res.json())
              .then(data => {
                document.getElementById('result').textContent = JSON.stringify(data, null, 2);
              })
              .catch(err => {
                document.getElementById('result').textContent = 'Error: ' + err.message;
              });
          }
        </script>
      </body>
    </html>
  `);
});

// Facebook test route
app.get('/facebook', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Facebook Login Test</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
          h1 { color: #f6b929; }
          button { background: #4267B2; color: white; border: none; padding: 10px 15px; cursor: pointer; }
        </style>
      </head>
      <body>
        <h1>Facebook Login Test</h1>
        <p>Test the Facebook login flow:</p>
        
        <button id="loginBtn">Login with Facebook</button>
        <div id="status"></div>
        
        <script>
          document.getElementById('loginBtn').addEventListener('click', function() {
            const appId = '262648000122599';
            const redirectUri = window.location.origin + '/auth';
            const loginUrl = 'https://www.facebook.com/v10.0/dialog/oauth' +
                           '?client_id=' + appId +
                           '&redirect_uri=' + encodeURIComponent(redirectUri) +
                           '&response_type=token' +
                           '&scope=email';
            
            window.open(loginUrl, '_blank', 'width=600,height=600');
            document.getElementById('status').textContent = 'Login window opened...';
          });
        </script>
      </body>
    </html>
  `);
});

// Auth callback route
app.get('/auth', (req, res) => {
  console.log(`[${new Date().toISOString()}] Auth callback received:`, req.query);
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Auth Callback</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
          h1 { color: #f6b929; }
          pre { background: #f5f5f5; padding: 10px; }
        </style>
      </head>
      <body>
        <h1>Auth Callback Received</h1>
        <div id="params"></div>
        
        <script>
          const urlParams = new URLSearchParams(window.location.search);
          const hashParams = new URLSearchParams(window.location.hash ? window.location.hash.substring(1) : '');
          
          let output = '<h2>URL Parameters:</h2><pre>';
          for (const [key, value] of urlParams.entries()) {
            output += key + ': ' + value + '\\n';
          }
          output += '</pre><h2>Hash Parameters:</h2><pre>';
          for (const [key, value] of hashParams.entries()) {
            output += key + ': ' + value + '\\n';
          }
          output += '</pre>';
          
          document.getElementById('params').innerHTML = output;
        </script>
      </body>
    </html>
  `);
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ┌───────────────────────────────────────────────┐
  │                                               │
  │   BeeTagged server running on port ${PORT}        │
  │   http://localhost:${PORT}                      │
  │                                               │
  └───────────────────────────────────────────────┘
  `);
});