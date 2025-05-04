const express = require('express');
const path = require('path');
const cors = require('cors');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Simple health route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'The simplified server is running correctly'
  });
});

// Simple route for health check page
app.get('/health', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'health-check.html'));
});

// Facebook route
app.get('/facebook', (req, res) => {
  res.json({
    message: 'This is the Facebook login endpoint',
    appId: process.env.FACEBOOK_APP_ID || 'Not configured'
  });
});

// LinkedIn route
app.get('/linkedin', (req, res) => {
  res.json({
    message: 'This is the LinkedIn login endpoint',
    clientId: process.env.LINKEDIN_CLIENT_ID || 'Not configured'
  });
});

// Configuration route
app.get('/api/config', (req, res) => {
  res.json({
    facebook: {
      appId: process.env.FACEBOOK_APP_ID || 'Not configured',
      appSecret: process.env.FACEBOOK_APP_SECRET ? 'Configured' : 'Not configured'
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID || 'Not configured',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET ? 'Configured' : 'Not configured'
    },
    domain: process.env.REPLIT_DOMAINS || 'localhost'
  });
});

// Serve all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'health-check.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Simple server running on port ${PORT}`);
  console.log(`Server accessible at: http://0.0.0.0:${PORT}`);
  console.log(`Health check endpoint: http://0.0.0.0:${PORT}/api/health`);
  
  const REPLIT_DOMAIN = process.env.REPLIT_DOMAINS || 'd49cd8c1-1139-4a7e-96a2-5d125f417ecd-00-3ftoc46fv9y6p.riker.replit.dev';
  console.log(`Replit domain: ${REPLIT_DOMAIN}`);
  console.log(`Health check: https://${REPLIT_DOMAIN}/health`);
  console.log(`Facebook endpoint: https://${REPLIT_DOMAIN}/facebook`);
  console.log(`LinkedIn endpoint: https://${REPLIT_DOMAIN}/linkedin`);
  console.log(`Config endpoint: https://${REPLIT_DOMAIN}/api/config`);
});