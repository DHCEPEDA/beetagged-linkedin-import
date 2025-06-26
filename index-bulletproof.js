// Bulletproof Heroku server - no external dependencies beyond Express
const express = require('express');

console.log('=== BEETAGGED SERVER STARTING ===');

const app = express();

// Basic middleware only
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log('✓ Middleware configured');

// Simple in-memory storage
let contacts = [];
let contactCounter = 1;

console.log('✓ Storage initialized');

// Root route - must work
app.get('/', (req, res) => {
  console.log('→ Root route accessed');
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>BeeTagged Server</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #2563eb; }
        .status { color: #059669; font-weight: bold; }
        ul { margin: 20px 0; }
        li { margin: 10px 0; }
        a { color: #2563eb; text-decoration: none; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <h1>🐝 BeeTagged Server</h1>
      <p class="status">✓ Server running successfully on Heroku!</p>
      <p>Contacts stored: ${contacts.length}</p>
      
      <h3>Available Endpoints:</h3>
      <ul>
        <li><a href="/health">Health Check</a></li>
        <li><a href="/api/contacts">View Contacts API</a></li>
        <li><a href="/test">Test Page</a></li>
      </ul>
      
      <h3>Add Test Contact:</h3>
      <form action="/api/contacts" method="post">
        <input type="text" name="name" placeholder="Name" required>
        <input type="text" name="company" placeholder="Company">
        <button type="submit">Add Contact</button>
      </form>
    </body>
    </html>
  `;
  res.send(html);
});

// Health check
app.get('/health', (req, res) => {
  console.log('→ Health check accessed');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    contacts: contacts.length,
    memory: process.memoryUsage(),
    port: process.env.PORT || 5000
  });
});

// Test page
app.get('/test', (req, res) => {
  console.log('→ Test page accessed');
  res.send(`
    <h1>Test Page</h1>
    <p>Server is working correctly!</p>
    <p>Current time: ${new Date().toISOString()}</p>
    <p><a href="/">Back to Home</a></p>
  `);
});

// Contacts API
app.get('/api/contacts', (req, res) => {
  console.log('→ Contacts API accessed');
  res.json({
    success: true,
    contacts: contacts,
    total: contacts.length,
    timestamp: new Date().toISOString()
  });
});

// Add contact
app.post('/api/contacts', (req, res) => {
  console.log('→ Adding contact:', req.body);
  
  const { name, company, title } = req.body;
  
  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Name is required'
    });
  }
  
  const contact = {
    id: contactCounter++,
    name: name.trim(),
    company: company ? company.trim() : '',
    title: title ? title.trim() : '',
    createdAt: new Date().toISOString()
  };
  
  contacts.push(contact);
  
  console.log(`✓ Contact added: ${contact.name} (${contacts.length} total)`);
  
  res.json({
    success: true,
    message: 'Contact added successfully',
    contact: contact,
    total: contacts.length
  });
});

// Catch all other routes
app.get('*', (req, res) => {
  console.log('→ Unknown route accessed:', req.path);
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    availableRoutes: ['/', '/health', '/test', '/api/contacts']
  });
});

// Get port from environment
const PORT = process.env.PORT || 5000;

console.log(`✓ Using port: ${PORT}`);
console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);

// Start server with error handling
const server = app.listen(PORT, function(err) {
  if (err) {
    console.error('❌ FATAL: Server failed to start:', err);
    process.exit(1);
  }
  
  const address = server.address();
  console.log('✓ Server successfully bound to:', address);
  console.log(`🚀 BeeTagged server running on port ${PORT}`);
  console.log('=== SERVER STARTUP COMPLETE ===');
});

// Error handling
server.on('error', (err) => {
  console.error('❌ Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('SIGTERM', () => {
  console.log('📝 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✓ Server closed');
    process.exit(0);
  });
});

console.log('✓ Error handlers configured');
console.log('⏳ Waiting for port binding...');

module.exports = app;