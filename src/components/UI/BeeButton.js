import React from 'react';
import { GOLD_BEE_COLOR } from '../../utils/colorUtils';
import './BeeButton.css';

/**
 * Button component styled according to the original iOS BeeButton implementation
 * Based on BeeButton.h/m files
 */
const BeeButton = ({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  disabled = false,
  className = '',
  ...props 
}) => {
  // Determine button variant styling
  const variantClass = variant === 'primary' ? 'bee-button-primary' : 'bee-button-secondary';
  
  return (
    <button
      type={type}
      className={`bee-button ${variantClass} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default BeeButton;