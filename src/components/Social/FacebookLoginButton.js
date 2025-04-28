import React from 'react';
import PropTypes from 'prop-types';
import { GOLD_BEE_COLOR } from '../../utils/colorUtils';
import './FacebookLoginButton.css';

/**
 * Facebook login button component
 * Based on the iOS ViewController's implementation of Facebook login
 */
const FacebookLoginButton = ({ 
  onClick, 
  isAuthenticating = false,
  className = '',
  ...props 
}) => {
  return (
    <button 
      className={`facebook-login-btn ${className}`}
      onClick={onClick}
      disabled={isAuthenticating}
      {...props}
    >
      <span className="facebook-login-icon">
        <i className="fab fa-facebook-f"></i>
      </span>
      <span className="facebook-login-text">
        {isAuthenticating ? 'Logging in...' : 'Login with Facebook'}
      </span>
    </button>
  );
};

FacebookLoginButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  isAuthenticating: PropTypes.bool,
  className: PropTypes.string,
};

export default FacebookLoginButton;