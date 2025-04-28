import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TagBadge from './TagBadge';
import { getRandomColor } from '../../utils/colorUtils';
import '../../styles/tags.css';

/**
 * Component for selecting and managing tags to apply to contacts
 * Based on the iOS BATypeAheadViewController implementation
 */
const TagSelector = ({
  availableTags = [],
  selectedTags = [],
  onTagSelect,
  onTagDeselect,
  onTagCreate,
  title = 'Select Tags',
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTags, setFilteredTags] = useState(availableTags);

  // Filter tags when search query or available tags change
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTags(availableTags);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = availableTags.filter(tag =>
        tag.name.toLowerCase().includes(query)
      );
      setFilteredTags(filtered);
    }
  }, [searchQuery, availableTags]);

  // Handle tag selection
  const handleTagSelect = (tag) => {
    // Check if the tag is already selected
    const isSelected = selectedTags.some(t => t.name === tag.name);
    
    if (isSelected) {
      onTagDeselect && onTagDeselect(tag);
    } else {
      onTagSelect && onTagSelect(tag);
    }
  };

  // Handle creating a new tag
  const handleCreateTag = () => {
    if (searchQuery.trim() && !availableTags.some(t => t.name.toLowerCase() === searchQuery.toLowerCase().trim())) {
      const newTag = {
        name: searchQuery.trim(),
        color: getRandomColor(),
        count: 0,
      };
      
      onTagCreate && onTagCreate(newTag);
      setSearchQuery('');
    }
  };

  return (
    <div className={`tag-selector ${className}`}>
      <div className="tag-selector-header">
        <h3>{title}</h3>
        <div className="tag-search">
          <input
            type="text"
            className="tag-search-input"
            placeholder="Search or create tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Selected Tags Section */}
      {selectedTags.length > 0 && (
        <div className="selected-tags-container">
          <h4>Selected Tags</h4>
          <div className="tag-list">
            {selectedTags.map((tag, index) => (
              <TagBadge
                key={`selected-${tag.name}-${index}`}
                name={tag.name}
                color={tag.color}
                size="medium"
                selected={true}
                onClick={() => handleTagSelect(tag)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Available Tags Section */}
      <div className="available-tags-container">
        <h4>Available Tags</h4>
        {filteredTags.length > 0 ? (
          <div className="tag-list">
            {filteredTags.map((tag, index) => (
              <TagBadge
                key={`available-${tag.name}-${index}`}
                name={tag.name}
                color={tag.color}
                count={tag.count}
                size="medium"
                selected={selectedTags.some(t => t.name === tag.name)}
                onClick={() => handleTagSelect(tag)}
              />
            ))}
          </div>
        ) : (
          <div className="no-tags-message">
            <p>No matching tags found.</p>
            {searchQuery.trim() && (
              <button
                type="button"
                className="add-tag-button"
                onClick={handleCreateTag}
              >
                + Create "{searchQuery.trim()}"
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

TagSelector.propTypes = {
  availableTags: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      count: PropTypes.number,
      color: PropTypes.string,
    })
  ),
  selectedTags: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      count: PropTypes.number,
      color: PropTypes.string,
    })
  ),
  onTagSelect: PropTypes.func,
  onTagDeselect: PropTypes.func,
  onTagCreate: PropTypes.func,
  title: PropTypes.string,
  className: PropTypes.string,
};

export default TagSelector;