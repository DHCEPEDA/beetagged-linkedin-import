import React, { useState } from 'react';
import FacebookLoginButton from './components/FacebookLoginButton';

const MinimalApp = () => {
  const [fbResponse, setFbResponse] = useState(null);

  const handleFacebookLogin = (response) => {
    console.log('Facebook login successful:', response);
    setFbResponse(response);
    
    // Get user profile info
    window.FB.api('/me', { fields: 'name,email,picture' }, function(userData) {
      console.log('User data:', userData);
    });
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1 style={{ color: '#FD9E31' }}>BeeTagged</h1>
      <p>Contact Management Simplified</p>
      
      <img 
        src="/images/beelogo-actual.svg" 
        alt="BeeTagged Logo" 
        style={{ 
          width: '150px', 
          height: '150px', 
          margin: '20px auto',
          animation: 'float 3s ease-in-out infinite'
        }}
      />
      
      <div style={{ maxWidth: '400px', margin: '30px auto', padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h2>Welcome</h2>
        <p>Please login with your Facebook account to access your contacts</p>
        
        <div style={{ marginTop: '20px' }}>
          <FacebookLoginButton onLogin={handleFacebookLogin} />
        </div>
        
        {fbResponse && (
          <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px', textAlign: 'left' }}>
            <h3>Login Successful!</h3>
            <p><strong>Auth Response:</strong></p>
            <pre style={{ overflow: 'auto', maxHeight: '200px' }}>
              {JSON.stringify(fbResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default MinimalApp;