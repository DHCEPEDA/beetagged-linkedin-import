import React, { useState } from 'react';
import { lightenColor } from '../../utils/colorUtils';

/**
 * A component for displaying available (not yet applied) tags
 * @param {Object} props - Component props
 * @param {Object} props.tag - The tag object
 * @param {Function} props.onClick - Click handler function
 */
const AvailableTagBadge = ({ tag, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const handleClick = () => {
    if (onClick) {
      onClick(tag._id);
    }
  };
  
  const getBorderColor = () => {
    return isHovered ? tag.color : `${tag.color}80`; // 80 is 50% opacity in hex
  };
  
  const getBackgroundColor = () => {
    return isHovered ? `${tag.color}20` : 'transparent'; // 20 is 12% opacity in hex
  };
  
  return (
    <span
      className="available-tag"
      style={{
        backgroundColor: getBackgroundColor(),
        color: '#333',
        border: `1px solid ${getBorderColor()}`,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 12px',
        borderRadius: '16px',
        fontSize: '0.875rem',
        margin: '0 8px 8px 0',
        transition: 'all 0.2s ease'
      }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span 
        className="tag-color-dot"
        style={{ 
          backgroundColor: tag.color,
          display: 'inline-block',
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          marginRight: '5px',
          transition: 'transform 0.2s ease',
          transform: isHovered ? 'scale(1.2)' : 'scale(1)'
        }}
      ></span>
      {tag.name}
      <i 
        className="fas fa-plus-circle ms-1"
        style={{
          opacity: isHovered ? 1 : 0.7,
          transition: 'opacity 0.2s ease'
        }}
      ></i>
    </span>
  );
};

export default AvailableTagBadge;