const express = require('express');
const path = require('path');
const app = express();

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Basic route
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Bee Tagged - Simple Server</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #f6b929; }
          .info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <h1>Bee Tagged - Simple Server Test</h1>
        <p>This is a very simple test server for the BeeTagged application.</p>
        
        <div class="info">
          <h2>Server Information</h2>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <p><strong>Replit Domain:</strong> ${process.env.REPLIT_DOMAINS || 'Not available'}</p>
          <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
        </div>
        
        <div class="info">
          <h2>Test API Endpoints</h2>
          <ul>
            <li><a href="/api/ping">/api/ping</a> - Basic ping test</li>
            <li><a href="/api/env">/api/env</a> - Environment info</li>
          </ul>
        </div>
      </body>
    </html>
  `);
});

// Add API endpoints
app.get('/api/ping', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/env', (req, res) => {
  res.json({
    replit_domain: process.env.REPLIT_DOMAINS,
    replit_dev_domain: process.env.REPLIT_DEV_DOMAIN,
    node_env: process.env.NODE_ENV,
    port: process.env.PORT || 5000
  });
});

// IMPORTANT: Replit requires port 5000 for web service
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Local URL: http://localhost:${PORT}`);
  console.log(`Replit URL: https://${process.env.REPLIT_DOMAINS}`);
});