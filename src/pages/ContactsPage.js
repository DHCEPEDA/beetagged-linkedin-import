import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// BeeTagged colors
const beeYellow = '#FFEC16';
const beeGold = '#FD9E31';

// User status levels based on profiles edited
const getUserStatus = (profilesEdited) => {
  if (profilesEdited >= 2000) return { level: 'Network Bee', color: '#FF6B6B', description: 'Elite networker with massive reach' };
  if (profilesEdited >= 1000) return { level: 'Killer Bee', color: '#FF8E53', description: 'Networking powerhouse' };
  if (profilesEdited >= 701) return { level: 'Yellow Jacket', color: '#FFD93D', description: 'Advanced networking expert' };
  if (profilesEdited >= 501) return { level: 'Hornet', color: '#A8E6CF', description: 'Networking professional' };
  if (profilesEdited >= 201) return { level: 'Wasp', color: '#88D8C0', description: 'Active networker' };
  if (profilesEdited >= 100) return { level: 'Carpenter Bee', color: '#6C5CE7', description: 'Dedicated networker' };
  if (profilesEdited >= 50) return { level: 'Bumble Bee', color: '#74B9FF', description: 'Growing your network' };
  if (profilesEdited >= 26) return { level: 'Honey Bee', color: '#FD79A8', description: 'Building connections' };
  return { level: 'Begin Bee', color: '#DDA0DD', description: 'Starting your networking journey' };
};

// Search modes: ABC (LinkedIn), YOU (Personal), NET (Network)
const SearchModeSelector = ({ currentMode, onModeChange }) => {
  const modes = [
    { id: 'abc', label: 'ABC', description: 'Alphabetical + LinkedIn' },
    { id: 'you', label: 'YOU', description: 'Your tags & ratings' },
    { id: 'net', label: 'NET', description: 'Network view' }
  ];

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      margin: '20px 0',
      backgroundColor: '#f8f9fa',
      borderRadius: '25px',
      padding: '5px'
    }}>
      {modes.map(mode => (
        <button
          key={mode.id}
          onClick={() => onModeChange(mode.id)}
          style={{
            padding: '10px 20px',
            margin: '0 5px',
            border: 'none',
            borderRadius: '20px',
            backgroundColor: currentMode === mode.id ? beeGold : 'transparent',
            color: currentMode === mode.id ? 'white' : '#666',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          title={mode.description}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
};

// Contact item in the list
const ContactItem = ({ contact, isLinkedInConnected, hasNetworkRating }) => {
  const displayName = contact.name || contact.phoneNumber || 'Unknown Contact';
  const currentJob = contact.priorityData?.employment?.current?.jobFunction;
  const currentCompany = contact.priorityData?.employment?.current?.employer;
  const tagCount = contact.allTags?.length || 0;

  return (
    <Link 
      to={`/contact/${contact._id}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div style={{
        padding: '15px',
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: isLinkedInConnected ? '#e8f5e8' : 'white',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontWeight: 'bold', 
              fontSize: '16px',
              color: isLinkedInConnected ? '#0066cc' : '#333'
            }}>
              {displayName}
              {isLinkedInConnected && (
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
              <div style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
                {currentJob && currentCompany ? `${currentJob} at ${currentCompany}` : currentJob || currentCompany}
              </div>
            )}
            
            {contact.priorityData?.location?.current && (
              <div style={{ color: '#888', fontSize: '12px', marginTop: '2px' }}>
                📍 {contact.priorityData.location.current}
              </div>
            )}
          </div>
          
          <div style={{ textAlign: 'right' }}>
            {tagCount > 0 && (
              <div style={{
                backgroundColor: beeYellow,
                color: '#333',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
                marginBottom: '4px'
              }}>
                {tagCount} tags
              </div>
            )}
            
            {hasNetworkRating && (
              <div style={{
                backgroundColor: beeGold,
                color: 'white',
                padding: '2px 6px',
                borderRadius: '8px',
                fontSize: '10px',
                fontWeight: 'bold'
              }}>
                Network Rated
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

// Main contacts page component
const ContactsPage = () => {
  const { user } = useAuth();
  const [searchMode, setSearchMode] = useState('abc');
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({
    profilesEdited: 42,
    networkBreakdown: {
      tech: 35,
      business: 28,
      healthcare: 15,
      education: 12,
      other: 10
    }
  });

  useEffect(() => {
    loadContacts();
  }, [searchMode, searchQuery]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      // Simulated API call - replace with actual API
      const response = await fetch(`/api/contacts?mode=${searchMode}&search=${searchQuery}&userId=${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setContacts(data.contacts || []);
      }
    } catch (error) {
      console.error('Failed to load contacts:', error);
      // Demo data for development
      setContacts([
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
            { name: 'Tech Industry', category: 'industry' },
            { name: 'Team Player', category: 'personality' }
          ],
          linkedinData: { id: 'john-smith-123' }
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
            { name: 'Marketing', category: 'industry' }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchModeChange = (mode) => {
    setSearchMode(mode);
    setSearchQuery(''); // Clear search when changing modes
  };

  const userStatus = getUserStatus(userStats.profilesEdited);

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* User Status Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: userStatus.color,
            marginBottom: '5px'
          }}>
            {userStatus.level}
          </div>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
            {userStatus.description}
          </div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            {userStats.profilesEdited} profiles edited
          </div>
        </div>

        {/* Network Breakdown */}
        <div style={{ marginTop: '15px', textAlign: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
            Your Network Breakdown
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '5px' }}>
            {Object.entries(userStats.networkBreakdown).map(([industry, percentage]) => (
              <span
                key={industry}
                style={{
                  backgroundColor: beeYellow,
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#333'
                }}
              >
                {industry} {percentage}%
              </span>
            ))}
          </div>
        </div>
        
        {/* Import Contacts Button */}
        <div style={{ textAlign: 'center', marginTop: '15px' }}>
          <button
            onClick={() => window.location.href = '/linkedin-import.html'}
            style={{
              backgroundColor: beeGold,
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#e88b1a'}
            onMouseOut={(e) => e.target.style.backgroundColor = beeGold}
          >
            📥 Import LinkedIn Data
          </button>
        </div>
      </div>

      {/* Search Mode Selector */}
      <SearchModeSelector 
        currentMode={searchMode} 
        onModeChange={handleSearchModeChange} 
      />

      {/* Search Bar */}
      <div style={{ padding: '0 20px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder={
            searchMode === 'abc' ? 'Search contacts and LinkedIn...' :
            searchMode === 'you' ? 'Search your tagged contacts...' :
            'Search network view...'
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '2px solid #e0e0e0',
            borderRadius: '25px',
            fontSize: '16px',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Mode Description */}
      <div style={{ padding: '0 20px', marginBottom: '15px' }}>
        <div style={{ 
          backgroundColor: '#e8f4fd', 
          padding: '10px 15px', 
          borderRadius: '8px',
          fontSize: '14px',
          color: '#0066cc'
        }}>
          {searchMode === 'abc' && 'Alphabetical list with LinkedIn connections highlighted in blue'}
          {searchMode === 'you' && 'Ranked by your tags and ratings, then recent calls'}
          {searchMode === 'net' && 'How your network views these contacts (excludes your input)'}
        </div>
      </div>

      {/* Contacts List */}
      <div style={{ backgroundColor: 'white' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            Loading contacts...
          </div>
        ) : contacts.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            No contacts found. Try connecting your LinkedIn account.
          </div>
        ) : (
          contacts.map(contact => (
            <ContactItem
              key={contact._id}
              contact={contact}
              isLinkedInConnected={!!contact.linkedinData}
              hasNetworkRating={searchMode === 'net'}
            />
          ))
        )}
      </div>

      {/* Settings Button */}
      <Link 
        to="/settings"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: beeGold,
          color: 'white',
          padding: '15px',
          borderRadius: '50%',
          textDecoration: 'none',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          fontSize: '18px',
          width: '50px',
          height: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        ⚙️
      </Link>
    </div>
  );
};

export default ContactsPage;