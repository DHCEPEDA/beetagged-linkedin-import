import React from 'react';
import PropTypes from 'prop-types';
import { isLightColor, GOLD_BEE_COLOR } from '../../utils/colorUtils';
import '../../styles/tags.css';

/**
 * Component to display a single tag badge
 * Based on the iOS TagCell implementation
 */
const TagBadge = ({
  name,
  count,
  color = GOLD_BEE_COLOR,
  size = 'medium',
  selected = false,
  onClick,
  onDelete,
  className = '',
  ...props
}) => {
  // Determine text color based on background color lightness
  const textColor = isLightColor(color) ? '#333333' : '#FFFFFF';
  
  // Size class for the badge
  const sizeClass = `tag-badge-${size}`;
  
  // Apply selected styling
  const selectedClass = selected ? 'selected' : '';
  
  return (
    <div
      className={`tag-badge ${sizeClass} ${selectedClass} ${className}`}
      style={{ backgroundColor: color, color: textColor }}
      onClick={onClick}
      {...props}
    >
      <span className="tag-name">{name}</span>
      
      {count !== undefined && count > 0 && (
        <span className="tag-count">{count}</span>
      )}
      
      {onDelete && (
        <button
          type="button"
          className="tag-delete-button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label={`Remove tag ${name}`}
        >
          &times;
        </button>
      )}
    </div>
  );
};

TagBadge.propTypes = {
  name: PropTypes.string.isRequired,
  count: PropTypes.number,
  color: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  selected: PropTypes.bool,
  onClick: PropTypes.func,
  onDelete: PropTypes.func,
  className: PropTypes.string,
};

export default TagBadge;