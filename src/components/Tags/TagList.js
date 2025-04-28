import React, { useState } from 'react';
import PropTypes from 'prop-types';
import TagBadge from './TagBadge';
import { getRandomColor } from '../../utils/colorUtils';
import '../../styles/tags.css';

/**
 * Component for displaying and managing a list of tags
 * Based on the iOS implementation's tag management system
 */
const TagList = ({
  tags = [],
  onTagClick,
  onTagDelete,
  onTagAdd,
  allowAddition = true,
  allowDeletion = true,
  className = '',
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  // Handle adding a new tag
  const handleSubmit = (e) => {
    e.preventDefault();
    if (newTagName.trim()) {
      onTagAdd({
        name: newTagName.trim(),
        color: getRandomColor(),
        count: 0,
      });
      setNewTagName('');
      setShowAddForm(false);
    }
  };

  // Handle canceling tag addition
  const handleCancel = () => {
    setNewTagName('');
    setShowAddForm(false);
  };

  return (
    <div className={`tag-list-container ${className}`}>
      <div className="tag-list">
        {tags.map((tag, index) => (
          <TagBadge
            key={`${tag.name}-${index}`}
            name={tag.name}
            count={tag.count}
            color={tag.color}
            onClick={() => onTagClick && onTagClick(tag, index)}
            onDelete={allowDeletion && onTagDelete ? () => onTagDelete(tag, index) : null}
          />
        ))}
        
        {allowAddition && !showAddForm && (
          <button
            type="button"
            className="add-tag-button"
            onClick={() => setShowAddForm(true)}
          >
            + Add Tag
          </button>
        )}
      </div>
      
      {showAddForm && (
        <form className="add-tag-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="add-tag-input"
            placeholder="Enter tag name"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            autoFocus
          />
          <div className="add-tag-actions">
            <button type="submit" className="add-tag-submit">
              Add
            </button>
            <button
              type="button"
              className="add-tag-cancel"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

TagList.propTypes = {
  tags: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      count: PropTypes.number,
      color: PropTypes.string,
    })
  ),
  onTagClick: PropTypes.func,
  onTagDelete: PropTypes.func,
  onTagAdd: PropTypes.func,
  allowAddition: PropTypes.bool,
  allowDeletion: PropTypes.bool,
  className: PropTypes.string,
};

export default TagList;