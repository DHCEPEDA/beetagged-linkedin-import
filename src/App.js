import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate, Link } from 'react-router-dom';
import TestPage from './TestPage';
import LoginPage from './pages/LoginPage';
import AuthPage from './pages/auth-page';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

// Colors from UIColor+Bee.h
const beeYellow = '#FFEC16';
const beeGold = '#FD9E31';

// Simple component for navigation with BeeTagged styling
const NavBar = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{ 
      padding: '15px 20px', 
      background: 'white', 
      marginBottom: '20px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img 
          src="/images/beelogo-actual.svg" 
          alt="BeeTagged Logo" 
          style={{ height: '30px', marginRight: '10px' }}
        />
        <span style={{ 
          fontWeight: 'bold', 
          fontSize: '1.2rem',
          background: `linear-gradient(to right, ${beeGold}, ${beeYellow})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent' 
        }}>
          BeeTagged
        </span>
      </div>
      
      <div>
        <Link 
          to="/" 
          style={{ 
            marginRight: '15px', 
            textDecoration: 'none', 
            color: '#444',
            fontWeight: 'bold'
          }}
        >
          Home
        </Link>
        
        {user ? (
          <>
            <Link 
              to="/contacts" 
              style={{ 
                marginRight: '15px', 
                textDecoration: 'none', 
                color: '#444',
                fontWeight: 'bold'
              }}
            >
              Contacts
            </Link>
            <button 
              onClick={async () => {
                await logout();
                window.location.href = '/auth';
              }}
              style={{
                backgroundColor: '#f8f9fa',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <Link 
            to="/auth" 
            style={{ 
              textDecoration: 'none', 
              color: 'white',
              backgroundColor: beeGold,
              padding: '6px 12px',
              borderRadius: '4px',
              fontWeight: 'bold'
            }}
          >
            Login
          </Link>
        )}
      </div>
    </div>
  );
};

// We're now using the imported ProtectedRoute component

// AppContent component that uses the AuthContext
const AppContent = () => {
  return (
    <div className="app">
      <NavBar />
      <Routes>
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/test" element={<TestPage />} />
        <Route 
          path="/contacts" 
          element={
            <ProtectedRoute>
              <div>Contacts Page (Coming Soon)</div>
            </ProtectedRoute>
          } 
        />
        <Route path="/facebook-diagnostic" element={<Navigate to="/server-auth.html" replace />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </div>
  );
};

// Wrap the app with AuthProvider
const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;