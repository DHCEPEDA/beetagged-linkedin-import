import React from 'react';
import { Route, Routes } from 'react-router-dom';
import TestPage from './TestPage';
import LoginPage from './pages/LoginPage';
import './App.css';

const App = () => {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<TestPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </div>
  );
};

export default App;