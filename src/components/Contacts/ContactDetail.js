import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ContactContext } from '../../context/ContactContext';
import TagSelector from '../Tags/TagSelector';

const ContactDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    contacts, 
    getContact, 
    updateContact, 
    deleteContact, 
    addTagToContact,
    removeTagFromContact,
    loading, 
    error 
  } = useContext(ContactContext);
  
  const [contact, setContact] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    title: '',
    notes: ''
  });
  const [deleteModal, setDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentTags, setCurrentTags] = useState([]);
  
  useEffect(() => {
    getContact(id);
  }, [getContact, id]);
  
  useEffect(() => {
    if (contacts) {
      const foundContact = contacts.find(c => c.id === id);
      if (foundContact) {
        setContact(foundContact);
        setFormData({
          name: foundContact.name || '',
          email: foundContact.email || '',
          phone: foundContact.phone || '',
          company: foundContact.company || '',
          title: foundContact.title || '',
          notes: foundContact.notes || ''
        });
        setCurrentTags(foundContact.tags.map(tag => tag.id));
      }
    }
  }, [contacts, id]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateContact(id, formData);
      setEditing(false);
    } catch (err) {
      console.error('Failed to update contact:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteContact(id);
      navigate('/contacts');
    } catch (err) {
      console.error('Failed to delete contact:', err);
    }
  };

  const handleTagSelect = async (tagId) => {
    if (currentTags.includes(tagId)) {
      await removeTagFromContact(id, tagId);
      setCurrentTags(currentTags.filter(t => t !== tagId));
    } else {
      await addTagToContact(id, tagId);
      setCurrentTags([...currentTags, tagId]);
    }
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

  if (loading) {
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
        Error loading contact: {error}
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="alert alert-warning" role="alert">
        Contact not found.
      </div>
    );
  }

  return (
    <div className="container">
      <div className="mb-4">
        <Link to="/contacts" className="btn btn-outline-secondary">
          <i className="fas fa-arrow-left me-2"></i>Back to Contacts
        </Link>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start mb-4">
            <div className="d-flex align-items-center">
              <div 
                className="contact-avatar me-3"
                style={{ 
                  backgroundColor: getRandomColor(contact.name),
                  width: '60px',
                  height: '60px',
                  fontSize: '1.5rem'
                }}
              >
                {getInitials(contact.name)}
              </div>
              <div>
                <h2 className="mb-1">{contact.name}</h2>
                <div>
                  {contact.linkedinConnected && (
                    <span className="social-connection" title="LinkedIn Connection">
                      <i className="fab fa-linkedin social-icon text-primary"></i>
                      LinkedIn Connection
                    </span>
                  )}
                  {contact.facebookConnected && (
                    <span className="social-connection" title="Facebook Friend">
                      <i className="fab fa-facebook-f social-icon text-primary"></i>
                      Facebook Friend
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div>
              {!editing ? (
                <div>
                  <button 
                    className="btn btn-primary me-2"
                    onClick={() => setEditing(true)}
                  >
                    <i className="fas fa-edit me-2"></i>Edit
                  </button>
                  <button 
                    className="btn btn-outline-danger"
                    onClick={() => setDeleteModal(true)}
                  >
                    <i className="fas fa-trash-alt me-2"></i>Delete
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

          {!editing ? (
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <h5 className="text-muted mb-2">Contact Information</h5>
                  <div className="mb-2">
                    <strong><i className="fas fa-envelope me-2"></i>Email:</strong> {contact.email || 'Not specified'}
                  </div>
                  <div className="mb-2">
                    <strong><i className="fas fa-phone me-2"></i>Phone:</strong> {contact.phone || 'Not specified'}
                  </div>
                </div>

                <div className="mb-3">
                  <h5 className="text-muted mb-2">Professional Details</h5>
                  <div className="mb-2">
                    <strong><i className="fas fa-building me-2"></i>Company:</strong> {contact.company || 'Not specified'}
                  </div>
                  <div className="mb-2">
                    <strong><i className="fas fa-briefcase me-2"></i>Title:</strong> {contact.title || 'Not specified'}
                  </div>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="mb-3">
                  <h5 className="text-muted mb-2">Notes</h5>
                  <p>{contact.notes || 'No notes available.'}</p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">Name</label>
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
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="phone" className="form-label">Phone</label>
                    <input
                      type="tel"
                      className="form-control"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="company" className="form-label">Company</label>
                    <input
                      type="text"
                      className="form-control"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">Title</label>
                    <input
                      type="text"
                      className="form-control"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="notes" className="form-label">Notes</label>
                    <textarea
                      className="form-control"
                      id="notes"
                      name="notes"
                      rows="3"
                      value={formData.notes}
                      onChange={handleInputChange}
                    ></textarea>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <h5 className="mb-3">Tags</h5>
          <p className="text-muted mb-3">
            Tags help you categorize contacts based on interests, expertise, or connections.
            Click on a tag to add or remove it from this contact.
          </p>
          <TagSelector 
            selectedTags={currentTags} 
            onTagSelect={handleTagSelect}
          />
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Delete Contact</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setDeleteModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete <strong>{contact.name}</strong>? This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setDeleteModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={handleDeleteConfirm}
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

export default ContactDetail;
