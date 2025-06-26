const express = require('express');

const app = express();

console.log('Starting BeeTagged server...');

app.get('/', (req, res) => {
  console.log('Root route accessed');
  res.send('<h1>BeeTagged Server Running!</h1><p>Server is working correctly.</p>');
});

app.get('/health', (req, res) => {
  console.log('Health check accessed');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;

console.log(`Attempting to bind to port: ${PORT}`);

app.listen(PORT, (err) => {
  if (err) {
    console.error('FATAL: Server failed to start:', err);
    process.exit(1);
  }
  console.log(`SUCCESS: Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('Server startup complete');
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
});

console.log('Server initialization complete - waiting for port binding...');