import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useContacts } from '../../context/ContactContext';
import TagBadge from '../Tags/TagBadge';

const ContactList = () => {
  const { 
    filteredContacts, 
    isLoading, 
    error, 
    tags, 
    activeTag, 
    setActiveTag,
    loadContacts 
  } = useContacts();
  const [showEmptyState, setShowEmptyState] = useState(false);
  
  // Load contacts on mount
  useEffect(() => {
    loadContacts();
  }, [loadContacts]);
  
  // Show empty state after a short delay if no contacts
  useEffect(() => {
    if (!isLoading && filteredContacts.length === 0) {
      const timer = setTimeout(() => {
        setShowEmptyState(true);
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setShowEmptyState(false);
    }
  }, [isLoading, filteredContacts]);
  
  const handleTagClick = (tagId) => {
    if (activeTag === tagId) {
      setActiveTag(null); // Clear active tag if clicked again
    } else {
      setActiveTag(tagId);
    }
  };
  
  if (isLoading) {
    return (
      <div className="text-center p-5">
        <div className="loader"></div>
        <p>Loading contacts...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }
  
  if (showEmptyState) {
    return (
      <div className="text-center p-5">
        <h2>No Contacts Found</h2>
        {activeTag ? (
          <p>No contacts match the selected tag. Try selecting a different tag or clear the filter.</p>
        ) : (
          <>
            <p>You don't have any contacts yet. Get started by:</p>
            <div className="mt-4">
              <Link to="/import" className="btn btn-primary me-2">
                Import Contacts
              </Link>
              <button className="btn btn-secondary">
                Add Contact Manually
              </button>
            </div>
          </>
        )}
      </div>
    );
  }
  
  return (
    <div className="contacts-page">
      <div className="flex justify-between items-center mb-4">
        <h1>Your Contacts</h1>
        <div>
          <Link to="/import" className="btn btn-primary me-2">
            Import Contacts
          </Link>
          <button className="btn btn-secondary">
            Add Contact
          </button>
        </div>
      </div>
      
      {/* Tags filter */}
      {tags.length > 0 && (
        <div className="tags-filter mb-4">
          <h4>Filter by tag:</h4>
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map(tag => (
              <TagBadge
                key={tag._id}
                tag={tag}
                onClick={handleTagClick}
                className={activeTag === tag._id ? 'active-tag' : ''}
                style={{
                  opacity: activeTag === tag._id ? 1 : 0.7,
                  transform: activeTag === tag._id ? 'scale(1.05)' : 'none',
                  boxShadow: activeTag === tag._id ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                }}
              />
            ))}
            {activeTag && (
              <button
                className="clear-filter-btn"
                onClick={() => setActiveTag(null)}
                style={{
                  border: '1px dashed #ccc',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  backgroundColor: 'transparent',
                  cursor: 'pointer'
                }}
              >
                <i className="fas fa-times-circle me-1"></i>
                Clear Filter
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Contacts list */}
      <div className="contacts-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 'var(--spacing-md)'
      }}>
        {filteredContacts.map(contact => (
          <Link to={`/contacts/${contact._id}`} key={contact._id} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="flex items-start gap-4">
              <div className="contact-avatar" style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'var(--gray)',
                backgroundImage: contact.profilePicture ? `url(${contact.profilePicture})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: 'bold'
              }}>
                {!contact.profilePicture && contact.name.charAt(0).toUpperCase()}
              </div>
              
              <div className="contact-info">
                <h3 className="contact-name">{contact.name}</h3>
                {contact.email && <p className="contact-email">{contact.email}</p>}
                {contact.phone && <p className="contact-phone">{contact.phone}</p>}
                
                {contact.tags && contact.tags.length > 0 && (
                  <div className="contact-tags mt-2">
                    {contact.tags.map(tag => (
                      <TagBadge 
                        key={tag._id} 
                        tag={tag}
                        small={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ContactList;