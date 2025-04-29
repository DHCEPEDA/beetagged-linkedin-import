import React, { useState, useEffect } from 'react';
import ContactsOverlay from '../components/UI/ContactsOverlay';

// Facebook App ID
const FB_APP_ID = '1222790436230433';

const ContactsOverlayPage = () => {
  const [facebookData, setFacebookData] = useState(null);
  const [status, setStatus] = useState('initial'); // 'initial', 'loading', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');
  
  // Function to get user data from Facebook Graph API using access token
  const getFacebookUserData = async (accessToken) => {
    try {
      // Get user profile data
      const userResponse = await fetch(
        `https://graph.facebook.com/v18.0/me?fields=id,name,email,picture.width(200).height(200)&access_token=${accessToken}`
      );
      
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data from Facebook');
      }
      
      const userData = await userResponse.json();
      
      // Get friends list (may be empty due to permissions)
      const friendsResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/friends?access_token=${accessToken}`
      );
      
      let friends = [];
      if (friendsResponse.ok) {
        const friendsData = await friendsResponse.json();
        friends = friendsData.data || [];
      }
      
      return {
        ...userData,
        friends
      };
    } catch (error) {
      console.error('Error fetching Facebook data:', error);
      throw error;
    }
  };
  
  // Check for access token in URL hash on component mount
  useEffect(() => {
    const checkForAccessToken = async () => {
      // Parse URL hash for access token
      const params = {};
      const hash = window.location.hash.substring(1);
      
      if (!hash) return;
      
      hash.split('&').forEach(part => {
        const [key, value] = part.split('=');
        params[key] = decodeURIComponent(value);
      });
      
      if (params.access_token) {
        setStatus('loading');
        
        try {
          // Get user data with the access token
          const userData = await getFacebookUserData(params.access_token);
          setFacebookData(userData);
          setStatus('success');
          
          // Clear the hash to clean up the URL
          window.history.replaceState(null, null, ' ');
        } catch (error) {
          console.error('Error getting Facebook data:', error);
          setErrorMessage('Error fetching Facebook data: ' + error.message);
          setStatus('error');
        }
      }
    };
    
    checkForAccessToken();
  }, []);
  
  // Handle redirect to Facebook login
  const handleFacebookLogin = () => {
    setStatus('loading');
    setErrorMessage('');
    
    // Construct OAuth URL for redirect
    const redirectUri = window.location.href.split('#')[0]; // Remove any hash
    const oauthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=public_profile,email,user_friends`;
    
    // Redirect to Facebook login
    window.location.href = oauthUrl;
  };
  
  // Handle permission denied for contacts
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
            style={{
              backgroundColor: '#1877F2',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '10px 15px',
              fontWeight: 'bold'
            }}
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
          
          <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
            <p>Current domain: {window.location.hostname}</p>
            <p>App ID: {FB_APP_ID}</p>
          </div>
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