import React from 'react';
import { useContacts } from '../../context/ContactContext';
import TagBadge from './TagBadge';
import HoverTagBadge from './HoverTagBadge';
import AvailableTagBadge from './AvailableTagBadge';

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
                <HoverTagBadge
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
          <div className="tags-list">
            {availableTags.map(tag => (
              <AvailableTagBadge
                key={tag._id}
                tag={tag}
                onClick={handleTagClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TagSelector;