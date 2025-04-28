import React, { useEffect } from 'react';

const FacebookLoginButton = ({ onLogin }) => {
  useEffect(() => {
    // Load Facebook SDK
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: window.AppConfig.socialNetworks.facebook.appId, 
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
  }, [onLogin]);

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

  return (
    <button 
      onClick={handleFacebookLogin}
      style={{
        backgroundColor: '#1877F2',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: '10px 20px',
        fontSize: '16px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
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