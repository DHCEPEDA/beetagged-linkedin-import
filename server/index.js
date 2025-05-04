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
const wizardRoutes = require('./routes/wizard');

// Import the routes - no need to duplicate imports

// Import database connection
const connectDB = require('./config/db');

// Initialize app
const app = express();
// Use the PORT environment variable or default to 5000
// Replit prefers using port 5000 for exposed services
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Middleware
// Configure CORS for all domains with proper headers
app.use(cors({
  origin: '*', // Allow any origin in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Auth-Token']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add trust proxy for Replit secure connections
app.set('trust proxy', 1);

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

// Direct LinkedIn test endpoint
app.get('/linkedin-test', (req, res) => {
  // Define HOSTNAME for this endpoint - using Replit domain
  const HOSTNAME = process.env.REPLIT_DOMAINS || 'd49cd8c1-1139-4a7e-96a2-5d125f417ecd-00-3ftoc46fv9y6p.riker.replit.dev';
    
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
        .linkedin-button {
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
        .test-section {
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }
        pre {
          background-color: #f5f5f5;
          padding: 10px;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 style="color: #FD9E31;" class="text-center">BeeTagged</h1>
        <p class="text-center">LinkedIn Login Test</p>
        
        <div class="test-section">
          <h4>Method 1: Server-Side Authentication</h4>
          <p>This uses your server route to initiate the LinkedIn OAuth flow:</p>
          
          <div class="text-center">
            <a href="/api/auth/linkedin/url" class="btn btn-primary linkedin-button" id="serverAuthBtn">
              Continue with LinkedIn (Server Auth)
            </a>
            
            <div id="serverStatus" class="status"></div>
          </div>
        </div>
        
        <div class="test-section">
          <h4>Method 2: Client-Side SDK</h4>
          <p>This uses the LinkedIn JavaScript SDK:</p>
          
          <div class="text-center">
            <button id="sdkAuthBtn" class="linkedin-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24" style="margin-right: 8px">
                <path d="M20.47,2H3.53A1.45,1.45,0,0,0,2.06,3.43V20.57A1.45,1.45,0,0,0,3.53,22H20.47a1.45,1.45,0,0,0,1.47-1.43V3.43A1.45,1.45,0,0,0,20.47,2ZM8.09,18.74h-3v-9h3ZM6.59,8.48h0a1.56,1.56,0,1,1,0-3.12,1.57,1.57,0,1,1,0,3.12ZM18.91,18.74h-3V13.91c0-1.21-.43-2-1.52-2A1.65,1.65,0,0,0,12.85,13a2,2,0,0,0-.1.73v5h-3s0-8.18,0-9h3V11A3,3,0,0,1,15.46,9.5c2,0,3.45,1.29,3.45,4.06Z" />
              </svg>
              Continue with LinkedIn (SDK)
            </button>
            
            <div id="sdkStatus" class="status"></div>
          </div>
        </div>
        
        <div class="test-section">
          <h4>Server Configuration</h4>
          <p>Current server settings for LinkedIn authentication:</p>
          <pre>
LINKEDIN_CLIENT_ID: ${process.env.LINKEDIN_CLIENT_ID || '867adep5adc22g'} (${process.env.LINKEDIN_CLIENT_ID ? 'From Env' : 'User Provided ID'})
LINKEDIN_CLIENT_SECRET: ${process.env.LINKEDIN_CLIENT_SECRET ? '************' : 'WPL_AP1.j4ip****'} (${process.env.LINKEDIN_CLIENT_SECRET ? 'From Env' : 'User Provided Secret'})
LINKEDIN_REDIRECT_URI: ${process.env.LINKEDIN_REDIRECT_URI || `https://${HOSTNAME}/api/auth/linkedin/callback`}
          </pre>
          <p class="text-muted"><strong>Important:</strong> Make sure to add this exact Authorized Redirect URL to your LinkedIn App:</p>
          <div class="alert alert-info">
            <code>${process.env.LINKEDIN_REDIRECT_URI || `https://${HOSTNAME}/api/auth/linkedin/callback`}</code>
          </div>
          <p>If you're still getting "page not found" errors, verify that this URL is added to your LinkedIn Developer Console under Auth → OAuth 2.0 settings.</p>
        </div>
      </div>

      <script>
        // LinkedIn Client ID directly from server
        const LINKEDIN_CLIENT_ID = '${process.env.LINKEDIN_CLIENT_ID || "867adep5adc22g"}';
        const HOSTNAME = '${HOSTNAME}';
        
        // Handle server-side authentication
        document.getElementById('serverAuthBtn').addEventListener('click', async function(e) {
          e.preventDefault();
          
          try {
            // Get auth URL from server
            const response = await fetch('/api/auth/linkedin/url');
            const data = await response.json();
            
            // Log info and redirect
            console.log('LinkedIn auth URL received:', data.url);
            window.location.href = data.url;
          } catch (error) {
            console.error('Error getting LinkedIn auth URL:', error);
            showError('serverStatus', 'Failed to get authentication URL. Check console for details.');
          }
        });
        
        // Load LinkedIn SDK
        function loadLinkedInSDK() {
          window.linkedInInit = function() {
            if (window.IN) {
              console.log('LinkedIn SDK initialized');
            }
          };
          
          // Load the SDK asynchronously
          (function(d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) return;
            js = d.createElement(s); js.id = id;
            js.src = "https://platform.linkedin.com/in.js?apiKey=" + LINKEDIN_CLIENT_ID + "&onLoad=linkedInInit";
            js.async = true;
            js.defer = true;
            js.text = "api_key: " + LINKEDIN_CLIENT_ID + "\nonLoad: linkedInInit";
            fjs.parentNode.insertBefore(js, fjs);
          }(document, 'script', 'linkedin-jssdk'));
        }
        
        // Handle SDK authentication
        document.getElementById('sdkAuthBtn').addEventListener('click', function() {
          const statusBox = document.getElementById('sdkStatus');
          statusBox.className = 'status info';
          statusBox.style.display = 'block';
          statusBox.innerHTML = '<p>Initializing LinkedIn SDK...</p>';
          
          if (!window.IN) {
            loadLinkedInSDK();
            
            // Check periodically if SDK is loaded
            const sdkCheckInterval = setInterval(() => {
              if (window.IN) {
                clearInterval(sdkCheckInterval);
                proceedWithLinkedInAuth();
              }
            }, 500);
            
            // Timeout after 10 seconds
            setTimeout(() => {
              clearInterval(sdkCheckInterval);
              if (!window.IN) {
                showError('sdkStatus', 'LinkedIn SDK failed to load after 10 seconds');
              }
            }, 10000);
          } else {
            proceedWithLinkedInAuth();
          }
        });
        
        function proceedWithLinkedInAuth() {
          const statusBox = document.getElementById('sdkStatus');
          statusBox.innerHTML = '<p>Authorizing with LinkedIn...</p>';
          
          // Initiate login
          window.IN.User.authorize(function() {
            statusBox.innerHTML = '<p>Authorized! Fetching profile...</p>';
            
            // Fetch profile data
            window.IN.API.Profile("me")
              .fields(["id", "firstName", "lastName", "profilePicture", "emailAddress"])
              .result(function(result) {
                console.log('LinkedIn profile data:', result);
                
                if (result && result.values && result.values[0]) {
                  const profile = result.values[0];
                  
                  // Format the user data
                  const userData = {
                    id: profile.id,
                    name: profile.firstName.localized.en_US + ' ' + profile.lastName.localized.en_US,
                    email: profile.emailAddress || 'Email not available',
                    picture: profile.profilePicture?.displayImage || null,
                    provider: 'linkedin'
                  };
                  
                  showSuccess('sdkStatus', userData);
                } else {
                  showError('sdkStatus', 'Could not retrieve profile data');
                }
              })
              .error(function(error) {
                console.error('LinkedIn API error:', error);
                showError('sdkStatus', 'Error fetching profile: ' + (error.message || 'Unknown error'));
              });
          });
        }
        
        // Show success message
        function showSuccess(elementId, userData) {
          const statusBox = document.getElementById(elementId);
          statusBox.className = 'status success';
          statusBox.style.display = 'block';
          
          statusBox.innerHTML = '<h5>LinkedIn Login Successful!</h5>' +
            '<p><strong>Welcome, ' + userData.name + '!</strong></p>' +
            '<p>User ID: ' + userData.id + '</p>' +
            '<p>Email: ' + userData.email + '</p>';
            
          if (userData.picture) {
            statusBox.innerHTML += '<p>Picture URL available</p>';
          }
        }
        
        // Show error message
        function showError(elementId, message) {
          const statusBox = document.getElementById(elementId);
          statusBox.className = 'status error';
          statusBox.style.display = 'block';
          statusBox.innerHTML = '<h5>Error</h5><p>' + message + '</p>';
        }
        
        // Check for authentication response in URL
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('code') && urlParams.has('state')) {
          const statusBox = document.getElementById('serverStatus');
          statusBox.className = 'status info';
          statusBox.style.display = 'block';
          statusBox.innerHTML = '<p>Processing authentication response...</p>';
          
          console.log('Auth code detected in URL. This should be handled by the server callback endpoint.');
          statusBox.innerHTML = '<p>Auth code detected in URL. If you see this, the callback endpoint might not be configured correctly.</p>';
        }
      </script>
    </body>
    </html>
  `);
});

// Direct Facebook test endpoint
app.get('/fb-test', (req, res) => {
  // Define HOSTNAME for this endpoint - no port number for correct OAuth redirects
  const HOSTNAME = 'd49cd8c1-1139-4a7e-96a2-5d125f417ecd-00-3ftoc46fv9y6p.riker.replit.dev';
    
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
        .custom-fb-button {
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
        .test-section {
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 style="color: #FD9E31;" class="text-center">BeeTagged</h1>
        <p class="text-center">Facebook Login Test</p>
        
        <div class="test-section">
          <h4>Method 1: Official Facebook Login Button</h4>
          <p>This uses the official &lt;fb:login-button&gt; component as recommended by Facebook:</p>
          
          <div class="text-center">
            <div id="fb-root"></div>
            <div class="fb-login-button" 
                data-width="" 
                data-size="large" 
                data-button-type="continue_with" 
                data-layout="default" 
                data-auto-logout-link="false" 
                data-use-continue-as="false"
                data-scope="public_profile,email"
                data-onlogin="checkLoginState();">
            </div>
            
            <div id="officialStatus" class="status mt-3"></div>
          </div>
        </div>
        
        <div class="test-section">
          <h4>Method 2: Custom Button with FB.login()</h4>
          <p>This uses a custom button that calls FB.login() directly:</p>
          
          <div class="text-center">
            <button id="customLoginBtn" class="custom-fb-button">
              Continue with Facebook
            </button>
            
            <div id="customStatus" class="status"></div>
          </div>
        </div>
      </div>

      <script>
        // Facebook App ID directly from server environment
        const FACEBOOK_APP_ID = '${process.env.FACEBOOK_APP_ID || "1222790436230433"}';
        
        // Initialize the Facebook SDK
        window.fbAsyncInit = function() {
          FB.init({
            appId: FACEBOOK_APP_ID,
            cookie: true,
            xfbml: true,
            version: 'v18.0'
          });
          
          FB.AppEvents.logPageView();
          
          // Check if already logged in
          FB.getLoginStatus(function(response) {
            console.log('Initial FB status:', response);
            if (response.status === 'connected') {
              showSuccess('officialStatus', response);
              showSuccess('customStatus', response);
            }
          });
        };
        
        // Load the SDK asynchronously
        (function(d, s, id) {
          var js, fjs = d.getElementsByTagName(s)[0];
          if (d.getElementById(id)) return;
          js = d.createElement(s); js.id = id;
          js.src = "https://connect.facebook.net/en_US/sdk.js";
          fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
        
        // Callback for the official login button
        function checkLoginState() {
          FB.getLoginStatus(function(response) {
            console.log('Official login button response:', response);
            if (response.status === 'connected') {
              showSuccess('officialStatus', response);
            } else {
              showError('officialStatus', 'Login cancelled or failed');
            }
          });
        }
        
        // Handler for the custom button
        document.getElementById('customLoginBtn').addEventListener('click', function() {
          FB.login(function(response) {
            console.log('Custom login button response:', response);
            if (response.authResponse) {
              // Get user information
              FB.api('/me', { fields: 'name,email,picture' }, function(userData) {
                // Display success message with user info
                showSuccess('customStatus', response);
                
                // Send to backend for authentication
                fetch('/api/auth/facebook', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        accessToken: response.authResponse.accessToken,
                        userData: {
                            id: userData.id,
                            name: userData.name,
                            email: userData.email,
                            picture: userData.picture?.data?.url
                        }
                    }),
                })
                .then(res => res.json())
                .then(data => {
                    console.log('Server authentication response:', data);
                    const statusBox = document.getElementById('customStatus');
                    statusBox.innerHTML += 
                      '<h4>Server Authentication</h4>' +
                      '<p>Success: ' + (data.success ? 'Yes' : 'No') + '</p>' +
                      '<p>Token: ' + (data.token ? data.token.substring(0, 10) + '...' : 'None') + '</p>';
                })
                .catch(error => {
                    console.error('Server authentication error:', error);
                    const statusBox = document.getElementById('customStatus');
                    statusBox.innerHTML += 
                      '<h4>Server Error</h4>' +
                      '<p>' + error.message + '</p>';
                });
              });
            } else {
              showError('customStatus', 'Login cancelled or failed');
            }
          }, {scope: 'public_profile,email'}); // Removed user_friends permission
        });
        
        // Show success message and user info
        function showSuccess(elementId, response) {
          const statusBox = document.getElementById(elementId);
          statusBox.className = 'status success';
          statusBox.style.display = 'block';
          statusBox.innerHTML = '<p>Loading user data...</p>';
          
          FB.api('/me', {fields: 'name,email'}, function(userData) {
            statusBox.innerHTML = '<h5>Login Successful!</h5>' +
              '<p><strong>Welcome, ' + userData.name + '!</strong></p>' +
              '<p>User ID: ' + userData.id + '</p>' +
              '<p>Email: ' + (userData.email || 'Not available') + '</p>' +
              '<p>Access Token: ' + response.authResponse.accessToken.substring(0, 15) + '...</p>';
          });
        }
        
        // Show error message
        function showError(elementId, message) {
          const statusBox = document.getElementById(elementId);
          statusBox.className = 'status error';
          statusBox.style.display = 'block';
          statusBox.innerHTML = '<h5>Error</h5><p>' + message + '</p>';
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
app.use('/api/wizard', wizardRoutes);

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

// New, simpler FB diagnostic page
app.get('/fb-diagnostic', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'fb-diagnostic.html'));
});

// Simple Facebook test page
app.get('/fb-simple', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'fb-simple.html'));
});

// Facebook real credentials test page
app.get('/fb-real-test', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'fb-real-test.html'));
});

// Social connection wizard
app.get('/wizard', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'social-connect-wizard.html'));
});

app.get('/server-auth.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'server-auth.html'));
});

app.get('/auth-test.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'auth-test.html'));
});

app.get('/auth-test', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'auth-test.html'));
});

// Very simple test page for debugging
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'test.html'));
});

// Simple Facebook login test page
app.get('/simple-fb-test', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'simple-fb-test.html'));
});

// Direct Facebook login page - super simple approach
app.get('/direct-fb-login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'direct-fb-login.html'));
});

// Stanford approach to Facebook authentication
app.get('/stanford-fb-test', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'stanford-fb-test.html'));
});

// Stanford approach to LinkedIn authentication
app.get('/stanford-li-test', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'stanford-li-test.html'));
});

// Super Direct Facebook Login
app.get('/fb-direct', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'fb-direct.html'));
});

// Super Direct LinkedIn Login
app.get('/li-direct', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'li-direct.html'));
});

// Health check for browser testing
app.get('/api/ping', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
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

// Start server - make sure we're binding to 0.0.0.0 to work with Replit
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server accessible at: http://0.0.0.0:${PORT}`);
  console.log(`Health check endpoint: http://0.0.0.0:${PORT}/api/health`);
  
  // Get the actual Replit URL from environment variable
  const REPLIT_DOMAIN = process.env.REPLIT_DOMAINS || 'd49cd8c1-1139-4a7e-96a2-5d125f417ecd-00-3ftoc46fv9y6p.riker.replit.dev';
  console.log(`Replit domain: ${REPLIT_DOMAIN}`);
  
  console.log('To access test pages, use these URLs:');
  console.log(`Facebook test: https://${REPLIT_DOMAIN}/fb-test`);
  console.log(`Facebook diagnostic: https://${REPLIT_DOMAIN}/fb-diagnostic`);
  console.log(`Facebook simple: https://${REPLIT_DOMAIN}/fb-simple`);
  console.log(`Facebook direct login: https://${REPLIT_DOMAIN}/fb-direct`);
  console.log(`LinkedIn direct login: https://${REPLIT_DOMAIN}/li-direct`);
  console.log(`Stanford FB test: https://${REPLIT_DOMAIN}/stanford-fb-test`);
  console.log(`Stanford LinkedIn test: https://${REPLIT_DOMAIN}/stanford-li-test`);
  console.log(`LinkedIn test: https://${REPLIT_DOMAIN}/linkedin-test`);
  console.log(`Auth Test: https://${REPLIT_DOMAIN}/auth-test`);
  console.log(`Simple Test: https://${REPLIT_DOMAIN}/simple-test.html`);
  console.log(`Social Connection Wizard: https://${REPLIT_DOMAIN}/wizard`);
  console.log(`Tag Search Test: https://${REPLIT_DOMAIN}/tag-search-test.html`);
  console.log(`Main app: https://${REPLIT_DOMAIN}/`);
  console.log(`API Config Verify: https://${REPLIT_DOMAIN}/api/config/verify`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  // server.close(() => process.exit(1));
});
