import React, { createContext, useState, useCallback, useEffect } from 'react';
import { 
  loginUser, 
  registerUser, 
  socialAuth, 
  getCurrentUser 
} from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already authenticated
  const checkAuth = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check for token in localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        return false;
      }
      
      // Verify token with backend
      const userData = await getCurrentUser();
      
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
        setLoading(false);
        return true;
      } else {
        // Invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        return false;
      }
    } catch (err) {
      console.error('Auth check error:', err);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      setUser(null);
      setError('Authentication failed. Please login again.');
      setLoading(false);
      return false;
    }
  }, []);

  // Initialize auth state on app load
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login user with email and password
  const login = async (email, password, socialData = null) => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      if (socialData) {
        // Social login
        response = await socialAuth(socialData.provider, socialData);
      } else {
        // Traditional login
        response = await loginUser(email, password);
      }
      
      const { token, user } = response;
      
      // Save token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      setIsAuthenticated(true);
      setLoading(false);
      
      return user;
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      throw err;
    }
  };

  // Register new user
  const register = async (name, email, password, socialData = null) => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      if (socialData) {
        // Social registration
        response = await socialAuth(socialData.provider, socialData);
      } else {
        // Traditional registration
        response = await registerUser(name, email, password);
      }
      
      const { token, user } = response;
      
      // Save token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      setIsAuthenticated(true);
      setLoading(false);
      
      return user;
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      throw err;
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        error,
        login,
        register,
        logout,
        checkAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
