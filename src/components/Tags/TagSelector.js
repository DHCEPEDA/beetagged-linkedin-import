import React from 'react';
import { useContacts } from '../../context/ContactContext';
import TagBadge from './TagBadge';

/**
 * TagSelector component allows users to select and deselect tags for contacts.
 * @param {Object} props - Component props
 * @param {Array} props.selectedTags - Array of currently selected tag IDs
 * @param {Function} props.onTagSelect - Function to call when a tag is selected/deselected
 */
const TagSelector = ({ selectedTags = [], onTagSelect }) => {
  const { tags, isLoading } = useContacts();

  const handleTagClick = (tagId) => {
    if (onTagSelect) {
      onTagSelect(tagId);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading tags...</div>;
  }

  if (!tags || tags.length === 0) {
    return (
      <div className="no-tags">
        <p>No tags available. Create tags to categorize your contacts.</p>
      </div>
    );
  }

  // Get applied tags
  const appliedTags = tags.filter(tag => selectedTags.includes(tag._id));
  // Get available tags
  const availableTags = tags.filter(tag => !selectedTags.includes(tag._id));

  return (
    <div className="tag-selector">
      <div className="selected-tags mb-4">
        <h6 className="mb-2">Applied Tags:</h6>
        <div className="tags-container">
          {appliedTags.length === 0 ? (
            <p className="text-muted small">No tags applied to this contact.</p>
          ) : (
            <div className="tags-list">
              {appliedTags.map(tag => (
                <TagBadge
                  key={tag._id}
                  tag={tag}
                  onClick={handleTagClick}
                  removable={true}
                  className="me-2 mb-2"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="available-tags">
        <h6 className="mb-2">Available Tags:</h6>
        {availableTags.length === 0 ? (
          <p className="text-muted small">No more tags available. Create new tags from the Tag Manager.</p>
        ) : (
          <div className="tags-list" style={{ display: 'flex', flexWrap: 'wrap' }}>
            {availableTags.map(tag => (
              <span
                key={tag._id}
                className="available-tag"
                style={{
                  backgroundColor: 'transparent',
                  color: '#333',
                  border: `1px solid ${tag.color}`,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '0.875rem',
                  margin: '0 8px 8px 0'
                }}
                onClick={() => handleTagClick(tag._id)}
              >
                <span 
                  className="tag-color-dot"
                  style={{ 
                    backgroundColor: tag.color,
                    display: 'inline-block',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    marginRight: '5px'
                  }}
                ></span>
                {tag.name}
                <i className="fas fa-plus-circle ms-1"></i>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TagSelector;