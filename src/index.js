import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// For debugging
console.log("React is loading...");
console.log("Root element exists:", document.getElementById('root') !== null);

// Create root using the React 18 API
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);

  // Render our App component with proper routing
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
  console.log("React app rendered");
} else {
  console.error("Root element not found! Cannot mount React application.");
  // Create a backup element if root doesn't exist
  const backupContainer = document.createElement('div');
  backupContainer.id = 'root-backup';
  document.body.appendChild(backupContainer);
  console.log("Created backup container");
  
  const backupRoot = createRoot(backupContainer);
  backupRoot.render(
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>BeeTagged - Fallback Rendering</h1>
      <p>Root element was missing, but React is still working!</p>
    </div>
  );
}