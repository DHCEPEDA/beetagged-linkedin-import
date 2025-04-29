import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ProtectedRoute component to protect routes that require authentication
const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  // If user is authenticated, render the children
  // Otherwise, redirect to login page
  return user ? children : <Navigate to="/auth" />;
};

export default ProtectedRoute;