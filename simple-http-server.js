// A minimal HTTP server with no dependencies
const http = require('http');
const fs = require('fs');
const path = require('path');

// Map file extensions to content types
const contentTypeMap = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Log environment variables to help debug
console.log('REPLIT_DOMAINS:', process.env.REPLIT_DOMAINS);
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Create simple HTML content for testing
const testHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>BeeTagged - Server Test</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #f6b929; }
    .box { background: #f5f5f5; border-radius: 8px; padding: 15px; margin-top: 20px; }
    button { background: #f6b929; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
  </style>
</head>
<body>
  <h1>BeeTagged - Server Test</h1>
  <p>This is a test page to verify the server is working through Replit.</p>
  
  <div class="box">
    <h2>Server Info</h2>
    <p>Page loaded at: <span id="time"></span></p>
    <p>URL: <span id="url"></span></p>
  </div>
  
  <div class="box">
    <h2>API Test</h2>
    <button onclick="testApi()">Test API Health</button>
    <pre id="apiResult"></pre>
  </div>
  
  <script>
    // Display basic page info
    document.getElementById('time').textContent = new Date().toISOString();
    document.getElementById('url').textContent = window.location.href;
    
    // Test API endpoint
    function testApi() {
      fetch('/api/health')
        .then(response => response.json())
        .then(data => {
          document.getElementById('apiResult').textContent = JSON.stringify(data, null, 2);
        })
        .catch(error => {
          document.getElementById('apiResult').textContent = 'Error: ' + error.message;
        });
    }
    
    // Log that the page loaded (for console logs)
    console.log('BeeTagged server test page loaded at ' + new Date().toISOString());
  </script>
</body>
</html>
`;

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    
    // Parse URL
    let url = req.url;
    
    // Default to index.html
    if (url === '/' || url === '') {
      // For testing, serve the embedded HTML
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(testHtml);
      return;
    }
    
    // Handle OPTIONS requests (for CORS)
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400' // 24 hours
      });
      res.end();
      return;
    }
    
    // Special case for API health endpoint
    if (url === '/api/health') {
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'BeeTagged API is running',
        env: {
          replitDomains: process.env.REPLIT_DOMAINS || 'not set',
          port: process.env.PORT || '5000',
          nodeEnv: process.env.NODE_ENV || 'not set'
        }
      }));
      return;
    }
    
    // Another special case for testing
    if (url === '/test') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h1>Test endpoint</h1><p>Server is working!</p>');
      return;
    }
    
    // For all other requests, try to serve from filesystem
    let filePath;
    if (url.startsWith('/public/')) {
      // Serve from public directory
      filePath = path.join(__dirname, url);
    } else {
      // Try to serve from root directory first, then from public
      filePath = path.join(__dirname, url.substring(1));
      if (!fs.existsSync(filePath)) {
        filePath = path.join(__dirname, 'public', url.substring(1));
      }
    }
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 Not Found</h1><p>The requested file could not be found.</p>');
      return;
    }
    
    // Determine content type based on file extension
    const ext = path.extname(filePath);
    const contentType = contentTypeMap[ext] || 'text/plain';
    
    // Read and serve the file
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error('Error reading file:', err);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>500 Internal Server Error</h1><p>Error reading the file.</p>');
        return;
      }
      
      // Add CORS headers
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      });
      res.end(data);
    });
  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end('<h1>500 Internal Server Error</h1><p>Something went wrong on the server.</p>');
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('============================');
  console.log(`HTTP Server running on port ${PORT}`);
  console.log(`Local URL: http://localhost:${PORT}`);
  console.log(`Replit URL: https://${process.env.REPLIT_DOMAINS || 'unknown'}`);
  console.log('============================');
});