import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

// ProtectedRoute component to protect routes that require authentication
const ProtectedRoute = ({ element }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is authenticated
        const response = await axios.get('/api/user');
        if (response.data) {
          setAuthenticated(true);
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  // If user is authenticated, render the protected component
  // Otherwise, redirect to login page
  return authenticated ? element : <Navigate to="/auth" />;
};

export default ProtectedRoute;