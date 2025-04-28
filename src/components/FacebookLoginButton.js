import React, { useEffect, useState } from 'react';

const FacebookLoginButton = ({ onLogin }) => {
  const [appId, setAppId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch the config from the server
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (!response.ok) {
          throw new Error('Failed to fetch config');
        }
        const config = await response.json();
        setAppId(config.socialNetworks.facebook.appId);
        setIsLoading(false);
        
        initFacebook(config.socialNetworks.facebook.appId);
      } catch (err) {
        console.error('Error fetching config:', err);
        setError(err.message);
        setIsLoading(false);
        
        // Try to use the AppConfig fallback if available
        if (window.AppConfig && window.AppConfig.socialNetworks && window.AppConfig.socialNetworks.facebook) {
          initFacebook(window.AppConfig.socialNetworks.facebook.appId);
        }
      }
    };
    
    fetchConfig();
  }, [onLogin]);
  
  const initFacebook = (fbAppId) => {
    if (!fbAppId) {
      console.error('No Facebook App ID available');
      return;
    }
    
    // Load Facebook SDK
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: fbAppId,
        cookie: true,
        xfbml: true,
        version: 'v18.0' // Use latest version
      });
      
      window.FB.AppEvents.logPageView();
      
      // Check login status
      window.FB.getLoginStatus(function(response) {
        console.log('FB login status:', response);
        if (response.status === 'connected') {
          // Already logged in to Facebook and your app
          if (onLogin) onLogin(response);
        }
      });
    };
    
    // Make sure SDK is loaded
    if (window.FB) {
      window.fbAsyncInit();
    }
  };

  const handleFacebookLogin = () => {
    if (!window.FB) {
      console.error('Facebook SDK not loaded');
      return;
    }
    
    window.FB.login(function(response) {
      console.log('FB login response:', response);
      if (response.status === 'connected') {
        // Successfully logged in
        if (onLogin) onLogin(response);
      } else {
        console.log('Facebook login failed or was cancelled');
      }
    }, { scope: 'public_profile,email' });
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '300px',
        margin: '0 auto',
        padding: '10px 20px',
        backgroundColor: '#f0f0f0',
        borderRadius: '4px',
        color: '#666'
      }}>
        <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        Loading Facebook integration...
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '300px',
        margin: '0 auto',
        padding: '10px 20px',
        backgroundColor: '#fff3f3',
        borderRadius: '4px',
        color: '#d32f2f',
        border: '1px solid #ffcdd2'
      }}>
        <i className="fas fa-exclamation-circle me-2"></i>
        Error loading Facebook. Please try again later.
      </div>
    );
  }
  
  return (
    <button 
      onClick={handleFacebookLogin}
      disabled={!appId}
      style={{
        backgroundColor: appId ? '#1877F2' : '#ccc',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: '10px 20px',
        fontSize: '16px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: appId ? 'pointer' : 'not-allowed',
        width: '100%',
        maxWidth: '300px',
        margin: '0 auto'
      }}
    >
      <i 
        className="fab fa-facebook-f" 
        style={{ marginRight: '10px' }}
      ></i>
      Continue with Facebook
    </button>
  );
};

export default FacebookLoginButton;