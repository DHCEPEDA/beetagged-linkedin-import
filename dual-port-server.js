/**
 * BeeTagged Dual Port Server
 * Runs the server on both port 3000 and port 5000 for maximum compatibility
 */
const express = require('express');
const http = require('http');
const path = require('path');
const app = require('./bee-tagged-server');  // Import the main app

// Create second instance on port 5000
const PORT_5000 = 5000;
const server = http.createServer(app);

// Listen on port 5000
server.listen(PORT_5000, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║     BeeTagged Secondary Server - Ready for Connections         ║
║     Running on port ${PORT_5000} - bound to all interfaces     ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`);
});