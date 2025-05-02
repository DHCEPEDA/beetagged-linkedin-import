import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';

/**
 * Facebook Login Button component
 * Supports both client-side and server-side authentication methods
 */
const FacebookLoginButton = ({ 
  onSuccess, 
  onError, 
  buttonText = "Continue with Facebook",
  className = "",
  useServerAuth = false // Use client-side SDK by default as server-side auth needs additional setup
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Client-side SDK initialization
  useEffect(() => {
    if (!useServerAuth) {
      // Load Facebook SDK
      const loadFacebookSDK = () => {
        window.fbAsyncInit = function() {
          window.FB.init({
            appId: process.env.FACEBOOK_APP_ID,
            cookie: true,
            xfbml: true,
            version: 'v18.0'
          });
          
          window.FB.getLoginStatus(function(response) {
            console.log('FB login status:', response);
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
      };
      
      loadFacebookSDK();
    }
  }, [useServerAuth]);

  // Handle client-side login with Facebook SDK
  const handleClientSideLogin = () => {
    setIsLoading(true);
    setError(null);

    if (!window.FB) {
      setError("Facebook SDK not loaded");
      setIsLoading(false);
      if (onError) onError("Facebook SDK not loaded");
      return;
    }

    window.FB.login(function(response) {
      setIsLoading(false);
      if (response.status === 'connected') {
        // Get user info
        window.FB.api('/me', { fields: 'id,name,email,picture' }, function(userData) {
          if (onSuccess) {
            onSuccess({
              ...userData,
              accessToken: response.authResponse.accessToken,
              authResponse: response.authResponse
            });
          }
        });
      } else {
        const errorMsg = response.status === 'not_authorized' 
          ? "App authorization denied" 
          : "Facebook login failed";
        setError(errorMsg);
        if (onError) onError(errorMsg);
      }
    }, { scope: 'public_profile,email,user_friends' });
  };

  // Handle server-side authentication flow
  const handleServerSideLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get the Facebook authentication URL from our backend
      const response = await axios.get('/api/auth/facebook/url');
      
      // Redirect to Facebook for authentication
      window.location.href = response.data.url;
    } catch (err) {
      setIsLoading(false);
      const errorMsg = err.response?.data?.message || "Failed to start Facebook login";
      setError(errorMsg);
      if (onError) onError(errorMsg);
    }
  };

  // Handle login based on method
  const handleLogin = () => {
    useServerAuth ? handleServerSideLogin() : handleClientSideLogin();
  };

  return (
    <div>
      <button 
        className={`facebook-login-button ${className}`}
        onClick={handleLogin}
        disabled={isLoading}
        style={{
          backgroundColor: '#1877F2',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '8px 16px',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: isLoading ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          opacity: isLoading ? 0.7 : 1,
          width: '100%',
          position: 'relative'
        }}
      >
        {/* Facebook icon */}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          fill="currentColor"
          viewBox="0 0 24 24"
          style={{ marginRight: '8px' }}
        >
          <path d="M9.19795 21.5H13.198V13.4901H16.8021L17.198 9.50977H13.198V7.5C13.198 6.94772 13.6457 6.5 14.198 6.5H17.198V2.5H14.198C11.4365 2.5 9.19795 4.73858 9.19795 7.5V9.50977H7.19795L6.80206 13.4901H9.19795V21.5Z"/>
        </svg>

        {isLoading ? 'Connecting...' : buttonText}

        {/* Loading spinner overlay */}
        {isLoading && (
          <span 
            style={{
              position: 'absolute',
              right: '12px',
              display: 'block',
              width: '20px',
              height: '20px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '50%',
              borderTopColor: 'white',
              animation: 'spin 1s linear infinite'
            }}
          />
        )}
      </button>

      {error && (
        <div 
          style={{
            color: '#d32f2f',
            fontSize: '14px',
            marginTop: '8px'
          }}
        >
          {error}
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

FacebookLoginButton.propTypes = {
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
  buttonText: PropTypes.string,
  className: PropTypes.string,
  useServerAuth: PropTypes.bool
};

export default FacebookLoginButton;