import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate, Link } from 'react-router-dom';
import TestPage from './TestPage';
import LoginPage from './pages/LoginPage';
import AuthPage from './pages/auth-page';
import ContactsPage from './pages/ContactsPage';
import ContactDetailPage from './pages/ContactDetailPage';
import SearchPage from './pages/SearchPage';
import RankPage from './pages/RankPage';
import SettingsPage from './pages/SettingsPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

// Colors from UIColor+Bee.h
const beeYellow = '#FFEC16';
const beeGold = '#FD9E31';

// Main navigation with three core buttons: Contact, Search, Rank
const MainNavigation = () => {
  const [activeTab, setActiveTab] = useState('contact');
  
  const navButtons = [
    { id: 'contact', label: 'Contact', path: '/contacts' },
    { id: 'search', label: 'Search', path: '/search' },
    { id: 'rank', label: 'Rank', path: '/rank' }
  ];

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      backgroundColor: 'white',
      borderBottom: '1px solid #e0e0e0',
      padding: '10px 0',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {navButtons.map(button => (
        <Link
          key={button.id}
          to={button.path}
          onClick={() => setActiveTab(button.id)}
          style={{
            padding: '12px 24px',
            margin: '0 5px',
            textDecoration: 'none',
            color: activeTab === button.id ? 'white' : '#666',
            backgroundColor: activeTab === button.id ? beeGold : 'transparent',
            borderRadius: '20px',
            fontWeight: 'bold',
            fontSize: '16px',
            transition: 'all 0.3s ease',
            border: activeTab === button.id ? 'none' : '2px solid #e0e0e0'
          }}
        >
          {button.label}
        </Link>
      ))}
    </div>
  );
};

// Header with logo and user controls
const AppHeader = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{ 
      padding: '15px 20px', 
      background: 'white', 
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
      
      {user && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '15px', color: '#666' }}>
            {user.name || user.email}
          </span>
          <button 
            onClick={async () => {
              await logout();
              window.location.href = '/auth';
            }}
            style={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #ddd',
              padding: '8px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: 'bold',
              color: '#666'
            }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

// We're now using the imported ProtectedRoute component

// AppContent component that uses the AuthContext
const AppContent = () => {
  const { user } = useAuth();

  return (
    <div className="app">
      <AppHeader />
      {user && <MainNavigation />}
      <Routes>
        <Route path="/" element={user ? <Navigate to="/contacts" replace /> : <Navigate to="/auth" replace />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/test" element={<TestPage />} />
        <Route 
          path="/contacts" 
          element={
            <ProtectedRoute>
              <ContactsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/search" 
          element={
            <ProtectedRoute>
              <SearchPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/rank" 
          element={
            <ProtectedRoute>
              <RankPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/contact/:contactId" 
          element={
            <ProtectedRoute>
              <ContactDetailPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <SettingsPage />
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