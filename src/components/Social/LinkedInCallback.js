import React, { useEffect, useState } from 'react';
import { socialAuth } from '../../utils/socialAuth';

/**
 * Component to handle the callback from LinkedIn OAuth flow
 * This component will be rendered at the /linkedin-callback route
 */
const LinkedInCallback = () => {
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      // Extract the authorization code and state from the URL
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');
      
      // Get the stored state from localStorage for verification
      const storedState = localStorage.getItem('linkedInAuthState');
      
      // Get the redirect URL (where the user was before initiating the login)
      const redirectUrl = localStorage.getItem('linkedInRedirectAfterAuth') || '/';
      
      // Clear the stored state and redirect URL
      localStorage.removeItem('linkedInAuthState');
      localStorage.removeItem('linkedInRedirectAfterAuth');
      
      // Handle error from LinkedIn
      if (error) {
        setStatus('error');
        setError(`LinkedIn authentication error: ${error}`);
        return;
      }
      
      // Verify the state parameter to prevent CSRF attacks
      if (!state || state !== storedState) {
        setStatus('error');
        setError('Invalid state parameter. Authentication failed for security reasons.');
        return;
      }
      
      // Verify the code parameter
      if (!code) {
        setStatus('error');
        setError('No authorization code received from LinkedIn');
        return;
      }
      
      try {
        // Exchange the code for an access token via our server
        await socialAuth('linkedin', { code });
        
        setStatus('success');
        
        // Redirect back to the page where the user initiated the login
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 2000);
      } catch (err) {
        console.error('Error during LinkedIn authentication:', err);
        setStatus('error');
        setError('Failed to authenticate with LinkedIn: ' + err.message);
      }
    };
    
    handleCallback();
  }, []);

  // Render a loading state while processing
  if (status === 'processing') {
    return (
      <div className="linkedin-callback-container container text-center py-5">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <h3>Processing LinkedIn Authentication</h3>
        <p className="text-muted">Please wait while we connect your LinkedIn account...</p>
      </div>
    );
  }
  
  // Render error state
  if (status === 'error') {
    return (
      <div className="linkedin-callback-container container text-center py-5">
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          <strong>Authentication Error</strong>
          <p>{error}</p>
        </div>
        <button
          className="btn btn-primary mt-3"
          onClick={() => {
            window.location.href = '/';
          }}
        >
          Return to Home
        </button>
      </div>
    );
  }
  
  // Render success state
  return (
    <div className="linkedin-callback-container container text-center py-5">
      <div className="alert alert-success">
        <i className="fas fa-check-circle me-2"></i>
        <strong>Success!</strong>
        <p>Your LinkedIn account has been connected successfully.</p>
      </div>
      <p>Redirecting you back to the application...</p>
    </div>
  );
};

export default LinkedInCallback;