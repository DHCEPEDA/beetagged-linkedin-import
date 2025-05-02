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
const configRoutes = require('./routes/config');

// Import the routes - no need to duplicate imports

// Import database connection
const connectDB = require('./config/db');

// Initialize app
const app = express();
// Force port 5000 which is the port Replit expects
const PORT = 5000;

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  let dbStatusText = 'unknown';
  switch(dbStatus) {
    case 0: dbStatusText = 'disconnected'; break;
    case 1: dbStatusText = 'connected'; break;
    case 2: dbStatusText = 'connecting'; break;
    case 3: dbStatusText = 'disconnecting'; break;
  }
  
  res.json({
    status: 'running',
    dbStatus: dbStatusText,
    mockMode: dbStatus !== 1,
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// Direct LinkedIn test endpoint
app.get('/li-test', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>BeeTagged - LinkedIn Test</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" rel="stylesheet">
      <style>
        body {
          background-color: #f8f9fa;
          font-family: Arial, sans-serif;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          padding: 20px;
        }
        .li-button {
          background-color: #0A66C2;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 10px 20px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          width: 100%;
          margin: 20px 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .li-button svg {
          margin-right: 8px;
        }
        .status {
          margin-top: 20px;
          padding: 15px;
          border-radius: 4px;
          display: none;
        }
        .success {
          background-color: #d4edda;
          color: #155724;
        }
        .error {
          background-color: #f8d7da;
          color: #721c24;
        }
      </style>
    </head>
    <body>
      <div class="container text-center">
        <h1 style="color: #FD9E31;">BeeTagged</h1>
        <p>LinkedIn Login Test</p>
        
        <div>
          <button id="loginBtn" class="li-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.47,2H3.53A1.45,1.45,0,0,0,2.06,3.43V20.57A1.45,1.45,0,0,0,3.53,22H20.47a1.45,1.45,0,0,0,1.47-1.43V3.43A1.45,1.45,0,0,0,20.47,2ZM8.09,18.74h-3v-9h3ZM6.59,8.48h0a1.56,1.56,0,1,1,0-3.12,1.57,1.57,0,1,1,0,3.12ZM18.91,18.74h-3V13.91c0-1.21-.43-2-1.52-2A1.65,1.65,0,0,0,12.85,13a2,2,0,0,0-.1.73v5h-3s0-8.18,0-9h3V11A3,3,0,0,1,15.46,9.5c2,0,3.45,1.29,3.45,4.06Z" />
            </svg>
            Continue with LinkedIn
          </button>
          
          <div id="statusBox" class="status"></div>
        </div>
      </div>

      <script>
        // LinkedIn Client ID from server environment
        const LINKEDIN_CLIENT_ID = '${process.env.LINKEDIN_CLIENT_ID || "86y7xx9vw9lslc"}';
        
        // Load the LinkedIn SDK
        function loadLinkedInSDK() {
          const script = document.createElement('script');
          script.type = 'text/javascript';
          script.src = "https://platform.linkedin.com/in.js";
          script.innerHTML = \`
            api_key: \${LINKEDIN_CLIENT_ID}
            authorize: true
            onLoad: onLinkedInLoad
            scope: r_emailaddress r_liteprofile
          \`;
          document.getElementsByTagName('head')[0].appendChild(script);
        }
        
        // Called when LinkedIn SDK is loaded
        function onLinkedInLoad() {
          console.log('LinkedIn SDK loaded');
          
          // Check if already logged in
          IN.User.isAuthorized(function(isAuthorized) {
            console.log('Is authorized:', isAuthorized);
            if (isAuthorized) {
              showSuccess();
            }
          });
        }
        
        // Set up the login button
        document.getElementById('loginBtn').addEventListener('click', function() {
          // Initialize LinkedIn SDK if not already done
          if (typeof IN === 'undefined') {
            loadLinkedInSDK();
            showError('LinkedIn SDK loading... Please try again in a moment.');
            return;
          }
          
          // Trigger LinkedIn login
          IN.User.authorize(function() {
            showSuccess();
          });
        });
        
        function showSuccess() {
          const statusBox = document.getElementById('statusBox');
          statusBox.className = 'status success';
          statusBox.style.display = 'block';
          
          // Get user profile data
          IN.API.Profile("me")
            .fields(["id", "firstName", "lastName", "profilePicture", "emailAddress"])
            .result(function(result) {
              console.log('Profile data:', result);
              
              if (result && result.values && result.values[0]) {
                const profile = result.values[0];
                const firstName = profile.firstName?.localized?.en_US || '';
                const lastName = profile.lastName?.localized?.en_US || '';
                
                statusBox.innerHTML = '<h4>Login Successful!</h4>' +
                  '<p>Welcome, ' + firstName + ' ' + lastName + '!</p>' +
                  '<p>User ID: ' + profile.id + '</p>' +
                  '<p>Email: ' + (profile.emailAddress || 'Not available') + '</p>';
              } else {
                statusBox.innerHTML = '<h4>Login Successful!</h4><p>Could not retrieve profile details.</p>';
              }
            })
            .error(function(error) {
              console.error('LinkedIn API error:', error);
              statusBox.innerHTML = '<h4>Login Successful!</h4><p>Connected to LinkedIn, but could not fetch profile data.</p>';
            });
        }
        
        function showError(message) {
          const statusBox = document.getElementById('statusBox');
          statusBox.className = 'status error';
          statusBox.style.display = 'block';
          statusBox.innerHTML = '<h4>Error</h4><p>' + message + '</p>';
        }
        
        // Load the LinkedIn SDK on page load
        loadLinkedInSDK();
      </script>
    </body>
    </html>
  `);
});

// Direct Facebook test endpoint
app.get('/fb-test', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>BeeTagged - Facebook Test</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" rel="stylesheet">
      <style>
        body {
          background-color: #f8f9fa;
          font-family: Arial, sans-serif;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          padding: 20px;
        }
        .fb-button {
          background-color: #1877F2;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 10px 20px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          width: 100%;
          margin: 20px 0;
        }
        .status {
          margin-top: 20px;
          padding: 15px;
          border-radius: 4px;
          display: none;
        }
        .success {
          background-color: #d4edda;
          color: #155724;
        }
        .error {
          background-color: #f8d7da;
          color: #721c24;
        }
      </style>
    </head>
    <body>
      <div class="container text-center">
        <h1 style="color: #FD9E31;">BeeTagged</h1>
        <p>Facebook Login Test</p>
        
        <div>
          <button id="loginBtn" class="fb-button">
            Continue with Facebook
          </button>
          
          <div id="statusBox" class="status"></div>
        </div>
      </div>

      <script>
        // Facebook App ID directly from server environment
        const FACEBOOK_APP_ID = '${process.env.FACEBOOK_APP_ID || "1222790436230433"}';
        
        window.fbAsyncInit = function() {
          FB.init({
            appId: FACEBOOK_APP_ID,
            cookie: true,
            xfbml: true,
            version: 'v18.0'
          });
          
          FB.getLoginStatus(function(response) {
            console.log('FB status:', response);
            if (response.status === 'connected') {
              showSuccess(response);
            }
          });
        };
        
        (function(d, s, id) {
          var js, fjs = d.getElementsByTagName(s)[0];
          if (d.getElementById(id)) return;
          js = d.createElement(s); js.id = id;
          js.src = "https://connect.facebook.net/en_US/sdk.js";
          fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
        
        document.getElementById('loginBtn').addEventListener('click', function() {
          FB.login(function(response) {
            console.log('Login response:', response);
            if (response.status === 'connected') {
              showSuccess(response);
            } else {
              showError('Login cancelled or failed');
            }
          }, {scope: 'public_profile,email'});
        });
        
        function showSuccess(response) {
          const statusBox = document.getElementById('statusBox');
          statusBox.className = 'status success';
          statusBox.style.display = 'block';
          
          FB.api('/me', {fields: 'name,email'}, function(userData) {
            statusBox.innerHTML = '<h4>Login Successful!</h4>' +
              '<p>Welcome, ' + userData.name + '!</p>' +
              '<p>User ID: ' + userData.id + '</p>' +
              '<p>Email: ' + (userData.email || 'Not available') + '</p>';
          });
        }
        
        function showError(message) {
          const statusBox = document.getElementById('statusBox');
          statusBox.className = 'status error';
          statusBox.style.display = 'block';
          statusBox.innerHTML = '<h4>Error</h4><p>' + message + '</p>';
        }
      </script>
    </body>
    </html>
  `);
});

// Set up routes
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/config', configRoutes);

// Serve static assets from public and dist
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.static(path.join(__dirname, '..', 'dist')));

// Direct access route for app.html
app.get('/app.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'app.html'));
});

// Route to serve the app-config.js file
app.get('/app-config.js', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'app-config.js'));
});

// Direct access route
app.get('/direct', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'direct-access.html'));
});

// Special route for Facebook diagnostic tools
app.get('/facebook-diagnostic.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'facebook-diagnostic.html'));
});

app.get('/server-auth.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'server-auth.html'));
});

// Serve the React app - all other routes go to index.html
app.get('*', (req, res) => {
  // First try to serve the index.html directly
  const indexPath = path.join(__dirname, '..', 'public', 'index.html');
  res.sendFile(indexPath, err => {
    if (err) {
      // Fall back to rendering with EJS if direct file sending fails
      res.render('index', { 
        process: {
          env: {
            NODE_ENV: process.env.NODE_ENV,
            FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID || '1222790436230433',
          }
        } 
      });
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
  console.log(`Server accessible at: http://0.0.0.0:${PORT}`);
  console.log(`Health check endpoint: http://0.0.0.0:${PORT}/api/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  // server.close(() => process.exit(1));
});
