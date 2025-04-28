import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ContactCard from './ContactCard';
import TagBadge from '../Tags/TagBadge';
import BeeSpinner from '../UI/BeeSpinner';
import './ContactList.css';

/**
 * Contact List component with filtering and searching
 * Based on the iOS ContactsViewController implementation
 */
const ContactList = ({
  contacts = [],
  onContactClick,
  isLoading = false,
  onTagFilterChange,
  allTags = [],
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState(contacts);
  const [groupByLetter, setGroupByLetter] = useState(true);
  const [groupedContacts, setGroupedContacts] = useState({});

  // Filter contacts when search query, contacts array or selected tags change
  useEffect(() => {
    let result = [...contacts];
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(contact => {
        const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.toLowerCase();
        const nameMatch = fullName.includes(query);
        const hometownMatch = contact.hometown && contact.hometown.toLowerCase().includes(query);
        
        // Check work history
        let workMatch = false;
        if (contact.work && contact.work.length > 0) {
          workMatch = contact.work.some(work => {
            const employer = work.employer && work.employer.toLowerCase().includes(query);
            const position = work.position && work.position.toLowerCase().includes(query);
            return employer || position;
          });
        }
        
        // Check education history
        let educationMatch = false;
        if (contact.education && contact.education.length > 0) {
          educationMatch = contact.education.some(edu => 
            edu.school && edu.school.toLowerCase().includes(query)
          );
        }
        
        return nameMatch || hometownMatch || workMatch || educationMatch;
      });
    }
    
    // Filter by selected tags
    if (selectedTags.length > 0) {
      result = result.filter(contact => {
        // If contact has no tags, it doesn't match
        if (!contact.tags || contact.tags.length === 0) return false;
        
        // Check if any selected tag exists in the contact's tags
        return selectedTags.some(selectedTag => 
          contact.tags.some(tag => tag.name === selectedTag.name)
        );
      });
    }
    
    setFilteredContacts(result);
    
    // Group contacts by first letter of last name (or first name if last name is missing)
    if (groupByLetter) {
      const grouped = result.reduce((acc, contact) => {
        // Determine group letter (first letter of last name, or first name if no last name)
        let groupLetter;
        if (contact.last_name && contact.last_name.trim()) {
          groupLetter = contact.last_name.charAt(0).toUpperCase();
        } else if (contact.first_name && contact.first_name.trim()) {
          groupLetter = contact.first_name.charAt(0).toUpperCase();
        } else {
          groupLetter = '#'; // Fallback for contacts with no name
        }
        
        // Create group if it doesn't exist
        if (!acc[groupLetter]) {
          acc[groupLetter] = [];
        }
        
        // Add contact to group
        acc[groupLetter].push(contact);
        return acc;
      }, {});
      
      // Sort groups alphabetically
      setGroupedContacts(
        Object.keys(grouped)
          .sort()
          .reduce((acc, key) => {
            acc[key] = grouped[key];
            return acc;
          }, {})
      );
    }
  }, [contacts, searchQuery, selectedTags, groupByLetter]);

  // Handle tag selection for filtering
  const handleTagSelect = (tag) => {
    const isSelected = selectedTags.some(t => t.name === tag.name);
    
    if (isSelected) {
      // Remove tag from selection
      const newSelectedTags = selectedTags.filter(t => t.name !== tag.name);
      setSelectedTags(newSelectedTags);
      onTagFilterChange && onTagFilterChange(newSelectedTags);
    } else {
      // Add tag to selection
      const newSelectedTags = [...selectedTags, tag];
      setSelectedTags(newSelectedTags);
      onTagFilterChange && onTagFilterChange(newSelectedTags);
    }
  };

  // Toggle between grouped and flat view
  const toggleGrouping = () => {
    setGroupByLetter(!groupByLetter);
  };

  // Render the contacts list
  const renderContacts = () => {
    if (isLoading) {
      return (
        <div className="contact-list-loading">
          <BeeSpinner isLoading={true} size="large" />
          <p>Loading contacts...</p>
        </div>
      );
    }
    
    if (filteredContacts.length === 0) {
      return (
        <div className="contact-list-empty">
          <p>No contacts found.</p>
          {searchQuery.trim() && (
            <p>Try adjusting your search or filters.</p>
          )}
        </div>
      );
    }
    
    if (groupByLetter) {
      // Grouped view
      return Object.keys(groupedContacts).map(letter => (
        <div key={letter} className="contact-list-group">
          <div className="contact-list-group-header">{letter}</div>
          {groupedContacts[letter].map(contact => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onClick={() => onContactClick && onContactClick(contact)}
            />
          ))}
        </div>
      ));
    } else {
      // Flat view
      return filteredContacts.map(contact => (
        <ContactCard
          key={contact.id}
          contact={contact}
          onClick={() => onContactClick && onContactClick(contact)}
        />
      ));
    }
  };

  return (
    <div className={`contact-list ${className}`}>
      <div className="contact-list-header">
        <div className="contact-list-search">
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="contact-list-search-input"
          />
          <button
            className="contact-list-search-clear"
            onClick={() => setSearchQuery('')}
            style={{ visibility: searchQuery ? 'visible' : 'hidden' }}
          >
            &times;
          </button>
        </div>
        
        <button
          className="contact-list-view-toggle"
          onClick={toggleGrouping}
        >
          {groupByLetter ? 'Flat View' : 'Group by Letter'}
        </button>
      </div>
      
      {/* Tag filters */}
      {allTags.length > 0 && (
        <div className="contact-list-tags">
          {allTags.map((tag, index) => (
            <TagBadge
              key={`filter-${tag.name}-${index}`}
              name={tag.name}
              color={tag.color}
              count={tag.count}
              size="small"
              selected={selectedTags.some(t => t.name === tag.name)}
              onClick={() => handleTagSelect(tag)}
            />
          ))}
        </div>
      )}
      
      {/* Selected filters display */}
      {selectedTags.length > 0 && (
        <div className="contact-list-active-filters">
          <span className="contact-list-active-filters-label">Active Filters:</span>
          {selectedTags.map((tag, index) => (
            <TagBadge
              key={`active-${tag.name}-${index}`}
              name={tag.name}
              color={tag.color}
              size="small"
              selected={true}
              onClick={() => handleTagSelect(tag)}
              onDelete={() => handleTagSelect(tag)}
            />
          ))}
          <button
            className="contact-list-clear-filters"
            onClick={() => {
              setSelectedTags([]);
              onTagFilterChange && onTagFilterChange([]);
            }}
          >
            Clear All
          </button>
        </div>
      )}
      
      {/* Contacts */}
      <div className="contact-list-content">
        {renderContacts()}
      </div>
    </div>
  );
};

ContactList.propTypes = {
  contacts: PropTypes.arrayOf(PropTypes.object),
  onContactClick: PropTypes.func,
  isLoading: PropTypes.bool,
  onTagFilterChange: PropTypes.func,
  allTags: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      color: PropTypes.string,
      count: PropTypes.number,
    })
  ),
  className: PropTypes.string,
};

export default ContactList;