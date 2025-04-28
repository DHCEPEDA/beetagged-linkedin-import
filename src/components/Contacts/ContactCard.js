import React from 'react';
import PropTypes from 'prop-types';
import TagBadge from '../Tags/TagBadge';
import './ContactCard.css';

/**
 * Contact Card component
 * Based on the iOS ContactsViewController cell implementation
 */
const ContactCard = ({ 
  contact, 
  onClick, 
  showTags = true,
  className = '' 
}) => {
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

  return (
    <div className={`contact-card ${className}`} onClick={onClick}>
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
};

export default ContactCard;