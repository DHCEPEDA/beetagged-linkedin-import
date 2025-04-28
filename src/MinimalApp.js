import React from 'react';

const MinimalApp = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1 style={{ color: '#FD9E31' }}>BeeTagged Minimal App</h1>
      <p>This is a minimal React app to test rendering from the bundle</p>
      <img 
        src="/images/beelogo-actual.svg" 
        alt="BeeTagged Logo" 
        style={{ width: '150px', height: '150px', margin: '20px auto' }}
      />
      <p>If you can see this, the React bundle is working correctly!</p>
    </div>
  );
};

export default MinimalApp;