const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

// Enable all CORS requests
app.use(cors());

// Middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Basic routes
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>BeeTagged Mini Server</title>
        <style>
          body { font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
          h1 { color: #f6b929; }
          .card { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 15px; }
          pre { background: #eee; padding: 10px; border-radius: 3px; overflow-x: auto; }
        </style>
      </head>
      <body>
        <h1>BeeTagged Test Server</h1>
        <p>This is a minimal test server to verify Replit connectivity for the BeeTagged app.</p>
        
        <div class="card">
          <h2>Server Info</h2>
          <p>Time: ${new Date().toISOString()}</p>
          <p>Replit Domain: ${process.env.REPLIT_DOMAINS || 'Not available'}</p>
          <p>Node Environment: ${process.env.NODE_ENV || 'development'}</p>
        </div>
        
        <div class="card">
          <h2>Request Info</h2>
          <p>URL: ${req.url}</p>
          <p>Method: ${req.method}</p>
          <p>Headers:</p>
          <pre>${JSON.stringify(req.headers, null, 2)}</pre>
        </div>
        
        <div class="card">
          <h2>Available Routes</h2>
          <ul>
            <li><a href="/ping">/ping</a> - Simple ping endpoint</li>
            <li><a href="/facebook">/facebook</a> - Facebook app ID info</li>
            <li><a href="/linkedin">/linkedin</a> - LinkedIn client ID info</li>
            <li><a href="/api/health">/api/health</a> - API health check</li>
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
    time: new Date().toISOString(),
    headers: req.headers
  });
});

// Health check for API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'The BeeTagged API is running correctly'
  });
});

// Facebook info
app.get('/facebook', (req, res) => {
  res.json({
    appId: process.env.FACEBOOK_APP_ID || 'Not configured',
    appSecretConfigured: !!process.env.FACEBOOK_APP_SECRET,
    replitDomain: process.env.REPLIT_DOMAINS
  });
});

// LinkedIn info
app.get('/linkedin', (req, res) => {
  res.json({
    clientId: process.env.LINKEDIN_CLIENT_ID || 'Not configured',
    clientSecretConfigured: !!process.env.LINKEDIN_CLIENT_SECRET,
    replitDomain: process.env.REPLIT_DOMAINS
  });
});

// Catch-all route for diagnosis
app.use('*', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Route Not Found</title>
        <style>
          body { font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
          h1 { color: #f6b929; }
          .card { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 15px; }
          pre { background: #eee; padding: 10px; border-radius: 3px; overflow-x: auto; }
        </style>
      </head>
      <body>
        <h1>Route Not Found</h1>
        <p>The requested route "${req.originalUrl}" was not found on this server.</p>
        
        <div class="card">
          <h2>Request Info</h2>
          <p>URL: ${req.originalUrl}</p>
          <p>Method: ${req.method}</p>
          <p>Headers:</p>
          <pre>${JSON.stringify(req.headers, null, 2)}</pre>
        </div>
        
        <p><a href="/">Back to Home</a></p>
      </body>
    </html>
  `);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`BeeTagged Mini Server running on port ${PORT}`);
  console.log(`Local URL: http://localhost:${PORT}`);
  console.log(`Replit URL: https://${process.env.REPLIT_DOMAINS || 'not-available'}`);
  
  // Log environment info for debugging
  console.log('Environment variables:');
  console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`  REPLIT_DOMAINS: ${process.env.REPLIT_DOMAINS}`);
  console.log(`  REPLIT_DEV_DOMAIN: ${process.env.REPLIT_DEV_DOMAIN}`);
});