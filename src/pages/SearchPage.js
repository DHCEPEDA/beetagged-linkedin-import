import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// BeeTagged colors
const beeYellow = '#FFEC16';
const beeGold = '#FD9E31';

// Search suggestion component
const SearchSuggestion = ({ query, description, onSelect }) => (
  <button
    onClick={() => onSelect(query)}
    style={{
      width: '100%',
      padding: '12px 16px',
      margin: '5px 0',
      backgroundColor: 'white',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      textAlign: 'left',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    }}
  >
    <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>
      {query}
    </div>
    <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
      {description}
    </div>
  </button>
);

// Search result item
const SearchResult = ({ contact, query, ranking }) => {
  const displayName = contact.name || contact.phoneNumber || 'Unknown Contact';
  const currentJob = contact.priorityData?.employment?.current?.jobFunction;
  const currentCompany = contact.priorityData?.employment?.current?.employer;
  const relevantTags = contact.allTags?.filter(tag => 
    tag.name.toLowerCase().includes(query.toLowerCase())
  ) || [];

  return (
    <Link 
      to={`/contact/${contact._id}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div style={{
        padding: '15px',
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: 'white',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontWeight: 'bold', 
              fontSize: '16px',
              color: '#333',
              marginBottom: '4px'
            }}>
              {displayName}
              {contact.linkedinData && (
                <span style={{ 
                  marginLeft: '8px', 
                  fontSize: '12px', 
                  color: '#0066cc',
                  fontWeight: 'normal'
                }}>
                  ● LinkedIn
                </span>
              )}
            </div>
            
            {(currentJob || currentCompany) && (
              <div style={{ color: '#666', fontSize: '14px', marginBottom: '4px' }}>
                {currentJob && currentCompany ? `${currentJob} at ${currentCompany}` : currentJob || currentCompany}
              </div>
            )}
            
            {contact.priorityData?.location?.current && (
              <div style={{ color: '#888', fontSize: '12px', marginBottom: '8px' }}>
                📍 {contact.priorityData.location.current}
              </div>
            )}

            {/* Relevant tags */}
            {relevantTags.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                {relevantTags.slice(0, 3).map(tag => (
                  <span
                    key={tag.name}
                    style={{
                      backgroundColor: beeYellow,
                      color: '#333',
                      padding: '2px 6px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      marginRight: '4px'
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {ranking && (
            <div style={{
              backgroundColor: beeGold,
              color: 'white',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold',
              marginLeft: '10px'
            }}>
              #{ranking}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

// Common search suggestions based on user research
const getSearchSuggestions = () => [
  { query: 'Who works at Google?', description: 'Find contacts at specific companies' },
  { query: 'Who knows marketing?', description: 'Search by skills and expertise' },
  { query: 'Who lives near me?', description: 'Find contacts by location' },
  { query: 'Who went to Stanford?', description: 'Search by education background' },
  { query: 'Who can help with React?', description: 'Find technical expertise' },
  { query: 'Who works in healthcare?', description: 'Search by industry' },
  { query: 'Who is a team player?', description: 'Search by personality traits' },
  { query: 'Who recently changed jobs?', description: 'Find career transitions' }
];

// Main search page component
const SearchPage = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(true);

  useEffect(() => {
    // Load search history from localStorage
    const history = JSON.parse(localStorage.getItem('beetagged_search_history') || '[]');
    setSearchHistory(history.slice(0, 5)); // Keep only recent 5 searches
  }, []);

  const performSearch = async (query) => {
    if (!query.trim()) return;

    setLoading(true);
    setShowSuggestions(false);

    try {
      const response = await fetch('/api/search/natural', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          query: query,
          context: 'mixed'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.results || []);
        
        // Save to search history
        const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 5);
        setSearchHistory(newHistory);
        localStorage.setItem('beetagged_search_history', JSON.stringify(newHistory));
      } else {
        console.error('Search failed:', data.message);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      // Demo results for development
      setSearchResults([
        {
          _id: '1',
          name: 'John Smith',
          phoneNumber: '+1234567890',
          priorityData: {
            employment: { current: { jobFunction: 'Software Engineer', employer: 'Google' } },
            location: { current: 'San Francisco, CA' }
          },
          allTags: [
            { name: 'JavaScript', category: 'skill' },
            { name: 'React', category: 'skill' },
            { name: 'Tech Industry', category: 'industry' }
          ],
          linkedinData: { id: 'john-smith-123' },
          searchScore: 0.95
        },
        {
          _id: '2',
          name: 'Sarah Johnson',
          phoneNumber: '+1987654321',
          priorityData: {
            employment: { current: { jobFunction: 'Marketing Director', employer: 'Meta' } },
            location: { current: 'Menlo Park, CA' }
          },
          allTags: [
            { name: 'Digital Marketing', category: 'skill' },
            { name: 'Leadership', category: 'personality' }
          ],
          searchScore: 0.87
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const handleSuggestionSelect = (query) => {
    setSearchQuery(query);
    performSearch(query);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSuggestions(true);
  };

  const suggestions = getSearchSuggestions();

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Search Header */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderBottom: '1px solid #e0e0e0' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 20px 0', textAlign: 'center' }}>
          Search Your Network
        </h1>
        
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ask anything about your contacts..."
              style={{
                width: '100%',
                padding: '15px 50px 15px 20px',
                border: '2px solid #e0e0e0',
                borderRadius: '25px',
                fontSize: '16px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                style={{
                  position: 'absolute',
                  right: '15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            )}
          </div>
        </form>

        {/* Search Examples */}
        <div style={{ marginTop: '15px', textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
            Try asking: "Who works at Google?" or "Who knows React?"
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ padding: '20px' }}>
        {showSuggestions && (
          <>
            {/* Search History */}
            {searchHistory.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>
                  Recent Searches
                </h3>
                {searchHistory.map((query, index) => (
                  <SearchSuggestion
                    key={index}
                    query={query}
                    description="Tap to search again"
                    onSelect={handleSuggestionSelect}
                  />
                ))}
              </div>
            )}

            {/* Search Suggestions */}
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>
                Popular Searches
              </h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                {suggestions.map((suggestion, index) => (
                  <SearchSuggestion
                    key={index}
                    query={suggestion.query}
                    description={suggestion.description}
                    onSelect={handleSuggestionSelect}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Search Results */}
        {!showSuggestions && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <div style={{ fontSize: '18px', marginBottom: '10px' }}>🔍</div>
                Searching your network...
              </div>
            ) : (
              <>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '20px',
                  padding: '15px',
                  backgroundColor: '#e8f4fd',
                  borderRadius: '8px'
                }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#0066cc' }}>
                      "{searchQuery}"
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      {searchResults.length} contacts found
                    </div>
                  </div>
                  <button
                    onClick={clearSearch}
                    style={{
                      backgroundColor: beeGold,
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}
                  >
                    New Search
                  </button>
                </div>

                {searchResults.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '40px',
                    backgroundColor: 'white',
                    borderRadius: '12px'
                  }}>
                    <div style={{ fontSize: '18px', marginBottom: '10px', color: '#666' }}>
                      No matches found
                    </div>
                    <div style={{ fontSize: '14px', color: '#888' }}>
                      Try a different search or add more contacts to your network
                    </div>
                  </div>
                ) : (
                  <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden' }}>
                    {searchResults.map((contact, index) => (
                      <SearchResult
                        key={contact._id}
                        contact={contact}
                        query={searchQuery}
                        ranking={index + 1}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        right: '20px',
        display: 'flex',
        gap: '10px'
      }}>
        <Link
          to="/contacts"
          style={{
            flex: 1,
            backgroundColor: 'white',
            color: '#666',
            padding: '12px',
            borderRadius: '25px',
            textDecoration: 'none',
            textAlign: 'center',
            fontWeight: 'bold',
            border: '2px solid #e0e0e0'
          }}
        >
          📱 Contacts
        </Link>
        <Link
          to="/rank"
          style={{
            flex: 1,
            backgroundColor: beeGold,
            color: 'white',
            padding: '12px',
            borderRadius: '25px',
            textDecoration: 'none',
            textAlign: 'center',
            fontWeight: 'bold'
          }}
        >
          🏆 Play Game
        </Link>
      </div>
    </div>
  );
};

export default SearchPage;