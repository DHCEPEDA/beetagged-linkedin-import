import React, { useState, useEffect, useContext } from 'react';
import { ContactContext } from '../../context/ContactContext';

const TAG_COLORS = [
  '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
  '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
  '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
  '#ff5722', '#795548', '#607d8b'
];

const TagManager = ({ selectable = false, selectedTags = [], onTagSelect = () => {} }) => {
  const { tags, loading, error, getTags, createTag, updateTag, deleteTag } = useContext(ContactContext);
  
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [editingTag, setEditingTag] = useState(null);
  const [editTagName, setEditTagName] = useState('');
  const [editTagColor, setEditTagColor] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [editShowColorPicker, setEditShowColorPicker] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  useEffect(() => {
    getTags();
  }, [getTags]);

  const handleCreateTag = async (e) => {
    e.preventDefault();
    if (newTagName.trim() === '') return;
    
    try {
      await createTag({
        name: newTagName.trim(),
        color: newTagColor
      });
      setNewTagName('');
      setShowColorPicker(false);
    } catch (err) {
      console.error('Failed to create tag:', err);
    }
  };

  const handleUpdateTag = async (e) => {
    e.preventDefault();
    if (!editingTag || editTagName.trim() === '') return;
    
    try {
      await updateTag(editingTag.id, {
        name: editTagName.trim(),
        color: editTagColor
      });
      setEditingTag(null);
    } catch (err) {
      console.error('Failed to update tag:', err);
    }
  };

  const handleDeleteTag = async (tagId) => {
    try {
      await deleteTag(tagId);
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete tag:', err);
    }
  };

  const startEditing = (tag) => {
    setEditingTag(tag);
    setEditTagName(tag.name);
    setEditTagColor(tag.color);
  };

  const cancelEditing = () => {
    setEditingTag(null);
    setEditShowColorPicker(false);
  };

  if (loading && !tags) {
    return (
      <div className="text-center my-3">
        <div className="spinner-border spinner-border-sm text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error && !tags) {
    return (
      <div className="alert alert-danger" role="alert">
        Error loading tags: {error}
      </div>
    );
  }

  return (
    <div className="tag-manager">
      {!selectable && (
        <h4 className="mb-3">Manage Tags</h4>
      )}
      
      {!selectable && (
        <div className="card mb-4">
          <div className="card-body">
            <form onSubmit={handleCreateTag}>
              <div className="row align-items-end">
                <div className="col">
                  <label htmlFor="newTagName" className="form-label">Tag Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="newTagName"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Enter tag name"
                    required
                  />
                </div>
                <div className="col-auto">
                  <label htmlFor="newTagColor" className="form-label">Color</label>
                  <div className="input-group">
                    <span 
                      className="input-group-text"
                      style={{ 
                        backgroundColor: newTagColor,
                        width: '40px',
                        cursor: 'pointer'
                      }}
                      onClick={() => setShowColorPicker(!showColorPicker)}
                    ></span>
                    <input
                      type="text"
                      className="form-control"
                      id="newTagColor"
                      value={newTagColor}
                      onChange={(e) => setNewTagColor(e.target.value)}
                      readOnly
                    />
                  </div>
                  {showColorPicker && (
                    <div className="color-picker-container mt-2 p-2 border rounded">
                      <div className="d-flex flex-wrap">
                        {TAG_COLORS.map(color => (
                          <div 
                            key={color}
                            className="color-option m-1 border"
                            style={{ 
                              backgroundColor: color,
                              width: '25px',
                              height: '25px',
                              cursor: 'pointer',
                              borderRadius: '4px',
                              border: newTagColor === color ? '2px solid black' : '1px solid #dee2e6'
                            }}
                            onClick={() => {
                              setNewTagColor(color);
                              setShowColorPicker(false);
                            }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="col-auto">
                  <button type="submit" className="btn btn-primary">
                    <i className="fas fa-plus me-2"></i>Add Tag
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <div className="row">
        {tags && tags.length > 0 ? (
          <div className="col">
            <div className={selectable ? 'd-flex flex-wrap' : 'list-group'}>
              {tags.map(tag => (
                editingTag && editingTag.id === tag.id ? (
                  <div className="list-group-item" key={tag.id}>
                    <form onSubmit={handleUpdateTag}>
                      <div className="row align-items-center">
                        <div className="col">
                          <input
                            type="text"
                            className="form-control"
                            value={editTagName}
                            onChange={(e) => setEditTagName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="col-auto">
                          <div className="input-group">
                            <span 
                              className="input-group-text"
                              style={{ 
                                backgroundColor: editTagColor,
                                width: '40px',
                                cursor: 'pointer'
                              }}
                              onClick={() => setEditShowColorPicker(!editShowColorPicker)}
                            ></span>
                            <input
                              type="text"
                              className="form-control"
                              value={editTagColor}
                              onChange={(e) => setEditTagColor(e.target.value)}
                              readOnly
                              style={{ width: '100px' }}
                            />
                          </div>
                          {editShowColorPicker && (
                            <div className="color-picker-container mt-2 p-2 border rounded position-absolute" style={{ zIndex: 1000 }}>
                              <div className="d-flex flex-wrap">
                                {TAG_COLORS.map(color => (
                                  <div 
                                    key={color}
                                    className="color-option m-1 border"
                                    style={{ 
                                      backgroundColor: color,
                                      width: '25px',
                                      height: '25px',
                                      cursor: 'pointer',
                                      borderRadius: '4px',
                                      border: editTagColor === color ? '2px solid black' : '1px solid #dee2e6'
                                    }}
                                    onClick={() => {
                                      setEditTagColor(color);
                                      setEditShowColorPicker(false);
                                    }}
                                  ></div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="col-auto">
                          <button type="submit" className="btn btn-primary btn-sm me-2">
                            <i className="fas fa-save"></i>
                          </button>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={cancelEditing}>
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                ) : selectable ? (
                  <div 
                    key={tag.id}
                    className="tag m-1 cursor-pointer"
                    style={{ 
                      backgroundColor: selectedTags.includes(tag.id) ? tag.color : tag.color + '20',
                      color: selectedTags.includes(tag.id) ? 'white' : tag.color,
                      border: `1px solid ${tag.color}`
                    }}
                    onClick={() => onTagSelect(tag.id)}
                  >
                    {tag.name}
                    {selectedTags.includes(tag.id) && <i className="fas fa-check ms-1"></i>}
                  </div>
                ) : (
                  <div className="list-group-item d-flex justify-content-between align-items-center" key={tag.id}>
                    <div className="d-flex align-items-center">
                      <span 
                        className="badge rounded-pill me-2"
                        style={{ backgroundColor: tag.color, width: '20px', height: '20px' }}
                      ></span>
                      <span>{tag.name}</span>
                    </div>
                    <div>
                      <button 
                        className="btn btn-outline-primary btn-sm me-2"
                        onClick={() => startEditing(tag)}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => setDeleteConfirm(tag)}
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        ) : (
          <div className="col">
            <div className="alert alert-info">
              No tags found. {!selectable && 'Create your first tag above.'}
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Delete Tag</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setDeleteConfirm(null)}
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete the tag "<strong>{deleteConfirm.name}</strong>"?</p>
                <p className="text-danger">This will remove this tag from all contacts.</p>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setDeleteConfirm(null)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={() => handleDeleteTag(deleteConfirm.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagManager;
