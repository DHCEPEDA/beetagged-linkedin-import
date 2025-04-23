import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { ContactContext } from '../../context/ContactContext';
import SearchBar from '../Search/SearchBar';

const AffinityGroups = () => {
  const { 
    groups, 
    loading, 
    error, 
    getGroups, 
    createGroup, 
    deleteGroup 
  } = useContext(ContactContext);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupData, setNewGroupData] = useState({
    name: '',
    description: '',
    tagIds: []
  });
  const [availableTags, setAvailableTags] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  useEffect(() => {
    getGroups();
  }, [getGroups]);
  
  useEffect(() => {
    if (groups) {
      let filtered = [...groups];
      
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(group => 
          group.name.toLowerCase().includes(term) || 
          group.description.toLowerCase().includes(term) ||
          group.tags.some(tag => tag.name.toLowerCase().includes(term))
        );
      }
      
      setFilteredGroups(filtered);
    }
  }, [groups, searchTerm]);

  const { tags, getTags } = useContext(ContactContext);
  
  useEffect(() => {
    getTags();
  }, [getTags]);
  
  useEffect(() => {
    if (tags) {
      setAvailableTags(tags);
    }
  }, [tags]);

  const handleInputChange = (e) => {
    setNewGroupData({
      ...newGroupData,
      [e.target.name]: e.target.value
    });
  };

  const handleTagToggle = (tagId) => {
    if (newGroupData.tagIds.includes(tagId)) {
      setNewGroupData({
        ...newGroupData,
        tagIds: newGroupData.tagIds.filter(id => id !== tagId)
      });
    } else {
      setNewGroupData({
        ...newGroupData,
        tagIds: [...newGroupData.tagIds, tagId]
      });
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (newGroupData.name.trim() === '') return;
    
    setIsCreating(true);
    
    try {
      await createGroup(newGroupData);
      setShowCreateModal(false);
      setNewGroupData({
        name: '',
        description: '',
        tagIds: []
      });
    } catch (err) {
      console.error('Failed to create group:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      await deleteGroup(groupId);
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete group:', err);
    }
  };

  if (loading && !groups) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error && !groups) {
    return (
      <div className="alert alert-danger" role="alert">
        Error loading groups: {error}
      </div>
    );
  }

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Affinity Groups</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <i className="fas fa-plus me-2"></i>Create Group
        </button>
      </div>

      <SearchBar onSearch={handleSearch} />

      {filteredGroups.length === 0 ? (
        <div className="text-center my-5">
          <div className="mb-3">
            <i className="fas fa-users fa-3x text-secondary"></i>
          </div>
          <h3>No groups found</h3>
          <p className="text-muted">
            {groups && groups.length > 0 
              ? 'Try adjusting your search filters' 
              : 'Create your first affinity group to get started'
            }
          </p>
          {groups && groups.length === 0 && (
            <button 
              className="btn btn-primary mt-2"
              onClick={() => setShowCreateModal(true)}
            >
              <i className="fas fa-plus me-2"></i>Create Group
            </button>
          )}
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {filteredGroups.map(group => (
            <div className="col" key={group.id}>
              <div className="card group-card h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="group-title">{group.name}</h5>
                    <div className="dropdown">
                      <button 
                        className="btn btn-sm btn-outline-secondary"
                        type="button"
                        id={`group-${group.id}-dropdown`}
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        <i className="fas fa-ellipsis-v"></i>
                      </button>
                      <ul className="dropdown-menu" aria-labelledby={`group-${group.id}-dropdown`}>
                        <li>
                          <Link 
                            to={`/groups/${group.id}`} 
                            className="dropdown-item"
                          >
                            <i className="fas fa-eye me-2"></i>View
                          </Link>
                        </li>
                        <li><hr className="dropdown-divider" /></li>
                        <li>
                          <button 
                            className="dropdown-item text-danger"
                            onClick={() => setDeleteConfirm(group)}
                          >
                            <i className="fas fa-trash-alt me-2"></i>Delete
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <p className="text-muted mb-3">{group.description}</p>
                  
                  <div className="mb-3">
                    <p className="group-member-count">
                      <i className="fas fa-user me-2"></i>
                      {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                    </p>
                  </div>
                  
                  <div className="mb-2">
                    {group.tags.slice(0, 3).map(tag => (
                      <span 
                        key={tag.id} 
                        className="tag"
                        style={{ backgroundColor: tag.color + '20', color: tag.color }}
                      >
                        {tag.name}
                      </span>
                    ))}
                    {group.tags.length > 3 && (
                      <span className="text-muted small">
                        +{group.tags.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                <div className="card-footer bg-transparent">
                  <Link 
                    to={`/groups/${group.id}`} 
                    className="btn btn-outline-primary w-100"
                  >
                    View Group
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create group modal */}
      {showCreateModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create Affinity Group</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowCreateModal(false)}
                  disabled={isCreating}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleCreateGroup}>
                  <div className="mb-3">
                    <label htmlFor="groupName" className="form-label">Group Name</label>
                    <input
                      type="text"
                      className="form-control"
                      id="groupName"
                      name="name"
                      value={newGroupData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="groupDescription" className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      id="groupDescription"
                      name="description"
                      rows="3"
                      value={newGroupData.description}
                      onChange={handleInputChange}
                    ></textarea>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Select Tags for Group</label>
                    <p className="text-muted small">
                      Contacts with these tags will be added to the group
                    </p>
                    <div className="d-flex flex-wrap">
                      {availableTags.map(tag => (
                        <div 
                          key={tag.id}
                          className="tag m-1 cursor-pointer"
                          style={{ 
                            backgroundColor: newGroupData.tagIds.includes(tag.id) ? tag.color : tag.color + '20',
                            color: newGroupData.tagIds.includes(tag.id) ? 'white' : tag.color,
                            border: `1px solid ${tag.color}`
                          }}
                          onClick={() => handleTagToggle(tag.id)}
                        >
                          {tag.name}
                          {newGroupData.tagIds.includes(tag.id) && <i className="fas fa-check ms-1"></i>}
                        </div>
                      ))}
                    </div>
                    {availableTags.length === 0 && (
                      <div className="alert alert-warning">
                        No tags available. Please create tags first.
                      </div>
                    )}
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowCreateModal(false)}
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleCreateGroup}
                  disabled={isCreating || newGroupData.name.trim() === '' || newGroupData.tagIds.length === 0}
                >
                  {isCreating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Creating...
                    </>
                  ) : (
                    'Create Group'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Delete Group</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setDeleteConfirm(null)}
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete the group "<strong>{deleteConfirm.name}</strong>"?</p>
                <p className="text-danger">This will remove the group, but not the contacts within it.</p>
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
                  onClick={() => handleDeleteGroup(deleteConfirm.id)}
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

export default AffinityGroups;
