const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

// Basic routes
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Mini Server</title>
        <style>
          body { font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
          h1 { color: #4285F4; }
          .card { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <h1>Mini Test Server</h1>
        <p>This is a minimal test server to verify Replit connectivity.</p>
        
        <div class="card">
          <h2>Server Info</h2>
          <p>Time: ${new Date().toISOString()}</p>
          <p>Replit Domain: ${process.env.REPLIT_DOMAINS || 'Not available'}</p>
        </div>
        
        <div class="card">
          <h2>Available Routes</h2>
          <ul>
            <li><a href="/ping">/ping</a> - Simple ping endpoint</li>
            <li><a href="/facebook">/facebook</a> - Facebook app ID info</li>
            <li><a href="/linkedin">/linkedin</a> - LinkedIn client ID info</li>
          </ul>
        </div>
      </body>
    </html>
  `);
});

// Simple ping endpoint
app.get('/ping', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    time: new Date().toISOString()
  });
});

// Facebook info
app.get('/facebook', (req, res) => {
  res.json({
    appId: process.env.FACEBOOK_APP_ID || 'Not configured',
    appSecretConfigured: !!process.env.FACEBOOK_APP_SECRET
  });
});

// LinkedIn info
app.get('/linkedin', (req, res) => {
  res.json({
    clientId: process.env.LINKEDIN_CLIENT_ID || 'Not configured',
    clientSecretConfigured: !!process.env.LINKEDIN_CLIENT_SECRET
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Mini server running on port ${PORT}`);
  console.log(`Local URL: http://localhost:${PORT}`);
  console.log(`Replit URL: https://${process.env.REPLIT_DOMAINS || 'not-available'}`);
});