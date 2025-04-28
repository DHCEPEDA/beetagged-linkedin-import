import React, { useState } from 'react';
import PropTypes from 'prop-types';
import TagBadge from '../Tags/TagBadge';
import TagSelector from '../Tags/TagSelector';
import BeeButton from '../UI/BeeButton';
import './ContactDetail.css';

/**
 * Contact detail component for viewing and editing a single contact
 * Based on iOS ContactViewController implementation
 */
const ContactDetail = ({
  contact,
  availableTags = [],
  onTagsUpdate,
  onClose,
  className = '',
}) => {
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [selectedTags, setSelectedTags] = useState(contact.tags || []);

  // Format displayed name
  const displayName = contact.name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
  
  // Handle saving tags
  const handleSaveTags = () => {
    onTagsUpdate && onTagsUpdate(contact.id, selectedTags);
    setIsEditingTags(false);
  };
  
  // Handle tag selection
  const handleTagSelect = (tag) => {
    setSelectedTags([...selectedTags, tag]);
  };
  
  // Handle tag deselection
  const handleTagDeselect = (tag) => {
    setSelectedTags(selectedTags.filter(t => t.name !== tag.name));
  };
  
  // Handle creating a new tag
  const handleTagCreate = (tag) => {
    // Add to selected tags
    setSelectedTags([...selectedTags, tag]);
  };

  // Group work and education entries
  const renderDetailSection = (title, items, keyField, valueField) => {
    if (!items || items.length === 0) return null;
    
    return (
      <div className="contact-detail-section">
        <h3 className="contact-detail-section-title">{title}</h3>
        <div className="contact-detail-section-content">
          {items.map((item, index) => (
            <div key={`${title}-${index}`} className="contact-detail-item">
              <div className="contact-detail-item-label">{item[keyField]}</div>
              <div className="contact-detail-item-value">{item[valueField]}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`contact-detail ${className}`}>
      <div className="contact-detail-header">
        <button className="contact-detail-back" onClick={onClose}>
          &larr; Back
        </button>
        <h2 className="contact-detail-title">Contact Details</h2>
      </div>
      
      <div className="contact-detail-content">
        <div className="contact-detail-profile">
          <div className="contact-detail-avatar">
            <img 
              src={contact.pictureUrl || '/images/placeholder-avatar.png'} 
              alt={`${displayName}'s avatar`} 
              onError={(e) => {
                e.target.onerror = null; 
                e.target.src = '/images/placeholder-avatar.png';
              }}
            />
          </div>
          
          <div className="contact-detail-info">
            <h1 className="contact-detail-name">{displayName}</h1>
            
            {contact.hometown && (
              <div className="contact-detail-field">
                <span className="contact-detail-field-label">Location:</span>
                <span className="contact-detail-field-value">{contact.hometown}</span>
              </div>
            )}
            
            {contact.gender && (
              <div className="contact-detail-field">
                <span className="contact-detail-field-label">Gender:</span>
                <span className="contact-detail-field-value">{contact.gender}</span>
              </div>
            )}
            
            {contact.relationshipStatus && (
              <div className="contact-detail-field">
                <span className="contact-detail-field-label">Relationship:</span>
                <span className="contact-detail-field-value">{contact.relationshipStatus}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Tags Section */}
        <div className="contact-detail-tags-section">
          <div className="contact-detail-tags-header">
            <h3 className="contact-detail-section-title">Tags</h3>
            {!isEditingTags && (
              <BeeButton onClick={() => setIsEditingTags(true)}>
                Edit Tags
              </BeeButton>
            )}
          </div>
          
          {isEditingTags ? (
            <div className="contact-detail-tags-editor">
              <TagSelector
                availableTags={availableTags}
                selectedTags={selectedTags}
                onTagSelect={handleTagSelect}
                onTagDeselect={handleTagDeselect}
                onTagCreate={handleTagCreate}
                title="Choose Tags"
              />
              <div className="contact-detail-tags-actions">
                <BeeButton onClick={handleSaveTags} variant="primary">
                  Save Tags
                </BeeButton>
                <BeeButton onClick={() => setIsEditingTags(false)} variant="secondary">
                  Cancel
                </BeeButton>
              </div>
            </div>
          ) : (
            <div className="contact-detail-tags">
              {selectedTags.length > 0 ? (
                <div className="contact-detail-tags-list">
                  {selectedTags.map((tag, index) => (
                    <TagBadge
                      key={`tag-${tag.name}-${index}`}
                      name={tag.name}
                      color={tag.color}
                      size="medium"
                    />
                  ))}
                </div>
              ) : (
                <p className="contact-detail-no-tags">
                  No tags assigned. Click "Edit Tags" to add some.
                </p>
              )}
            </div>
          )}
        </div>
        
        {/* Work History */}
        {renderDetailSection(
          'Work History',
          contact.work,
          'employer',
          'position'
        )}
        
        {/* Education */}
        {renderDetailSection(
          'Education',
          contact.education,
          'school',
          'degree'
        )}
        
        {/* Bio/About */}
        {contact.bio && (
          <div className="contact-detail-section">
            <h3 className="contact-detail-section-title">About</h3>
            <div className="contact-detail-bio">
              {contact.bio}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

ContactDetail.propTypes = {
  contact: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    first_name: PropTypes.string,
    last_name: PropTypes.string,
    pictureUrl: PropTypes.string,
    hometown: PropTypes.string,
    gender: PropTypes.string,
    relationshipStatus: PropTypes.string,
    work: PropTypes.array,
    education: PropTypes.array,
    bio: PropTypes.string,
    tags: PropTypes.array,
  }).isRequired,
  availableTags: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      color: PropTypes.string,
      count: PropTypes.number,
    })
  ),
  onTagsUpdate: PropTypes.func,
  onClose: PropTypes.func.isRequired,
  className: PropTypes.string,
};

export default ContactDetail;