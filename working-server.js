const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Serve static files from dist (React build) and public
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date().toISOString() });
});

// API ping
app.get('/api/ping', (req, res) => {
  res.json({
    success: true,
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server on port 5000 (Replit standard)
const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`BeeTagged server running on port ${PORT}`);
  console.log(`Access at: http://localhost:${PORT}`);
});