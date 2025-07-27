const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(compression());
app.use(cors({
  origin: ['http://localhost:8080', 'https://your-lovable-app.lovable.app', '*'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import routes
try {
  app.use('/api/linkedin', require('./routes/linkedin'));
  app.use('/api/facebook', require('./routes/facebook'));
  app.use('/api/contacts', require('./routes/contacts'));
  app.use('/api/search', require('./routes/search'));
  app.use('/api/ranking', require('./routes/ranking'));
} catch (error) {
  console.warn('Some routes may not be available:', error.message);
  
  // Fallback simple routes
  app.get('/api/contacts', async (req, res) => {
    try {
      const Contact = require('./models/Contact');
      const contacts = await Contact.find({}).sort({ createdAt: -1 });
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch contacts' });
    }
  });
}

// Health check
app.get('/health', async (req, res) => {
  try {
    const Contact = require('./models/Contact');
    const contactCount = await Contact.countDocuments();
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      contacts: contactCount,
      mongodb: 'connected'
    });
  } catch (error) {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      mongodb: 'connecting...'
    });
  }
});

// Serve frontend for root path
app.get('/', (req, res) => {
  res.redirect('/health');
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`BeeTagged Backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
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