import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

console.log("BeeTagged app is loading...");
console.log("Root element exists:", document.getElementById('root') !== null);

const container = document.getElementById('root');
if (container) {
  console.log("Root container found, rendering app");
  const root = createRoot(container);
  root.render(<App />);
  console.log("BeeTagged app rendered");
} else {
  console.error("Root element not found!");
}