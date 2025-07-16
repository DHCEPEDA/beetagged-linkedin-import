// Simplified BeeTagged server for Heroku deployment
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple CORS middleware (avoiding external dependency)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Storage arrays
let contacts = [];
let tags = [];
let contactIdCounter = 1;
let tagIdCounter = 1;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Static files
app.use(express.static(path.join(__dirname, 'dist')));

// API Routes
app.get('/api/contacts', (req, res) => {
  res.json(contacts);
});

app.post('/api/contacts', (req, res) => {
  const newContact = {
    id: contactIdCounter++,
    ...req.body,
    createdAt: new Date().toISOString()
  };
  contacts.push(newContact);
  res.json(newContact);
});

app.get('/api/tags', (req, res) => {
  res.json(tags);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    server: 'BeeTagged',
    contacts: contacts.length,
    port: PORT,
    uptime: process.uptime()
  });
});

// Status endpoint
app.get('/status', (req, res) => {
  res.json({
    server: 'BeeTagged LinkedIn Import Server',
    status: 'running',
    environment: process.env.NODE_ENV || 'production',
    port: PORT,
    features: {
      contactManagement: true,
      staticFiles: fs.existsSync(path.join(__dirname, 'dist', 'index.html'))
    },
    stats: {
      contacts: contacts.length,
      uptime: process.uptime()
    }
  });
});

// Homepage route
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({
      message: 'BeeTagged Server Running',
      status: 'healthy',
      endpoints: ['/health', '/status', '/api/contacts', '/api/tags']
    });
  }
});

// Catch-all for React Router
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.redirect('/');
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`BeeTagged Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`Build exists: ${fs.existsSync(path.join(__dirname, 'dist', 'index.html'))}`);
});