import React from 'react';
import { createRoot } from 'react-dom/client';
import MinimalApp from './MinimalApp';

// For debugging
console.log("Minimal React app is loading...");
console.log("Root element exists:", document.getElementById('root') !== null);

// Create root using the React 18 API
const container = document.getElementById('root');
if (container) {
  console.log("Root container found, rendering minimal app");
  const root = createRoot(container);

  // Render our minimal component without routing or other complexities
  root.render(
    <React.StrictMode>
      <MinimalApp />
    </React.StrictMode>
  );
  console.log("Minimal React app rendered");
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