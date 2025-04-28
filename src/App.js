import React from 'react';
import { Route, Routes, Navigate, Link } from 'react-router-dom';
import TestPage from './TestPage';
import LoginPage from './pages/LoginPage';
import './App.css';

// Simple component for navigation
const NavBar = () => (
  <div style={{ padding: '10px', background: '#f8f9fa', marginBottom: '20px' }}>
    <Link to="/" style={{ marginRight: '15px' }}>Home</Link>
    <Link to="/login">Login</Link>
  </div>
);

const App = () => {
  return (
    <div className="app">
      <NavBar />
      <Routes>
        <Route path="/" element={<TestPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/contacts" element={<TestPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default App;