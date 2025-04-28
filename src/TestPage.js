import React from 'react';

const TestPage = () => {
  const floatingStyle = {
    width: '150px',
    height: '150px',
    margin: '20px auto',
    display: 'block',
    animation: 'float 3s ease-in-out infinite'
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>BeeTagged Test Page</h1>
      <p>If you can see this, React is rendering correctly!</p>
      <img 
        src="/images/beelogo-actual.svg" 
        alt="BeeTagged Logo" 
        style={floatingStyle}
      />
      <p>The logo above should be the DiagoBee SVG with a floating animation.</p>
    </div>
  );
};

export default TestPage;