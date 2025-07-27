const express = require('express');
const path = require('path');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable gzip compression
app.use(compression());

// Serve static files from public directory (if exists)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'dist')));

// Basic HTML response for root route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>BeeTagged - Professional Contact Search</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .container { max-width: 800px; margin: 0 auto; text-align: center; }
        .logo { font-size: 2.5rem; font-weight: bold; margin-bottom: 20px; }
        .subtitle { font-size: 1.2rem; opacity: 0.9; margin-bottom: 40px; }
        .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 40px 0; }
        .feature { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; backdrop-filter: blur(10px); }
        .status { background: rgba(0,255,0,0.2); padding: 15px; border-radius: 8px; margin: 20px 0; }
        .api-info { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin: 20px 0; text-align: left; }
        code { background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px; font-family: 'Monaco', monospace; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">🐝 BeeTagged</div>
        <div class="subtitle">Professional Contact Search Platform</div>
        
        <div class="status">
          ✅ Frontend Server Running Successfully<br>
          🌐 Ready for React App Integration
        </div>
        
        <div class="features">
          <div class="feature">
            <h3>🔍 AI-Powered Search</h3>
            <p>Natural language queries like "Who works at Google?"</p>
          </div>
          <div class="feature">
            <h3>📱 LinkedIn Integration</h3>
            <p>Import and manage professional contacts</p>
          </div>
          <div class="feature">
            <h3>🏷️ Smart Tagging</h3>
            <p>Auto-categorization by company and role</p>
          </div>
        </div>
        
        <div class="api-info">
          <h3>🔗 Backend API Integration</h3>
          <p><strong>Backend URL:</strong> <code>${process.env.BACKEND_URL || 'https://beetagged-app-53414697acd3.herokuapp.com'}</code></p>
          <p><strong>Health Check:</strong> <code>/health</code></p>
          <p><strong>Contacts API:</strong> <code>/api/contacts</code></p>
          <p><strong>Search API:</strong> <code>/api/search/natural?q=query</code></p>
        </div>
        
        <div style="margin-top: 40px; opacity: 0.8;">
          <p>Frontend deployment successful. Ready to integrate React components.</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'BeeTagged Frontend',
    timestamp: new Date().toISOString(),
    backend: process.env.BACKEND_URL || 'https://beetagged-app-53414697acd3.herokuapp.com'
  });
});

// Handle all other routes (for future React routing)
app.get('*', (req, res) => {
  res.redirect('/');
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`BeeTagged Frontend Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`Backend URL: ${process.env.BACKEND_URL || 'https://beetagged-app-53414697acd3.herokuapp.com'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;