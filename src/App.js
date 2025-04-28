import React from 'react';
import { Route, Routes } from 'react-router-dom';
import TestPage from './TestPage';
import './App.css';

const App = () => {
  return (
    <div className="app">
      <TestPage />
    </div>
  );
};

export default App;