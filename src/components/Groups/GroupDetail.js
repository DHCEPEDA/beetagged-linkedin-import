import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ContactContext } from '../../context/ContactContext';
import SearchBar from '../Search/SearchBar';

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    groups, 
    getGroup, 
    updateGroup, 
    getGroupMembers,
    loading, 
    error 
  } = useContext(ContactContext);
  
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tagIds: []
  });
  const [availableTags, setAvailableTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  
  const { tags, getTags } = useContext(ContactContext);
  
  useEffect(() => {
    getGroup(id);
    getGroupMembers(id).then(data => {
      setMembers(data);
      setFilteredMembers(data);
    });
    getTags();
  }, [getGroup, getGroupMembers, getTags, id]);
  
  useEffect(() => {
    if (groups) {
      const foundGroup = groups.find(g => g.id === id);
      if (foundGroup) {
        setGroup(foundGroup);
        setFormData({
          name: foundGroup.name,
          description: foundGroup.description || '',
          tagIds: foundGroup.tags.map(tag => tag.id)
        });
      }
    }
  }, [groups, id]);
  
  useEffect(() => {
    if (tags) {
      setAvailableTags(tags);
    }
  }, [tags]);
  
  useEffect(() => {
    if (members) {
      let filtered = [...members];
      
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(member => 
          member.name.toLowerCase().includes(term) ||
          member.email?.toLowerCase().includes(term) ||
          member.company?.toLowerCase().includes(term) ||
          member.title?.toLowerCase().includes(term)
        );
      }
      
      setFilteredMembers(filtered);
    }
  }, [members, searchTerm]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleTagToggle = (tagId) => {
    if (formData.tagIds.includes(tagId)) {
      setFormData({
        ...formData,
        tagIds: formData.tagIds.filter(id => id !== tagId)
      });
    } else {
      setFormData({
        ...formData,
        tagIds: [...formData.tagIds, tagId]
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateGroup(id, formData);
      setEditing(false);
    } catch (err) {
      console.error('Failed to update group:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  const getRandomColor = (name) => {
    const colors = [
      '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
      '#1abc9c', '#d35400', '#34495e', '#16a085', '#c0392b'
    ];
    
    // Simple hash function for consistent color based on name
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  if (loading && !group) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        Error loading group: {error}
      </div>
    );
  }

  if (!group) {
    return (
      <div className="alert alert-warning" role="alert">
        Group not found.
      </div>
    );
  }

  return (
    <div className="container">
      <div className="mb-4">
        <Link to="/groups" className="btn btn-outline-secondary">
          <i className="fas fa-arrow-left me-2"></i>Back to Groups
        </Link>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start mb-4">
            {!editing ? (
              <div>
                <h2 className="mb-2">{group.name}</h2>
                <p className="text-muted">{group.description}</p>
              </div>
            ) : (
              <div className="w-100">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">Group Name</label>
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      id="description"
                      name="description"
                      rows="3"
                      value={formData.description}
                      onChange={handleInputChange}
                    ></textarea>
                  </div>
                </form>
              </div>
            )}

            <div>
              {!editing ? (
                <div>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setEditing(true)}
                  >
                    <i className="fas fa-edit me-2"></i>Edit
                  </button>
                </div>
              ) : (
                <div>
                  <button 
                    className="btn btn-secondary me-2"
                    onClick={() => setEditing(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>Save
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <h5 className="text-muted mb-2">Group Information</h5>
                <div className="mb-2">
                  <strong><i className="fas fa-user me-2"></i>Members:</strong> {group.memberCount}
                </div>
                <div className="mb-2">
                  <strong><i className="fas fa-calendar-alt me-2"></i>Created:</strong> {new Date(group.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {editing && (
            <div className="mb-4">
              <h5 className="mb-2">Group Tags</h5>
              <p className="text-muted small mb-3">
                Contacts with these tags will be included in this group automatically
              </p>
              <div className="d-flex flex-wrap">
                {availableTags.map(tag => (
                  <div 
                    key={tag.id}
                    className="tag m-1 cursor-pointer"
                    style={{ 
                      backgroundColor: formData.tagIds.includes(tag.id) ? tag.color : tag.color + '20',
                      color: formData.tagIds.includes(tag.id) ? 'white' : tag.color,
                      border: `1px solid ${tag.color}`
                    }}
                    onClick={() => handleTagToggle(tag.id)}
                  >
                    {tag.name}
                    {formData.tagIds.includes(tag.id) && <i className="fas fa-check ms-1"></i>}
                  </div>
                ))}
              </div>
              {availableTags.length === 0 && (
                <div className="alert alert-warning">
                  No tags available. Please create tags first.
                </div>
              )}
            </div>
          )}

          {!editing && (
            <div className="mb-4">
              <h5 className="mb-2">Group Tags</h5>
              <div className="d-flex flex-wrap">
                {group.tags.map(tag => (
                  <span 
                    key={tag.id} 
                    className="tag"
                    style={{ backgroundColor: tag.color + '20', color: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
                {group.tags.length === 0 && (
                  <span className="text-muted">No tags associated with this group</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h4 className="mb-3">Group Members ({group.memberCount})</h4>
          
          <SearchBar onSearch={handleSearch} />

          {filteredMembers.length === 0 ? (
            <div className="text-center my-5">
              <div className="mb-3">
                <i className="fas fa-user-friends fa-3x text-secondary"></i>
              </div>
              <h5>No members found</h5>
              <p className="text-muted">
                {members.length > 0 
                  ? 'Try adjusting your search filters' 
                  : 'This group has no members yet'
                }
              </p>
            </div>
          ) : (
            <div className="list-group">
              {filteredMembers.map(member => (
                <Link 
                  to={`/contacts/${member.id}`} 
                  className="list-group-item list-group-item-action contact-list-item p-3"
                  key={member.id}
                >
                  <div className="d-flex align-items-center">
                    <div 
                      className="contact-avatar me-3"
                      style={{ backgroundColor: getRandomColor(member.name) }}
                    >
                      {getInitials(member.name)}
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-1">{member.name}</h5>
                        <div>
                          {member.linkedinConnected && (
                            <span className="social-connection" title="LinkedIn Connection">
                              <i className="fab fa-linkedin social-icon text-primary"></i>
                            </span>
                          )}
                          {member.facebookConnected && (
                            <span className="social-connection" title="Facebook Friend">
                              <i className="fab fa-facebook-f social-icon text-primary"></i>
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="mb-1 text-muted">
                        {member.title ? `${member.title}${member.company ? ` at ${member.company}` : ''}` : 
                         member.email || member.phone || ''}
                      </p>
                      <div>
                        {member.tags.slice(0, 3).map(tag => (
                          <span 
                            key={tag.id} 
                            className="tag"
                            style={{ backgroundColor: tag.color + '20', color: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ))}
                        {member.tags.length > 3 && (
                          <span className="text-muted small">
                            +{member.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupDetail;
