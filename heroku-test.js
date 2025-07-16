// Minimal test server for Heroku deployment
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(express.json());
app.use(cors());

// Test route
app.get('/test', (req, res) => {
  res.json({ 
    message: 'BeeTagged Test Server Working',
    cors: 'enabled',
    port: PORT,
    node_env: process.env.NODE_ENV || 'production'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on port ${PORT}`);
});