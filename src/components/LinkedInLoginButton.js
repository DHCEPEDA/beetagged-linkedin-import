import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';

/**
 * LinkedIn Login Button component
 * Supports both client-side and server-side authentication methods
 */
const LinkedInLoginButton = ({ 
  onSuccess, 
  onError, 
  buttonText = "Continue with LinkedIn",
  className = "",
  useServerAuth = false // Use client-side SDK by default
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Client-side SDK initialization
  useEffect(() => {
    if (!useServerAuth) {
      // Load LinkedIn SDK
      const loadLinkedInSDK = () => {
        window.linkedInInit = function() {
          window.IN.init({
            api_key: process.env.LINKEDIN_CLIENT_ID || '867adep5adc22g', // User's client ID
            authorize: true,
            scope: 'r_emailaddress r_liteprofile',
            cookie_name: 'li_at'
          });
        };
        
        // Load the SDK asynchronously
        (function(d, s, id) {
          var js, fjs = d.getElementsByTagName(s)[0];
          if (d.getElementById(id)) return;
          js = d.createElement(s); js.id = id;
          js.src = "https://platform.linkedin.com/in.js?apiKey=867adep5adc22g&onLoad=linkedInInit";
          js.async = true;
          js.defer = true;
          js.text = "api_key: 867adep5adc22g\nonLoad: linkedInInit";
          fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'linkedin-jssdk'));
      };
      
      loadLinkedInSDK();
    }
  }, [useServerAuth]);

  // Handle client-side login with LinkedIn SDK
  const handleClientSideLogin = () => {
    setIsLoading(true);
    setError(null);

    if (!window.IN) {
      setError("LinkedIn SDK not loaded");
      setIsLoading(false);
      if (onError) onError("LinkedIn SDK not loaded");
      return;
    }

    window.IN.User.authorize(() => {
      window.IN.API.Profile("me")
        .fields(["id", "firstName", "lastName", "profilePicture", "emailAddress"])
        .result((response) => {
          setIsLoading(false);
          
          if (response && response.values && response.values[0]) {
            const profileData = response.values[0];
            
            // Format the profile data to match our app's structure
            const userData = {
              id: profileData.id,
              name: `${profileData.firstName.localized.en_US} ${profileData.lastName.localized.en_US}`,
              email: profileData.emailAddress,
              picture: profileData.profilePicture?.displayImage || null,
              provider: 'linkedin'
            };
            
            if (onSuccess) {
              onSuccess(userData);
            }
          } else {
            const errorMsg = "Could not retrieve LinkedIn profile data";
            setError(errorMsg);
            if (onError) onError(errorMsg);
          }
        })
        .error((err) => {
          setIsLoading(false);
          const errorMsg = err.message || "Failed to get LinkedIn profile";
          setError(errorMsg);
          if (onError) onError(errorMsg);
        });
    });
  };

  // Handle server-side authentication flow
  const handleServerSideLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get the LinkedIn authentication URL from our backend
      const response = await axios.get('/api/auth/linkedin/url');
      
      // Redirect to LinkedIn for authentication
      window.location.href = response.data.url;
    } catch (err) {
      setIsLoading(false);
      const errorMsg = err.response?.data?.message || "Failed to start LinkedIn login";
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
        className={`linkedin-login-button ${className}`}
        onClick={handleLogin}
        disabled={isLoading}
        style={{
          backgroundColor: '#0A66C2',
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
          position: 'relative',
          marginTop: '10px',
          transition: 'background-color 0.3s ease'
        }}
      >
        {/* LinkedIn icon */}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          fill="currentColor"
          viewBox="0 0 24 24"
          style={{ marginRight: '8px' }}
        >
          <path d="M20.47,2H3.53A1.45,1.45,0,0,0,2.06,3.43V20.57A1.45,1.45,0,0,0,3.53,22H20.47a1.45,1.45,0,0,0,1.47-1.43V3.43A1.45,1.45,0,0,0,20.47,2ZM8.09,18.74h-3v-9h3ZM6.59,8.48h0a1.56,1.56,0,1,1,0-3.12,1.57,1.57,0,1,1,0,3.12ZM18.91,18.74h-3V13.91c0-1.21-.43-2-1.52-2A1.65,1.65,0,0,0,12.85,13a2,2,0,0,0-.1.73v5h-3s0-8.18,0-9h3V11A3,3,0,0,1,15.46,9.5c2,0,3.45,1.29,3.45,4.06Z" />
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

LinkedInLoginButton.propTypes = {
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
  buttonText: PropTypes.string,
  className: PropTypes.string,
  useServerAuth: PropTypes.bool
};

export default LinkedInLoginButton;