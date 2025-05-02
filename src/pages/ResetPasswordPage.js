import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ResetPasswordForm from '../components/ResetPasswordForm';
import { useAuth } from '../context/AuthContext';

/**
 * Reset Password Page
 * Handles password reset requests with token validation
 */
const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Extract token from URL query parameters
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleFinish = () => {
    navigate('/auth');
  };

  return (
    <div className="reset-password-page" style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9f9f9'
    }}>
      <div style={{ 
        width: '100%',
        maxWidth: '900px',
        minHeight: '500px',
        display: 'flex',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        borderRadius: '8px',
        overflow: 'hidden',
        margin: '20px'
      }}>
        {/* Left panel with form */}
        <div style={{ 
          flex: '0 0 50%',
          padding: '40px',
          backgroundColor: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <ResetPasswordForm token={token} onFinish={handleFinish} />
        </div>
        
        {/* Right panel with bee branding */}
        <div style={{ 
          flex: '0 0 50%',
          background: 'linear-gradient(135deg, #FD9E31 0%, #FFEC16 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          padding: '40px',
          textAlign: 'center'
        }}>
          <img 
            src="/images/bee-logo.svg" 
            alt="BeeTagged Logo" 
            style={{ 
              width: '100px',
              height: 'auto',
              marginBottom: '30px'
            }} 
          />
          
          <h1 style={{ marginBottom: '20px', fontSize: '32px' }}>BeeTagged</h1>
          
          <p style={{ 
            fontSize: '16px',
            maxWidth: '300px',
            lineHeight: '1.6'
          }}>
            Your professional network made simple. Create meaningful connections with context and purpose.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;