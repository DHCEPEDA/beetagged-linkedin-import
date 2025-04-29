import React, { useState, useEffect } from 'react';
import FacebookLoginButton from '../components/FacebookLoginButton';
import axios from 'axios';

/**
 * Login page component for BeeTagged app
 * Based on the original iOS ViewController login implementation
 */
const LoginPage = ({ history }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [authToken, setAuthToken] = useState('');

  // Colors from UIColor+Bee.h
  const beeYellow = '#FFEC16';
  const beeGold = '#FD9E31';

  // Check for authentication on page load
  useEffect(() => {
    // Check if we have a token in localStorage
    const token = localStorage.getItem('authToken');
    if (token) {
      setAuthToken(token);
      fetchUserData(token);
    } else {
      // Check if we're returning from Facebook OAuth redirect
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      
      if (code && state) {
        // Handle Facebook OAuth callback
        handleFacebookCallback(code, state);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  // Handle Facebook OAuth callback
  const handleFacebookCallback = async (code, state) => {
    try {
      // Exchange code for token on the server
      const response = await axios.get(`/api/auth/facebook/callback?code=${code}&state=${state}`);
      const { user, token } = response.data;
      
      setUser(user);
      setAuthToken(token);
      localStorage.setItem('authToken', token);
      
      // Remove the code from URL to prevent issues on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      console.error('Facebook authentication error:', error);
      setErrorMessage('Failed to complete Facebook authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user data with token
  const fetchUserData = async (token) => {
    try {
      const response = await axios.get('/api/auth/me', {
        headers: {
          'x-auth-token': token
        }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      localStorage.removeItem('authToken');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle successful Facebook login
  const handleFacebookSuccess = (userData) => {
    console.log('Facebook login success:', userData);
    setUser(userData);
  };

  // Handle Facebook login error
  const handleFacebookError = (error) => {
    console.error('Facebook login error:', error);
    setErrorMessage(`Facebook login failed: ${error}`);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout', {}, {
        headers: {
          'x-auth-token': authToken
        }
      });
      setUser(null);
      setAuthToken('');
      localStorage.removeItem('authToken');
    } catch (error) {
      console.error('Logout error:', error);
      setErrorMessage('Failed to logout.');
    }
  };

  // Handle test user data request
  const handleGetTestUserData = async () => {
    try {
      const response = await axios.get('/api/auth/test/login');
      const { user, token } = response.data;
      
      setUser(user);
      setAuthToken(token);
      localStorage.setItem('authToken', token);
    } catch (error) {
      console.error('Test login error:', error);
      setErrorMessage('Failed to get test user data.');
    }
  };

  // Handle getting Facebook friends
  const handleGetFriends = async () => {
    try {
      const response = await axios.get('/api/social/facebook/friends', {
        headers: {
          'x-auth-token': authToken
        }
      });
      console.log('Facebook friends:', response.data);
      alert(`Found ${response.data.data?.length || 0} friends that use this app`);
    } catch (error) {
      console.error('Error fetching friends:', error);
      setErrorMessage('Failed to fetch Facebook friends.');
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      backgroundColor: '#f8f9fa'
    }}>
      <div style={{
        padding: '20px',
        maxWidth: '800px',
        width: '100%'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '30px',
          justifyContent: 'center',
          padding: '20px 0'
        }}>
          <img 
            src="/images/beelogo-actual.svg" 
            alt="BeeTagged Logo" 
            style={{ height: '50px', marginRight: '15px' }}
          />
          <h1 style={{ 
            margin: 0, 
            background: `linear-gradient(to right, ${beeGold}, ${beeYellow})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: '2.5rem'
          }}>
            BeeTagged
          </h1>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{
              display: 'inline-block',
              width: '40px',
              height: '40px',
              border: `4px solid ${beeYellow}`,
              borderTopColor: beeGold,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p>Loading...</p>
          </div>
        ) : user ? (
          // Logged in state
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            padding: '30px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '100px',
              height: '100px',
              margin: '0 auto 20px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: `3px solid ${beeGold}`
            }}>
              {user.picture?.data?.url ? (
                <img 
                  src={user.picture.data.url} 
                  alt={user.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#e9ecef',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '40px',
                  color: '#6c757d'
                }}>
                  {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                </div>
              )}
            </div>
            
            <h2 style={{ marginBottom: '5px' }}>Welcome, {user.name}</h2>
            {user.email && <p style={{ color: '#6c757d' }}>{user.email}</p>}
            
            <div style={{ marginTop: '30px' }}>
              <button
                onClick={handleGetFriends}
                style={{
                  backgroundColor: beeGold,
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '10px 20px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                Get Facebook Friends
              </button>
              
              <button
                onClick={handleLogout}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '10px 20px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          // Login state
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              padding: '30px',
              maxWidth: '400px',
              width: '100%',
              textAlign: 'center'
            }}>
              <h2 style={{ marginBottom: '20px' }}>Login to BeeTagged</h2>
              <p style={{ color: '#6c757d', marginBottom: '30px' }}>
                Connect and organize your professional and personal networks
              </p>
              
              <div style={{ marginBottom: '20px', width: '100%' }}>
                <FacebookLoginButton 
                  onSuccess={handleFacebookSuccess}
                  onError={handleFacebookError}
                  useServerAuth={true}
                />
              </div>
              
              {process.env.NODE_ENV !== 'production' && (
                <div style={{ marginTop: '30px', width: '100%' }}>
                  <hr style={{ margin: '20px 0' }} />
                  <h4>Development Options</h4>
                  <button
                    onClick={handleGetTestUserData}
                    style={{
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '10px 20px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    Use Test User Data
                  </button>
                </div>
              )}
              
              {errorMessage && (
                <div style={{
                  color: '#d32f2f',
                  backgroundColor: '#ffebee',
                  padding: '10px',
                  borderRadius: '4px',
                  marginTop: '20px',
                  fontSize: '14px'
                }}>
                  {errorMessage}
                </div>
              )}
            </div>
            
            <div style={{
              marginTop: '30px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              padding: '30px',
              maxWidth: '400px',
              width: '100%'
            }}>
              <h3 style={{ marginBottom: '15px' }}>Why Use BeeTagged?</h3>
              <ul style={{ paddingLeft: '20px', color: '#6c757d' }}>
                <li>Overlay your phone contacts with social connections</li>
                <li>Organize contacts with intelligent tagging</li>
                <li>Create affinity groups based on shared interests</li>
                <li>Enhance your professional networking capabilities</li>
              </ul>
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;