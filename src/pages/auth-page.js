import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FacebookLoginButton from '../components/FacebookLoginButton';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: ''
  });
  const [status, setStatus] = useState({
    message: '',
    type: '' // 'success' or 'error'
  });
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login, register, user, error: authError, loginWithSocial } = useAuth();
  
  // Facebook login function
  const loginWithFacebook = async (userData) => {
    console.log('Processing Facebook login with:', userData);
    return await loginWithSocial(userData, 'facebook');
  };
  
  // Redirect to contacts page if already logged in
  useEffect(() => {
    if (user) {
      navigate('/contacts');
    }
  }, [user, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let success;
      
      if (isLogin) {
        // Login
        console.log('Logging in with:', formData);
        success = await login(formData);
      } else {
        // Register
        console.log('Registering with:', formData);
        success = await register(formData);
      }
      
      if (success) {
        setStatus({
          message: isLogin ? 'Login successful!' : 'Registration successful!',
          type: 'success'
        });
        
        // On successful auth, redirect to contacts page
        setTimeout(() => {
          navigate('/contacts');
        }, 1500);
      } else {
        // If login/register return false but no error was thrown
        setStatus({
          message: authError || 'Authentication failed. Please try again.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Auth error:', error);
      
      setStatus({
        message: error.message || 'An error occurred. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setStatus({ message: '', type: '' });
  };

  // For testing purposes, create a function to use test data
  const useTestCredentials = () => {
    setFormData({
      username: 'testuser',
      password: 'password123',
      email: 'test@example.com'
    });
  };

  return (
    <div className="auth-section">
      <div className="app-header">
        <div className="app-logo">
          <img src="/images/beelogo-actual.svg" alt="BeeTagged Logo" />
          <h1>BeeTagged</h1>
        </div>
      </div>
      
      {/* Orange hero section at the top - for all screens */}
      <div className="auth-hero-section" style={{
        background: 'linear-gradient(135deg, var(--bee-gold), var(--bee-yellow))',
        padding: '40px 20px',
        color: 'white',
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        <img 
          src="/images/diago-bee.svg" 
          alt="BeeTagged Mascot" 
          style={{ maxWidth: '120px', marginBottom: '10px' }}
        />
        <h2>Organize Your Network</h2>
        <p>
          BeeTagged helps you manage your contacts with intelligent 
          tagging and social network integration.
        </p>
      </div>
      
      <div className="auth-container" style={{ flexDirection: 'column' }}>
        <div className="auth-form" style={{ maxWidth: '500px', margin: '0 auto', width: '100%' }}>
          <h2>{isLogin ? 'Login to Your Account' : 'Create an Account'}</h2>
          <p>Welcome to BeeTagged, your personal contact management platform.</p>
          
          <FacebookLoginButton 
            onSuccess={async (userData) => {
              try {
                setLoading(true);
                await loginWithFacebook(userData);
                setStatus({
                  message: `Welcome, ${userData.name}!`,
                  type: 'success'
                });
                setTimeout(() => navigate('/contacts'), 1500);
              } catch (error) {
                console.error('Facebook login error:', error);
                setStatus({
                  message: error.message || 'Facebook login failed',
                  type: 'error'
                });
              } finally {
                setLoading(false);
              }
            }} 
            onError={(error) => {
              console.error('Facebook SDK error:', error);
              setStatus({
                message: error.message || 'Facebook login failed',
                type: 'error'
              });
            }}
          />
          
          <div className="mt-4">
            <p className="text-center">Or use email and password</p>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input 
                  type="text" 
                  id="username" 
                  name="username" 
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    value={formData.email}
                    onChange={handleInputChange}
                    required={!isLogin}
                  />
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input 
                  type="password" 
                  id="password" 
                  name="password" 
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className="bee-btn"
                style={{ width: '100%' }}
                disabled={loading}
              >
                {loading ? 'Processing...' : isLogin ? 'Login' : 'Register'}
              </button>
              
              {status.message && (
                <div className={`status-box status-${status.type}`}>
                  {status.message}
                </div>
              )}
            </form>
            
            <div className="form-toggle">
              <p>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button type="button" onClick={toggleAuthMode}>
                  {isLogin ? 'Register' : 'Login'}
                </button>
              </p>
            </div>
            
            {/* Test credentials button - for development only */}
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button 
                type="button" 
                onClick={useTestCredentials}
                style={{ 
                  background: '#f0f0f0', 
                  border: '1px solid #ddd',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              >
                Use Test User Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;