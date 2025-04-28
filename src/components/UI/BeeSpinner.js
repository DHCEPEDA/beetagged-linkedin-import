import React from 'react';
import PropTypes from 'prop-types';
import { GOLD_BEE_COLOR } from '../../utils/colorUtils';
import './BeeSpinner.css';

/**
 * Loading spinner component
 * Based on the iOS BASpinner implementation
 */
const BeeSpinner = ({ 
  isLoading = false, 
  color = GOLD_BEE_COLOR,
  size = 'medium',
  fullScreen = false,
  className = '',
  ...props 
}) => {
  if (!isLoading) {
    return null;
  }

  // Determine size class
  const sizeClass = `bee-spinner-${size}`;
  
  // Determine whether it's a full-screen spinner
  const fullScreenClass = fullScreen ? 'bee-spinner-fullscreen' : '';

  return (
    <div className={`bee-spinner-container ${fullScreenClass} ${className}`} {...props}>
      <div 
        className={`bee-spinner ${sizeClass}`}
        style={{ borderTopColor: color }}
      >
        <div className="bee-spinner-orbit">
          <div className="bee-spinner-planet" style={{ backgroundColor: color }}></div>
        </div>
      </div>
    </div>
  );
};

BeeSpinner.propTypes = {
  isLoading: PropTypes.bool,
  color: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  fullScreen: PropTypes.bool,
  className: PropTypes.string,
};

export default BeeSpinner;