import React from 'react';
import { createRoot } from 'react-dom/client';

// Very simple React component
const MinimalApp = () => {
  return (
    <div style={{padding: '20px', textAlign: 'center'}}>
      <h1>BeeTagged Minimal Test</h1>
      <p>If you can see this text, React is rendering correctly!</p>
    </div>
  );
};

// Create root using the React 18 API
const container = document.getElementById('root');
const root = createRoot(container);

// Render the minimal app directly
root.render(<MinimalApp />);