import React, { useState } from 'react';
import { lightenColor, darkenColor } from '../../utils/colorUtils';
import TagBadge from './TagBadge';

/**
 * A TagBadge wrapper that adds hover effects
 * @param {Object} props - Component props
 * @param {Object} props.tag - The tag object
 * @param {Function} props.onClick - Click handler function
 * @param {boolean} props.removable - Whether to show the remove icon
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Additional inline styles
 * @param {boolean} props.small - Whether to use the small size
 */
const HoverTagBadge = ({ tag, onClick, removable = false, className = '', style = {}, small = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Get modified styles based on hover state
  const getHoverStyles = () => {
    if (!isHovered) return {};
    
    return {
      backgroundColor: onClick ? lightenColor(tag.color, 10) : tag.color,
      transform: onClick ? 'scale(1.05)' : 'none',
      boxShadow: onClick ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
      transition: 'all 0.2s ease'
    };
  };
  
  return (
    <TagBadge
      tag={tag}
      onClick={onClick}
      removable={removable}
      className={className}
      small={small}
      style={{
        transition: 'all 0.2s ease',
        ...style,
        ...getHoverStyles()
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    />
  );
};

export default HoverTagBadge;