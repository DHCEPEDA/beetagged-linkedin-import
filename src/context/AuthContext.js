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
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Get current user
        const res = await axios.get('/api/auth/me');
        
        if (res.data.success) {
          setUser(res.data.data);
        } else {
          // Clear token if invalid
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        }
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
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
      const res = await axios.post('/api/auth/register', userData);
      
      if (res.data.success) {
        // Save token and set user data
        localStorage.setItem('token', res.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        setUser(res.data.user);
        setError(null);
        return true;
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const res = await axios.post('/api/auth/login', { email, password });
      
      if (res.data.success) {
        // Save token and set user data
        localStorage.setItem('token', res.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        setUser(res.data.user);
        setError(null);
        return true;
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  // Facebook login
  const loginWithFacebook = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
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
              // Get Facebook access token
              const accessToken = response.authResponse.accessToken;
              
              // Send token to the backend
              const res = await axios.post('/api/auth/facebook', { accessToken });
              
              if (res.data.success) {
                // Save token and set user data
                localStorage.setItem('token', res.data.token);
                axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
                setUser(res.data.user);
                resolve(res.data.user);
              } else {
                reject(new Error(res.data.message || 'Facebook authentication failed'));
                setError(res.data.message || 'Facebook authentication failed');
              }
            } catch (error) {
              reject(error);
              setError(error.response?.data?.message || 'Facebook authentication failed');
            }
          } else {
            reject(new Error('User cancelled login or did not fully authorize'));
            setError('Facebook login was cancelled or not authorized');
          }
          
          setIsLoading(false);
        }, { scope: 'email,public_profile,user_friends' });
      });
    } catch (error) {
      setIsLoading(false);
      setError(error.message || 'Facebook login failed');
      throw error;
    }
  };

  // LinkedIn login - to be implemented later

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        register,
        login,
        logout,
        loginWithFacebook
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