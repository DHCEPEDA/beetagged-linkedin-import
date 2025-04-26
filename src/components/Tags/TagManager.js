import React, { useState } from 'react';
import { useContacts } from '../../context/ContactContext';

const TagManager = () => {
  const { tags, createTag, deleteTag, isLoading, error } = useContacts();
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3867d6'); // Default color (secondary)
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newTagName.trim()) {
      return;
    }
    
    await createTag({ 
      name: newTagName.trim(),
      color: newTagColor
    });
    
    // Reset form
    setNewTagName('');
  };
  
  const handleDeleteTag = async (tagId) => {
    if (window.confirm('Are you sure you want to delete this tag? This cannot be undone.')) {
      await deleteTag(tagId);
    }
  };
  
  return (
    <div className="tags-page">
      <h1 className="mb-4">Manage Tags</h1>
      
      {error && (
        <div className="alert alert-danger mb-4" role="alert">
          {error}
        </div>
      )}
      
      <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
        {/* Add new tag */}
        <div className="card" style={{ flexBasis: '350px' }}>
          <h3 className="mb-3">Add New Tag</h3>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="tagName" className="form-label">Tag Name</label>
              <input
                type="text"
                id="tagName"
                className="form-control"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="e.g., Work, Family, Marketing"
                disabled={isLoading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="tagColor" className="form-label">Tag Color</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  id="tagColor"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  style={{ 
                    width: '40px', 
                    height: '40px',
                    padding: '2px',
                    borderRadius: 'var(--border-radius-sm)',
                    cursor: 'pointer',
                    border: '1px solid var(--gray)'
                  }}
                  disabled={isLoading}
                />
                <div 
                  className="tag" 
                  style={{ 
                    backgroundColor: newTagColor,
                    color: isLightColor(newTagColor) ? '#000' : '#fff'
                  }}
                >
                  Preview
                </div>
              </div>
            </div>
            
            <button
              type="submit"
              className="btn btn-primary mt-3 w-100"
              disabled={isLoading || !newTagName.trim()}
            >
              {isLoading ? 'Adding Tag...' : 'Add Tag'}
            </button>
          </form>
        </div>
        
        {/* Existing tags */}
        <div className="card" style={{ flexBasis: '350px', flexGrow: 1 }}>
          <h3 className="mb-3">Your Tags</h3>
          
          {tags.length === 0 ? (
            <p>You haven't created any tags yet. Tags help you categorize your contacts.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {tags.map(tag => (
                <li 
                  key={tag._id} 
                  className="flex justify-between items-center mb-2 p-2"
                  style={{
                    borderRadius: 'var(--border-radius-sm)',
                    border: '1px solid var(--gray)'
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      style={{ 
                        width: '16px', 
                        height: '16px', 
                        backgroundColor: tag.color || '#3867d6',
                        borderRadius: '50%'
                      }}
                    ></div>
                    <span>{tag.name}</span>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteTag(tag._id)}
                    className="btn-sm"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--danger)',
                      cursor: 'pointer'
                    }}
                    disabled={isLoading}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      {/* Tag Usage Information */}
      <div className="card mt-4">
        <h3 className="mb-3">Using Tags</h3>
        <p>
          Tags help you organize and filter your contacts based on shared interests, 
          industries, expertise, or any other category that makes sense for your network.
        </p>
        <h4 className="mt-3">Benefits of tagging:</h4>
        <ul>
          <li>Quickly filter contacts with similar interests</li>
          <li>Create affinity groups based on shared tags</li>
          <li>Easily find the right person when you need a specific expertise</li>
          <li>Identify networking opportunities between contacts</li>
        </ul>
      </div>
    </div>
  );
};

// Helper function to determine if a color is light or dark
// to ensure text remains readable on colored backgrounds
const isLightColor = (color) => {
  // Convert hex to RGB
  let r, g, b;
  
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  } else {
    // For named colors or rgb format, default to dark text
    return false;
  }
  
  // Calculate perceived brightness using the YIQ formula
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq >= 128; // >= 128 is light, < 128 is dark
};

export default TagManager;