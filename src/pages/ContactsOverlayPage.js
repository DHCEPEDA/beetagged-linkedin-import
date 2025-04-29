import React, { useState, useEffect } from 'react';
import ContactsOverlay from '../components/UI/ContactsOverlay';
import '../components/FacebookLoginButton'; // Import just to make sure it's available

const ContactsOverlayPage = () => {
  const [facebookData, setFacebookData] = useState(null);
  const [status, setStatus] = useState('initial'); // 'initial', 'loading', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');
  
  // Function to initialize Facebook SDK
  const initFacebook = () => {
    return new Promise((resolve, reject) => {
      if (window.FB) {
        resolve();
        return;
      }
      
      window.fbAsyncInit = function() {
        window.FB.init({
          appId: '1222790436230433',
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });
        
        window.FB.AppEvents.logPageView();
        resolve();
      };
      
      // Load the Facebook SDK
      (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s); js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
      
      // If FB SDK fails to load in 10 seconds, reject
      setTimeout(() => {
        if (!window.FB) {
          reject(new Error('Facebook SDK failed to load'));
        }
      }, 10000);
    });
  };
  
  // Function to check Facebook login status
  const checkLoginStatus = () => {
    return new Promise((resolve, reject) => {
      window.FB.getLoginStatus(function(response) {
        console.log('FB login status:', response);
        if (response.status === 'connected') {
          resolve(response.authResponse);
        } else {
          reject(new Error('Not logged in to Facebook'));
        }
      });
    });
  };
  
  // Function to log in to Facebook
  const loginToFacebook = () => {
    return new Promise((resolve, reject) => {
      window.FB.login(function(response) {
        console.log('FB login response:', response);
        if (response.status === 'connected') {
          resolve(response.authResponse);
        } else {
          reject(new Error('Facebook login failed or was cancelled'));
        }
      }, { scope: 'public_profile,email,user_friends' });
    });
  };
  
  // Function to get user data from Facebook
  const getFacebookUserData = (authResponse) => {
    return new Promise((resolve, reject) => {
      window.FB.api(
        '/me',
        { fields: 'id,name,email,picture.width(200).height(200)' },
        function(response) {
          if (!response || response.error) {
            reject(new Error('Failed to get user data from Facebook'));
            return;
          }
          
          // Get friends list
          window.FB.api(
            '/me/friends',
            function(friendsResponse) {
              if (!friendsResponse || friendsResponse.error) {
                // Just resolve with user data if friends list fails
                resolve({ ...response, friends: [] });
                return;
              }
              
              // Add friends list to user data
              resolve({
                ...response,
                friends: friendsResponse.data || []
              });
            }
          );
        }
      );
    });
  };
  
  // Handle Facebook login
  const handleFacebookLogin = async () => {
    setStatus('loading');
    setErrorMessage('');
    
    try {
      // Initialize Facebook SDK
      await initFacebook();
      
      // Check if already logged in
      try {
        const authResponse = await checkLoginStatus();
        const userData = await getFacebookUserData(authResponse);
        setFacebookData(userData);
        setStatus('success');
      } catch (error) {
        // Not logged in, try to login
        const authResponse = await loginToFacebook();
        const userData = await getFacebookUserData(authResponse);
        setFacebookData(userData);
        setStatus('success');
      }
    } catch (error) {
      console.error('Facebook login error:', error);
      setErrorMessage(error.message);
      setStatus('error');
    }
  };
  
  // Handle permission denied
  const handlePermissionDenied = () => {
    setErrorMessage('Contact access permission denied. Please enable contact access to use BeeTagged.');
  };
  
  return (
    <div className="container">
      {status === 'initial' || status === 'error' ? (
        <div className="text-center p-5 bg-white rounded shadow my-5">
          <img 
            src="/images/beelogo-actual.svg" 
            alt="BeeTagged Logo" 
            style={{ width: '150px', marginBottom: '20px' }}
          />
          <h1 className="mb-4">BeeTagged Contact App</h1>
          <p className="mb-4">
            Connect your Facebook account to enhance your contacts with social media data,
            allowing you to better organize and tag your network.
          </p>
          
          {errorMessage && (
            <div className="alert alert-danger" role="alert">
              {errorMessage}
            </div>
          )}
          
          <button 
            className="btn btn-primary btn-lg d-flex align-items-center mx-auto"
            onClick={handleFacebookLogin}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? (
              <>Loading...</>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="me-2" viewBox="0 0 24 24">
                  <path d="M9.19795 21.5H13.198V13.4901H16.8021L17.198 9.50977H13.198V7.5C13.198 6.94772 13.6457 6.5 14.198 6.5H17.198V2.5H14.198C11.4365 2.5 9.19795 4.73858 9.19795 7.5V9.50977H7.19795L6.80206 13.4901H9.19795V21.5Z"/>
                </svg>
                Continue with Facebook
              </>
            )}
          </button>
        </div>
      ) : (
        <ContactsOverlay 
          facebookData={facebookData} 
          onPermissionDenied={handlePermissionDenied} 
        />
      )}
    </div>
  );
};

export default ContactsOverlayPage;