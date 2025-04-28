import React from 'react';
import { createRoot } from 'react-dom/client';

const TestApp = () => {
  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '800px', 
      margin: '40px auto',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <h1>BeeTagger Test Page</h1>
      <p>If you can see this, React is working properly!</p>
      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <img 
          src="/images/bee-logo.svg" 
          alt="Bee Logo" 
          style={{ 
            width: '100px', 
            height: '100px',
            animation: 'float 3s ease-in-out infinite'
          }} 
        />
      </div>
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }
        `}
      </style>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<TestApp />);