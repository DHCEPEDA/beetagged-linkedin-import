import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        setIsLoading(true);
        
        // Check if token exists in localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          setIsLoading(false);
          return;
        }
        
        // Set auth token header
        axios.defaults.headers.common['x-auth-token'] = token;
        
        // Get current user
        const res = await axios.get('/api/auth/me');
        
        // If we get a user response, set it
        setUser(res.data);
      } catch (error) {
        console.error('Auth check error:', error);
        // Clear token if invalid
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['x-auth-token'];
        setError('Authentication failed. Please log in again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkLoggedIn();
  }, []);

  // Register user
  const register = async (userData) => {
    try {
      setIsLoading(true);
      console.log('Registering with data:', userData);
      const res = await axios.post('/api/auth/register', userData);
      
      console.log('Register response:', res.data);
      
      // Save token and set user data
      localStorage.setItem('token', res.data.token);
      axios.defaults.headers.common['x-auth-token'] = res.data.token;
      setUser(res.data.user);
      setError(null);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Login user
  const login = async (userData) => {
    try {
      setIsLoading(true);
      console.log('Logging in with:', userData);
      
      const res = await axios.post('/api/auth/login', userData);
      console.log('Login response:', res.data);
      
      // Save token and set user data
      localStorage.setItem('token', res.data.token);
      axios.defaults.headers.common['x-auth-token'] = res.data.token;
      setUser(res.data.user);
      setError(null);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    try {
      // Call the logout API
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clean up local state regardless of API success
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['x-auth-token'];
      setUser(null);
    }
  };

  // Facebook login
  const loginWithFacebook = async (userData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!userData) {
        return new Promise((resolve, reject) => {
          if (!window.FB) {
            reject(new Error('Facebook SDK not loaded'));
            setError('Facebook SDK not loaded. Please refresh and try again.');
            setIsLoading(false);
            return;
          }
          
          window.FB.login(async (response) => {
            if (response.authResponse) {
              try {
                // Get user info
                window.FB.api('/me', { fields: 'id,name,email,picture' }, async function(userData) {
                  try {
                    // Send userData and token to backend
                    const res = await axios.post('/api/auth/facebook', {
                      userData,
                      accessToken: response.authResponse.accessToken
                    });
                    
                    // Save token and set user data
                    localStorage.setItem('token', res.data.token);
                    axios.defaults.headers.common['x-auth-token'] = res.data.token;
                    setUser(res.data.user);
                    resolve(res.data.user);
                  } catch (error) {
                    reject(error);
                    setError(error.response?.data?.message || 'Facebook authentication failed on server');
                  }
                });
              } catch (error) {
                reject(error);
                setError('Failed to get user data from Facebook');
              }
            } else {
              reject(new Error('User cancelled login or did not fully authorize'));
              setError('Facebook login was cancelled or not authorized');
            }
            
            setIsLoading(false);
          }, { scope: 'email,public_profile,user_friends' });
        });
      } else {
        // User data was provided directly, use it
        try {
          const res = await axios.post('/api/auth/facebook', {
            userData,
            accessToken: userData.accessToken
          });
          
          // Save token and set user data
          localStorage.setItem('token', res.data.token);
          axios.defaults.headers.common['x-auth-token'] = res.data.token;
          setUser(res.data.user);
          return res.data.user;
        } catch (error) {
          setError(error.response?.data?.message || 'Facebook authentication failed on server');
          throw error;
        } finally {
          setIsLoading(false);
        }
      }
    } catch (error) {
      setIsLoading(false);
      setError(error.message || 'Facebook login failed');
      throw error;
    }
  };

  // LinkedIn login - to be implemented later
  
  // Generic social login function that routes to appropriate handler
  const loginWithSocial = async (userData, provider) => {
    if (provider === 'facebook') {
      return await loginWithFacebook(userData);
    }
    // Add other social providers here in the future
    throw new Error(`Unsupported social provider: ${provider}`);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        register,
        login,
        logout,
        loginWithFacebook,
        loginWithSocial
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};