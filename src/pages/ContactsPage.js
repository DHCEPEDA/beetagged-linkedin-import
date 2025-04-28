import React, { useState, useEffect } from 'react';
import { useContacts } from '../context/ContactContext';
import { useNavigate } from 'react-router-dom';
import '../styles/contacts.css';

const ContactsPage = () => {
  const { contacts, loading, error, getContacts } = useContacts();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showTagFilter, setShowTagFilter] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Load contacts on component mount
    getContacts();
  }, [getContacts]);
  
  useEffect(() => {
    // Filter contacts based on search term and selected tags
    if (contacts) {
      let filtered = [...contacts];
      
      // Apply search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(
          contact => 
            contact.name?.toLowerCase().includes(term) ||
            contact.headline?.toLowerCase().includes(term) ||
            contact.locationName?.toLowerCase().includes(term) ||
            contact.industry?.toLowerCase().includes(term)
        );
      }
      
      // Apply tag filters
      if (selectedTags.length > 0) {
        filtered = filtered.filter(contact => 
          contact.tags?.some(tag => selectedTags.includes(tag.id))
        );
      }
      
      setFilteredContacts(filtered);
    }
  }, [contacts, searchTerm, selectedTags]);
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleTagClick = (tagId) => {
    setSelectedTags(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
  };
  
  const handleContactClick = (contact) => {
    navigate(`/contacts/${contact.id}`);
  };
  
  const toggleTagFilter = () => {
    setShowTagFilter(!showTagFilter);
  };
  
  // Group contacts by first letter of last name
  const groupedContacts = filteredContacts.reduce((acc, contact) => {
    const key = contact.groupByLastName || '#';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(contact);
    return acc;
  }, {});
  
  // Sort the keys alphabetically
  const sortedKeys = Object.keys(groupedContacts).sort();
  
  // Extract all unique tags from contacts
  const allTags = contacts
    ? [...new Set(contacts.flatMap(contact => contact.tags || []))]
    : [];
  
  if (loading) {
    return <div className="contacts-loading">Loading contacts...</div>;
  }
  
  if (error) {
    return <div className="contacts-error">Error loading contacts: {error.message}</div>;
  }
  
  return (
    <div className="contacts-container">
      <div className="contacts-header">
        <h1>Bee Tagged</h1>
        <button className="tags-button" onClick={toggleTagFilter}>Tags</button>
      </div>
      
      <div className="search-container">
        <input
          type="text"
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>
      
      {showTagFilter && (
        <div className="tag-filter-container">
          <h3>Filter by Tags</h3>
          <div className="tags-list">
            {allTags.map(tag => (
              <div 
                key={tag.id}
                className={`tag ${selectedTags.includes(tag.id) ? 'selected' : ''}`}
                style={{ backgroundColor: tag.color }}
                onClick={() => handleTagClick(tag.id)}
              >
                {tag.name}
              </div>
            ))}
            {allTags.length === 0 && <p>No tags available</p>}
          </div>
        </div>
      )}
      
      <div className="contacts-list">
        {sortedKeys.length > 0 ? (
          sortedKeys.map(key => (
            <div key={key} className="contacts-group">
              <div className="contacts-group-header">{key}</div>
              {groupedContacts[key].map(contact => (
                <div 
                  key={contact.id} 
                  className="contact-item"
                  onClick={() => handleContactClick(contact)}
                >
                  <div className="contact-avatar">
                    {contact.pictureUrl ? (
                      <img src={contact.pictureUrl} alt={contact.name} />
                    ) : (
                      <div className="avatar-initials">{contact.getInitials ? contact.getInitials() : ''}</div>
                    )}
                  </div>
                  <div className="contact-info">
                    <div className="contact-name">{contact.name}</div>
                    <div className="contact-location">{contact.locationName || "Location not available"}</div>
                    <div className="contact-headline">{contact.headline || contact.positionTitle || ""}</div>
                    <div className="contact-company">{contact.positionName || ""}</div>
                    
                    {contact.tags && contact.tags.length > 0 && (
                      <div className="contact-tags">
                        {contact.tags.slice(0, 3).map(tag => (
                          <span 
                            key={tag.id} 
                            className="contact-tag" 
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ))}
                        {contact.tags.length > 3 && (
                          <span className="more-tags">+{contact.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="no-contacts">
            {searchTerm || selectedTags.length > 0 ? 
              "No contacts match your filters" : 
              "No contacts available. Import contacts from Facebook or LinkedIn."}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactsPage;