import React from 'react';
import { isLightColor } from '../../utils/colorUtils';

/**
 * Reusable tag badge component for displaying tags consistently across the application
 * @param {Object} props - Component props
 * @param {Object} props.tag - The tag object with name, color, etc.
 * @param {Function} props.onClick - Optional click handler
 * @param {boolean} props.removable - Whether to show a remove icon
 * @param {string} props.className - Additional class names
 * @param {Object} props.style - Additional inline styles
 * @param {boolean} props.small - Whether to use a smaller size
 */
const TagBadge = ({ tag, onClick, removable = false, className = '', style = {}, small = false }) => {
  const handleClick = (e) => {
    if (onClick) {
      e.stopPropagation();
      onClick(tag._id);
    }
  };

  return (
    <span
      className={`tag-badge ${className} ${onClick ? 'clickable' : ''} ${small ? 'tag-small' : ''}`}
      style={{
        backgroundColor: tag.color,
        color: isLightColor(tag.color) ? '#000' : '#fff',
        display: 'inline-flex',
        alignItems: 'center',
        padding: small ? '2px 8px' : '4px 12px',
        borderRadius: '16px',
        fontSize: small ? '0.75rem' : '0.875rem',
        margin: '0 4px 4px 0',
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
      onClick={handleClick}
    >
      {tag.name}
      {removable && onClick && (
        <i 
          className="fas fa-times-circle ms-1"
          style={{ marginLeft: '5px' }}
        ></i>
      )}
    </span>
  );
};

export default TagBadge;