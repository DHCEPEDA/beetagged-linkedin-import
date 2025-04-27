import React, { useState, useEffect } from 'react';
import { socialAuth } from '../../utils/socialAuth';

/**
 * LinkedIn login button component that helps users connect
 * their LinkedIn account to the application
 */
const LinkedInLoginButton = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [linkedInAuthUrl, setLinkedInAuthUrl] = useState('');

  useEffect(() => {
    // Set up LinkedIn auth URL
    const clientId = process.env.REACT_APP_LINKEDIN_CLIENT_ID || process.env.LINKEDIN_CLIENT_ID;
    if (!clientId) {
      setError('LinkedIn Client ID is not configured');
      return;
    }

    // Determine the redirect URI
    // In production, this should be your app's domain + callback path
    const redirectUri = window.location.origin + '/linkedin-callback';
    
    // Generate a state value for security
    const state = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('linkedInAuthState', state);
    
    // Store this redirect URL so we can handle the callback
    localStorage.setItem('linkedInRedirectAfterAuth', window.location.href);
    
    // Create the LinkedIn authorization URL
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=r_liteprofile%20r_emailaddress%20r_network`;
    
    setLinkedInAuthUrl(authUrl);
  }, []);

  // Handle the authentication with LinkedIn
  const handleLinkedInLogin = async () => {
    // If we don't have a LinkedIn auth URL, don't do anything
    if (!linkedInAuthUrl) {
      setError('LinkedIn authentication is not configured properly');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // For LinkedIn, we'll redirect to their auth page
      // The user will be redirected back to our app with an authorization code
      window.location.href = linkedInAuthUrl;
    } catch (err) {
      console.error('Error initiating LinkedIn login:', err);
      setError('Failed to initiate LinkedIn login: ' + err.message);
      setIsLoading(false);
    }
  };
  
  // This function is not used here but would be used in the callback component
  const handleLinkedInCallback = async (code) => {
    try {
      setIsLoading(true);
      
      // Exchange the code for an access token via our server
      const userData = await socialAuth('linkedin', { code });
      
      // Call the onLogin callback if provided
      if (onLogin) {
        onLogin(userData);
      }
      
      setIsLoading(false);
      
      // Redirect back to the page where the user initiated the login
      const redirectUrl = localStorage.getItem('linkedInRedirectAfterAuth') || '/';
      window.location.href = redirectUrl;
    } catch (err) {
      console.error('Error during LinkedIn authentication:', err);
      setError('Failed to authenticate with LinkedIn: ' + err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="linkedin-login-button">
      <button 
        type="button" 
        className="btn btn-linkedin btn-lg"
        onClick={handleLinkedInLogin}
        disabled={isLoading || !linkedInAuthUrl}
        style={{
          backgroundColor: '#0A66C2',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px 16px'
        }}
      >
        {isLoading ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Connecting...
          </>
        ) : (
          <>
            <i className="fab fa-linkedin me-2"></i>
            Connect with LinkedIn
          </>
        )}
      </button>
      
      {error && (
        <div className="alert alert-danger mt-2" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}
    </div>
  );
};

export default LinkedInLoginButton;