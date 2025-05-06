// A minimal server specifically for testing Replit connectivity
const express = require('express');
const app = express();

// Basic HTML for home page
const homePage = `
<!DOCTYPE html>
<html>
<head>
  <title>Replit Connectivity Test</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
    h1 { color: #4184e4; }
    button { padding: 10px; background: #4184e4; color: white; border: none; cursor: pointer; }
    pre { background: #f5f5f5; padding: 10px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>Replit Connectivity Test</h1>
  <p>If you can see this page, the web server is successfully accessible through Replit!</p>
  
  <p><button onclick="testApi()">Test API</button></p>
  <pre id="result">Click the button to test the API...</pre>
  
  <script>
    function testApi() {
      document.getElementById('result').textContent = 'Loading...';
      
      fetch('/api/ping')
        .then(response => response.json())
        .then(data => {
          document.getElementById('result').textContent = JSON.stringify(data, null, 2);
        })
        .catch(error => {
          document.getElementById('result').textContent = 'Error: ' + error.message;
        });
    }
    
    // Log page load
    console.log('Replit connectivity test page loaded at ' + new Date().toISOString());
  </script>
</body>
</html>
`;

// Only set up a couple of routes for simplicity
app.get('/', (req, res) => {
  // Log each request so we can see it in the console
  console.log(`[${new Date().toISOString()}] GET / from ${req.ip}`);
  res.send(homePage);
});

app.get('/api/ping', (req, res) => {
  // Log each request so we can see it in the console
  console.log(`[${new Date().toISOString()}] GET /api/ping from ${req.ip}`);
  res.json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    env: {
      node_version: process.version,
      replit_domain: process.env.REPLIT_DOMAIN || 'not set'
    }
  });
});

// Listen on the standard port for Replit with host set to localhost
// This is the key change - based on Replit documentation
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║                                                    ║
║     Replit Connectivity Test Server                ║
║     Running on port ${PORT} - localhost only          ║
║                                                    ║
╚════════════════════════════════════════════════════╝
`);
});