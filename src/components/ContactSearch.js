import React, { useState, useEffect, useMemo } from 'react';
import { UserSearchHelper } from '../utils/UserSearchHelper.js';
import { User } from '../models/User.js';

const ContactSearch = () => {
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState('simple'); // simple, advanced, natural
  const [advancedFilters, setAdvancedFilters] = useState({
    name: '',
    company: '',
    title: '',
    location: '',
    industry: '',
    tags: []
  });
  const [suggestions, setSuggestions] = useState({
    companies: [],
    titles: [],
    locations: [],
    industries: [],
    tags: []
  });

  // Load contacts from localStorage on component mount
  useEffect(() => {
    const loadContacts = () => {
      try {
        const storedContacts = localStorage.getItem('beetagged_linkedin_contacts');
        if (storedContacts) {
          const parsedContacts = JSON.parse(storedContacts);
          const userObjects = UserSearchHelper.loadFromLinkedInData(parsedContacts);
          setContacts(userObjects);
          
          // Generate suggestions for autocomplete
          setSuggestions({
            companies: UserSearchHelper.getUniqueValues(userObjects, 'company'),
            titles: UserSearchHelper.getUniqueValues(userObjects, 'title'),
            locations: UserSearchHelper.getUniqueValues(userObjects, 'location'),
            industries: UserSearchHelper.getUniqueValues(userObjects, 'industry'),
            tags: UserSearchHelper.getUniqueValues(userObjects, 'tags')
          });
        }
      } catch (error) {
        console.error('Error loading contacts:', error);
      }
    };

    loadContacts();
  }, []);

  // Memoized search results
  const searchResults = useMemo(() => {
    if (searchMode === 'simple') {
      return UserSearchHelper.searchUsers(contacts, searchTerm);
    } else if (searchMode === 'advanced') {
      return UserSearchHelper.advancedSearch(contacts, advancedFilters);
    } else if (searchMode === 'natural') {
      return UserSearchHelper.naturalLanguageSearch(contacts, searchTerm);
    }
    return contacts;
  }, [contacts, searchTerm, searchMode, advancedFilters]);

  const rankedResults = useMemo(() => {
    if (searchMode === 'simple' || searchMode === 'natural') {
      return UserSearchHelper.searchWithRanking(contacts, searchTerm);
    }
    return searchResults.map(user => ({ user, score: 0 }));
  }, [contacts, searchTerm, searchMode, searchResults]);

  const handleAdvancedFilterChange = (field, value) => {
    setAdvancedFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setAdvancedFilters({
      name: '',
      company: '',
      title: '',
      location: '',
      industry: '',
      tags: []
    });
  };

  const ContactCard = ({ user, score }) => {
    const userData = user.toDisplayObject();
    return (
      <div className="contact-card" style={{
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '16px',
        margin: '8px 0',
        backgroundColor: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'transform 0.2s',
        cursor: 'pointer'
      }} onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
         onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}>
        
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: '#0077B5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '18px',
            marginRight: '16px'
          }}>
            {userData.name ? userData.name[0].toUpperCase() : 'N'}
          </div>
          
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 4px 0', color: '#333', fontSize: '18px' }}>
              {userData.name || 'Unknown Contact'}
            </h3>
            <div style={{ color: '#666', fontSize: '14px' }}>
              {userData.title && userData.company ? `${userData.title} at ${userData.company}` :
               userData.title || userData.company || 'No title/company'}
            </div>
            {userData.location && (
              <div style={{ color: '#888', fontSize: '12px', marginTop: '2px' }}>
                📍 {userData.location}
              </div>
            )}
          </div>
          
          {score > 0 && (
            <div style={{
              backgroundColor: '#28a745',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {score}% match
            </div>
          )}
        </div>
        
        {userData.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {userData.tags.slice(0, 5).map((tag, index) => (
              <span key={index} style={{
                backgroundColor: '#e8f4fd',
                color: '#0077B5',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '500'
              }}>
                {tag}
              </span>
            ))}
            {userData.tags.length > 5 && (
              <span style={{ color: '#666', fontSize: '11px' }}>
                +{userData.tags.length - 5} more
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        marginBottom: '20px'
      }}>
        
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0077B5 0%, #005885 100%)',
          color: 'white',
          padding: '30px',
          textAlign: 'center'
        }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '28px' }}>Contact Search</h1>
          <p style={{ margin: 0, opacity: 0.9 }}>
            Search your {contacts.length} contacts by name, company, role, or tags
          </p>
        </div>

        {/* Search Controls */}
        <div style={{ padding: '30px' }}>
          {/* Search Mode Toggle */}
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            {['simple', 'advanced', 'natural'].map(mode => (
              <button
                key={mode}
                onClick={() => setSearchMode(mode)}
                style={{
                  backgroundColor: searchMode === mode ? '#0077B5' : '#f8f9fa',
                  color: searchMode === mode ? 'white' : '#666',
                  border: '1px solid #ddd',
                  padding: '8px 16px',
                  margin: '0 5px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {mode} Search
              </button>
            ))}
          </div>

          {/* Simple/Natural Search */}
          {(searchMode === 'simple' || searchMode === 'natural') && (
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                placeholder={searchMode === 'natural' ? 
                  'Try: "Who works at Google?" or "Marketing professionals"' :
                  'Search by name or tag...'
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#0077B5'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>
          )}

          {/* Advanced Search */}
          {searchMode === 'advanced' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              {Object.entries(advancedFilters).map(([field, value]) => (
                field !== 'tags' && (
                  <div key={field}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', textTransform: 'capitalize' }}>
                      {field}:
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleAdvancedFilterChange(field, e.target.value)}
                      placeholder={`Filter by ${field}...`}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                )
              ))}
            </div>
          )}

          {/* Clear Filters */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <button
              onClick={clearFilters}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Clear All Filters
            </button>
          </div>

          {/* Results Summary */}
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <strong>
              {searchMode === 'simple' && rankedResults.filter(r => r.score > 0).length > 0 ?
                `Found ${rankedResults.filter(r => r.score > 0).length} matches` :
                `Showing ${searchResults.length} contacts`
              }
            </strong>
            {searchTerm && (
              <span style={{ color: '#666', marginLeft: '10px' }}>
                for "{searchTerm}"
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Search Results */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: '20px' }}>
        {searchMode === 'simple' || searchMode === 'natural' ? (
          // Ranked results for simple/natural search
          rankedResults.filter(r => r.score > 0 || !searchTerm).map((result, index) => (
            <ContactCard key={result.user.getId() || index} user={result.user} score={result.score} />
          ))
        ) : (
          // Regular results for advanced search
          searchResults.map((user, index) => (
            <ContactCard key={user.getId() || index} user={user} score={0} />
          ))
        )}

        {searchResults.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <h3>No contacts found</h3>
            <p>Try adjusting your search criteria or import more contacts</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactSearch;