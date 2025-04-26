import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useContacts } from '../../context/ContactContext';

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
              <button
                key={tag._id}
                className={`tag ${activeTag === tag._id ? 'tag-primary' : ''}`}
                onClick={() => handleTagClick(tag._id)}
              >
                {tag.name}
              </button>
            ))}
            {activeTag && (
              <button
                className="tag"
                onClick={() => setActiveTag(null)}
              >
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
                      <span key={tag._id} className="tag tag-secondary">
                        {tag.name}
                      </span>
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