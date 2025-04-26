import React, { useState, useEffect } from 'react';
import { useContacts } from '../../context/ContactContext';
import TagBadge from './TagBadge';
import TagEditor from './TagEditor';

/**
 * Tag Manager component for creating, editing, and deleting tags
 * @param {Object} props - Component props
 * @param {boolean} props.selectable - Whether tags can be selected
 * @param {Array} props.selectedTags - Array of selected tag IDs
 * @param {Function} props.onTagSelect - Function called when a tag is selected
 */
const TagManager = ({ selectable = false, selectedTags = [], onTagSelect }) => {
  const { tags, deleteTag, getContactsByTag, isLoading } = useContacts();
  const [mode, setMode] = useState('view'); // 'view', 'create', 'edit'
  const [editingTag, setEditingTag] = useState(null);
  const [deleteConfirmTag, setDeleteConfirmTag] = useState(null);
  const [tagUsage, setTagUsage] = useState({});
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);

  // Load tag usage data (number of contacts per tag)
  useEffect(() => {
    const loadTagUsage = async () => {
      if (!tags || tags.length === 0) return;
      
      setIsLoadingUsage(true);
      const usage = {};
      
      try {
        for (const tag of tags) {
          const contacts = await getContactsByTag(tag._id);
          usage[tag._id] = contacts.length;
        }
        
        setTagUsage(usage);
      } catch (err) {
        console.error('Error loading tag usage:', err);
      } finally {
        setIsLoadingUsage(false);
      }
    };
    
    loadTagUsage();
  }, [tags, getContactsByTag]);

  const handleCreateTag = () => {
    setMode('create');
    setEditingTag(null);
  };

  const handleEditTag = (tag) => {
    setMode('edit');
    setEditingTag(tag);
  };

  const handleDeleteTag = (tag) => {
    setDeleteConfirmTag(tag);
  };

  const confirmDeleteTag = async () => {
    if (!deleteConfirmTag) return;
    
    try {
      await deleteTag(deleteConfirmTag._id);
      setDeleteConfirmTag(null);
    } catch (err) {
      console.error('Error deleting tag:', err);
    }
  };

  const handleTagSave = () => {
    setMode('view');
    setEditingTag(null);
  };

  const handleCancel = () => {
    setMode('view');
    setEditingTag(null);
  };

  if (isLoading) {
    return (
      <div className="text-center my-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading tags...</p>
      </div>
    );
  }

  // If we're in create or edit mode, show the editor
  if (mode === 'create' || mode === 'edit') {
    return (
      <TagEditor
        tag={editingTag}
        onSave={handleTagSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="tag-manager">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0">Manage Tags</h5>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleCreateTag}
        >
          <i className="fas fa-plus-circle me-1"></i>
          Create New Tag
        </button>
      </div>
      
      {tags && tags.length > 0 ? (
        <div className="tag-list">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Tag</th>
                  <th>Description</th>
                  <th>Usage</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tags.map(tag => (
                  <tr key={tag._id}>
                    <td>
                      <TagBadge tag={tag} onClick={selectable ? onTagSelect : null} />
                    </td>
                    <td>{tag.description || <span className="text-muted">No description</span>}</td>
                    <td>
                      {isLoadingUsage ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      ) : (
                        <span>{tagUsage[tag._id] || 0} contacts</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-secondary me-2"
                        onClick={() => handleEditTag(tag)}
                        title="Edit tag"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteTag(tag)}
                        title="Delete tag"
                        disabled={tagUsage[tag._id] > 0}
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="alert alert-info" role="alert">
          <p className="mb-2">You don't have any tags yet.</p>
          <p className="mb-0">Tags help you categorize your contacts based on interests, expertise, or connections.</p>
        </div>
      )}
      
      {/* Delete confirmation modal */}
      {deleteConfirmTag && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Delete Tag</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setDeleteConfirmTag(null)}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to delete the tag <TagBadge tag={deleteConfirmTag} />?
                </p>
                {tagUsage[deleteConfirmTag._id] > 0 && (
                  <div className="alert alert-warning" role="alert">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    This tag is used by {tagUsage[deleteConfirmTag._id]} contacts. 
                    Remove the tag from all contacts before deleting it.
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setDeleteConfirmTag(null)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={confirmDeleteTag}
                  disabled={tagUsage[deleteConfirmTag._id] > 0}
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