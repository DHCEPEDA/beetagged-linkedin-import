const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const ejs = require('ejs');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contacts');
const tagRoutes = require('./routes/tags');
const groupRoutes = require('./routes/groups');
const socialRoutes = require('./routes/social');

// Import database connection
const connectDB = require('./config/db');

// Initialize app
const app = express();
const PORT = process.env.PORT || 8000;

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up EJS for templating
app.engine('html', ejs.renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, '..', 'public'));

// Set up routes
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/social', socialRoutes);

// Serve static assets
app.use(express.static(path.join(__dirname, '..', 'public')));

// Serve the React app - all other routes go to index.html
app.get('*', (req, res) => {
  res.render('index', { 
    process: {
      env: {
        NODE_ENV: process.env.NODE_ENV,
        FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID,
        // Add other environment variables you want to expose to the client
      }
    } 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  // server.close(() => process.exit(1));
});
