import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BeeButton from '../components/UI/BeeButton';
import BeeSpinner from '../components/UI/BeeSpinner';
import FacebookLoginButton from '../components/Social/FacebookLoginButton';
import { GOLD_BEE_COLOR, YELLOW_BEE_COLOR } from '../utils/colorUtils';
import './LoginPage.css';

/**
 * Login page component for BeeTagger app
 * Based on the original iOS ViewController login implementation
 */
const LoginPage = () => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Handle Facebook login
  const handleFacebookLogin = async () => {
    setIsAuthenticating(true);
    setError(null);
    
    try {
      // Mock authentication for now
      setTimeout(() => {
        // Simulate successful login
        setIsAuthenticating(false);
        navigate('/contacts');
      }, 1500);
      
      // In real implementation, this would call the Facebook login API
      // and then authenticate with our backend
    } catch (err) {
      setError('Failed to authenticate with Facebook. Please try again.');
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-content">
          <div className="login-header">
            <div className="login-logo">
              <img src="/images/beelogo-actual.svg" alt="BeeTagged Logo" />
            </div>
            <h1 className="login-title">BeeTagged</h1>
            <p className="login-subtitle">
              Map, Organize, and Optimize Your Connections
            </p>
          </div>
          
          <div className="login-actions">
            <FacebookLoginButton 
              onClick={handleFacebookLogin}
              isAuthenticating={isAuthenticating}
            />
            
            {error && <div className="login-error">{error}</div>}
            
            {isAuthenticating && (
              <div className="login-loading">
                <BeeSpinner isLoading={true} color={GOLD_BEE_COLOR} />
                <p>Connecting to Facebook...</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="login-hero">
          <div className="login-hero-content">
            <h2>Organize Your Network</h2>
            <ul className="login-features">
              <li>
                <span className="login-feature-icon">✓</span>
                <span>Map contacts to Facebook connections</span>
              </li>
              <li>
                <span className="login-feature-icon">✓</span>
                <span>Categorize contacts with customizable tags</span>
              </li>
              <li>
                <span className="login-feature-icon">✓</span>
                <span>Build affinity groups based on shared interests</span>
              </li>
              <li>
                <span className="login-feature-icon">✓</span>
                <span>Search and filter your network efficiently</span>
              </li>
            </ul>
            
            <div className="login-privacy-note">
              <p>
                BeeTagged only requests permissions necessary for contact mapping.
                We respect your privacy and data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;