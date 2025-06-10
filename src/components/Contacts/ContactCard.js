import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import TagBadge from '../Tags/TagBadge';
import './ContactCard.css';

/**
 * Contact Card component with micro-interactions
 * Based on the iOS ContactsViewController cell implementation
 */
const ContactCard = ({ 
  contact, 
  onClick, 
  showTags = true,
  className = '',
  expandable = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { 
    name, 
    first_name, 
    last_name, 
    pictureUrl, 
    hometown, 
    work = [], 
    education = [],
    tags = [] 
  } = contact;

  // Format displayed name
  const displayName = name || `${first_name || ''} ${last_name || ''}`.trim();
  
  // Get current employer if available
  const currentEmployer = work && work.length > 0 
    ? work[0].employer || work[0].position || '' 
    : '';
  
  // Get most recent education if available
  const recentEducation = education && education.length > 0 
    ? education[0].school || '' 
    : '';

  // Handle expand toggle
  const handleExpand = useCallback((e) => {
    if (expandable) {
      e.stopPropagation();
      setIsExpanded(!isExpanded);
    }
  }, [expandable, isExpanded]);

  // Handle card click
  const handleCardClick = useCallback((e) => {
    if (expandable && !isExpanded) {
      handleExpand(e);
    } else if (onClick) {
      onClick(e);
    }
  }, [expandable, isExpanded, handleExpand, onClick]);

  // Card class names
  const cardClasses = [
    'contact-card',
    className,
    isExpanded ? 'expanded' : '',
    expandable ? 'expandable' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} onClick={handleCardClick}>
      <div className="contact-card-avatar">
        <img 
          src={pictureUrl || '/images/placeholder-avatar.png'} 
          alt={`${displayName}'s avatar`} 
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/images/placeholder-avatar.png';
          }}
        />
      </div>
      
      <div className="contact-card-details">
        <h3 className="contact-card-name">{displayName}</h3>
        
        {hometown && (
          <div className="contact-card-info">
            <span className="contact-card-label">Location:</span>
            <span className="contact-card-value">{hometown}</span>
          </div>
        )}
        
        {currentEmployer && (
          <div className="contact-card-info">
            <span className="contact-card-label">Work:</span>
            <span className="contact-card-value">{currentEmployer}</span>
          </div>
        )}
        
        {recentEducation && (
          <div className="contact-card-info">
            <span className="contact-card-label">Education:</span>
            <span className="contact-card-value">{recentEducation}</span>
          </div>
        )}
        
        {showTags && tags && tags.length > 0 && (
          <div className="contact-card-tags">
            {tags.map((tag, index) => (
              <TagBadge
                key={`${tag.name}-${index}`}
                name={tag.name}
                color={tag.color}
                size="small"
              />
            ))}
          </div>
        )}
        
        {/* Expand indicator for expandable cards */}
        {expandable && (
          <div className="contact-card-expand-indicator">
            <span className={`expand-arrow ${isExpanded ? 'expanded' : ''}`}>
              ▼
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

ContactCard.propTypes = {
  contact: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    first_name: PropTypes.string,
    last_name: PropTypes.string,
    pictureUrl: PropTypes.string,
    hometown: PropTypes.string,
    work: PropTypes.array,
    education: PropTypes.array,
    tags: PropTypes.array,
  }).isRequired,
  onClick: PropTypes.func,
  showTags: PropTypes.bool,
  className: PropTypes.string,
  expandable: PropTypes.bool,
};

export default ContactCard;