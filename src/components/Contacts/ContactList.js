import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ContactContext } from '../../context/ContactContext';
import SearchBar from '../Search/SearchBar';
import TagManager from '../Tags/TagManager';

const ContactList = () => {
  const { contacts, loading, error, getContacts } = useContext(ContactContext);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [showTagManager, setShowTagManager] = useState(false);
  
  useEffect(() => {
    getContacts();
  }, [getContacts]);
  
  useEffect(() => {
    if (contacts) {
      let filtered = [...contacts];
      
      // Filter by search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(contact => 
          contact.name.toLowerCase().includes(term) ||
          contact.email?.toLowerCase().includes(term) ||
          contact.phone?.includes(term)
        );
      }
      
      // Filter by selected tags
      if (selectedTags.length > 0) {
        filtered = filtered.filter(contact => {
          return selectedTags.every(tagId => 
            contact.tags.some(tag => tag.id === tagId)
          );
        });
      }
      
      setFilteredContacts(filtered);
    }
  }, [contacts, searchTerm, selectedTags]);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleTagSelect = (tagId) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
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
        Error loading contacts: {error}
      </div>
    );
  }

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>My Contacts</h1>
        <div>
          <Link to="/import" className="btn btn-primary me-2">
            <i className="fas fa-file-import me-2"></i>Import Contacts
          </Link>
          <button 
            className="btn btn-outline-primary"
            onClick={() => setShowTagManager(!showTagManager)}
          >
            <i className="fas fa-tags me-2"></i>Manage Tags
          </button>
        </div>
      </div>

      {showTagManager && (
        <div className="card mb-4">
          <div className="card-body">
            <TagManager 
              selectable={true} 
              selectedTags={selectedTags} 
              onTagSelect={handleTagSelect}
            />
          </div>
        </div>
      )}

      <SearchBar onSearch={handleSearch} />

      {filteredContacts.length === 0 ? (
        <div className="text-center my-5">
          <div className="mb-3">
            <i className="fas fa-search fa-3x text-secondary"></i>
          </div>
          <h3>No contacts found</h3>
          <p className="text-muted">Try adjusting your search or tag filters</p>
        </div>
      ) : (
        <div className="card">
          <div className="card-body p-0">
            <div className="list-group list-group-flush">
              {filteredContacts.map(contact => (
                <Link 
                  to={`/contacts/${contact.id}`} 
                  className="list-group-item list-group-item-action contact-list-item p-3"
                  key={contact.id}
                >
                  <div className="d-flex align-items-center">
                    <div 
                      className="contact-avatar me-3"
                      style={{ backgroundColor: getRandomColor(contact.name) }}
                    >
                      {getInitials(contact.name)}
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-1">{contact.name}</h5>
                        <div>
                          {contact.linkedinConnected && (
                            <span className="social-connection" title="LinkedIn Connection">
                              <i className="fab fa-linkedin social-icon text-primary"></i>
                            </span>
                          )}
                          {contact.facebookConnected && (
                            <span className="social-connection" title="Facebook Friend">
                              <i className="fab fa-facebook-f social-icon text-primary"></i>
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="mb-1 text-muted">{contact.email || contact.phone || ''}</p>
                      <div>
                        {contact.tags.slice(0, 3).map(tag => (
                          <span 
                            key={tag.id} 
                            className="tag"
                            style={{ backgroundColor: tag.color + '20', color: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ))}
                        {contact.tags.length > 3 && (
                          <span className="text-muted small">
                            +{contact.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactList;
