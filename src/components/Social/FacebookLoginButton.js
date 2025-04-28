import React, { useEffect, useState } from 'react';
import { socialAuth } from '../../utils/socialAuth';

/**
 * Facebook login button component that integrates with Facebook SDK
 * and handles the login process
 */
const FacebookLoginButton = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);

  // Initialize Facebook SDK
  useEffect(() => {
    // Initialize Facebook SDK when it's loaded
    if (window.FB) {
      window.FB.init({
        appId: '123456789012345', // This will be replaced with your actual app ID
        cookie: true,
        xfbml: true,
        version: 'v16.0'
      });
      
      setIsSdkLoaded(true);
    } else {
      // If FB SDK is not loaded yet, set up a callback
      window.fbAsyncInit = function() {
        window.FB.init({
          appId: '123456789012345', // This will be replaced with your actual app ID
          cookie: true,
          xfbml: true,
          version: 'v16.0'
        });
        
        setIsSdkLoaded(true);
      };
    }
  }, []);

  const handleFacebookLogin = async () => {
    if (!isSdkLoaded) {
      setError('Facebook SDK not loaded yet. Please try again in a moment.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Request login with Facebook
      window.FB.login(async function(response) {
        if (response.authResponse) {
          const { accessToken, userID } = response.authResponse;
          
          try {
            // Call the API to authenticate with Facebook
            const userData = await socialAuth('facebook', {
              accessToken,
              userID
            });
            
            if (onLogin) {
              onLogin(userData);
            }
          } catch (err) {
            console.error('Error during Facebook authentication:', err);
            setError('Failed to authenticate with our server: ' + err.message);
          }
        } else {
          console.log('User cancelled login or did not fully authorize.');
          setError('Facebook login was cancelled or not authorized.');
        }
        
        setIsLoading(false);
      }, { scope: 'public_profile,email,user_friends' });
    } catch (err) {
      console.error('Error initiating Facebook login:', err);
      setError('Failed to initiate Facebook login: ' + err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="facebook-login-button">
      <button 
        type="button" 
        className="btn btn-facebook btn-lg"
        onClick={handleFacebookLogin}
        disabled={isLoading || !isSdkLoaded}
        style={{
          backgroundColor: '#1877F2',
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
            <i className="fab fa-facebook me-2"></i>
            Connect with Facebook
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

export default FacebookLoginButton;