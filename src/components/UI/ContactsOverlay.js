import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * ContactsOverlay Component
 * 
 * This component simulates the behavior of an app that overlays
 * and enhances the native contacts application on a mobile device.
 * 
 * Features:
 * - Requests permission to access contacts
 * - Displays native-like contacts UI
 * - Allows tagging and categorizing contacts
 * - Integrates with social data from Facebook
 */
const ContactsOverlay = ({ facebookData, onPermissionDenied }) => {
  // State for contacts permission and loading
  const [permissionStatus, setPermissionStatus] = useState('pending'); // 'pending', 'granted', 'denied'
  const [isLoading, setIsLoading] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for the selected contact and tags
  const [selectedContact, setSelectedContact] = useState(null);
  const [availableTags, setAvailableTags] = useState([
    { id: 1, name: 'Work', color: '#4A90E2' },
    { id: 2, name: 'Friend', color: '#7ED321' },
    { id: 3, name: 'Family', color: '#F5A623' },
    { id: 4, name: 'Important', color: '#D0021B' },
    { id: 5, name: 'Networking', color: '#9013FE' },
  ]);
  
  // Initial setup - request permission and load contacts
  useEffect(() => {
    // Simulate requesting permission to access contacts
    const requestPermission = async () => {
      try {
        // In a real mobile app, this would use the Contacts API
        // For our simulation, we'll assume permission is granted
        setPermissionStatus('granted');
        
        // Fetch contacts
        await loadContacts();
      } catch (error) {
        console.error('Error requesting contacts permission:', error);
        setPermissionStatus('denied');
        if (onPermissionDenied) onPermissionDenied();
      } finally {
        setIsLoading(false);
      }
    };
    
    requestPermission();
  }, [onPermissionDenied]);
  
  // Load sample contacts data (in a real app, this would come from the device)
  const loadContacts = async () => {
    try {
      // Simulate loading contacts from the device
      // In a real app, this would use the Contacts API
      
      // Create sample contacts
      const sampleContacts = [
        {
          id: '1',
          name: 'John Smith',
          phone: '+1 (555) 123-4567',
          email: 'john.smith@example.com',
          photo: null,
          tags: [1, 3] // Work, Family
        },
        {
          id: '2',
          name: 'Emily Johnson',
          phone: '+1 (555) 987-6543',
          email: 'emily.j@example.com',
          photo: null,
          tags: [2, 5] // Friend, Networking
        },
        {
          id: '3',
          name: 'Michael Brown',
          phone: '+1 (555) 456-7890',
          email: 'm.brown@example.com',
          photo: null,
          tags: [1, 4] // Work, Important
        }
      ];
      
      // If Facebook data is available, enhance the contacts with Facebook info
      const enhancedContacts = enhanceContactsWithSocialData(sampleContacts, facebookData);
      
      setContacts(enhancedContacts);
      setFilteredContacts(enhancedContacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };
  
  // Function to match and enhance contacts with Facebook data
  const enhanceContactsWithSocialData = (contactsList, fbData) => {
    if (!fbData || !fbData.friends) return contactsList;
    
    // Make a copy of the contacts to avoid mutating the original state
    const enhancedContacts = [...contactsList];
    
    // For each contact, check if there's a matching Facebook friend
    return enhancedContacts.map(contact => {
      // In a real app, we would use more sophisticated matching logic
      // For this demo, we'll just do a simple name comparison
      const matchingFriend = fbData.friends.find(friend => 
        friend.name.toLowerCase().includes(contact.name.toLowerCase()) ||
        contact.name.toLowerCase().includes(friend.name.toLowerCase())
      );
      
      if (matchingFriend) {
        return {
          ...contact,
          facebookData: matchingFriend,
          photo: matchingFriend.picture?.data?.url || contact.photo
        };
      }
      
      return contact;
    });
  };
  
  // Handler for contact search
  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredContacts(contacts);
      return;
    }
    
    const filtered = contacts.filter(contact => 
      contact.name.toLowerCase().includes(query.toLowerCase()) ||
      contact.phone.includes(query) ||
      (contact.email && contact.email.toLowerCase().includes(query.toLowerCase()))
    );
    
    setFilteredContacts(filtered);
  };
  
  // Handler for selecting a contact
  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
  };
  
  // Handler for adding a tag to a contact
  const handleAddTag = (contactId, tagId) => {
    const updatedContacts = contacts.map(contact => {
      if (contact.id === contactId) {
        // Only add the tag if it's not already there
        if (!contact.tags.includes(tagId)) {
          return {
            ...contact,
            tags: [...contact.tags, tagId]
          };
        }
      }
      return contact;
    });
    
    setContacts(updatedContacts);
    setFilteredContacts(
      searchQuery ? 
        updatedContacts.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())) : 
        updatedContacts
    );
    
    // Update the selected contact if necessary
    if (selectedContact && selectedContact.id === contactId) {
      const updatedContact = updatedContacts.find(c => c.id === contactId);
      setSelectedContact(updatedContact);
    }
  };
  
  // Handler for removing a tag from a contact
  const handleRemoveTag = (contactId, tagId) => {
    const updatedContacts = contacts.map(contact => {
      if (contact.id === contactId) {
        return {
          ...contact,
          tags: contact.tags.filter(id => id !== tagId)
        };
      }
      return contact;
    });
    
    setContacts(updatedContacts);
    setFilteredContacts(
      searchQuery ? 
        updatedContacts.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())) : 
        updatedContacts
    );
    
    // Update the selected contact if necessary
    if (selectedContact && selectedContact.id === contactId) {
      const updatedContact = updatedContacts.find(c => c.id === contactId);
      setSelectedContact(updatedContact);
    }
  };
  
  // Mobile-first styling for the contacts overlay
  const styles = {
    container: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      maxWidth: '500px',
      margin: '0 auto',
      backgroundColor: '#f5f5f7', // iOS-like background
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    },
    header: {
      backgroundColor: '#fff',
      padding: '15px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 10
    },
    title: {
      fontSize: '18px',
      fontWeight: 'bold',
      margin: '0 0 10px 0',
      textAlign: 'center'
    },
    searchBar: {
      display: 'flex',
      padding: '8px 15px',
      backgroundColor: '#e4e4e8',
      borderRadius: '10px',
      alignItems: 'center'
    },
    searchInput: {
      border: 'none',
      backgroundColor: 'transparent',
      width: '100%',
      fontSize: '16px',
      padding: '5px',
      outline: 'none'
    },
    contactsList: {
      flex: 1,
      padding: '0',
      margin: '0',
      listStyle: 'none',
      backgroundColor: '#fff',
      borderRadius: '12px',
      overflow: 'hidden',
      marginTop: '15px'
    },
    contactItem: {
      padding: '12px 15px',
      borderBottom: '1px solid #e4e4e8',
      display: 'flex',
      alignItems: 'center'
    },
    contactPhoto: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: '#ddd',
      marginRight: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      color: '#666'
    },
    contactInfo: {
      flex: 1
    },
    contactName: {
      margin: '0 0 5px 0',
      fontSize: '16px',
      fontWeight: '500'
    },
    contactDetail: {
      margin: '0',
      fontSize: '14px',
      color: '#666'
    },
    tagList: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '5px',
      marginTop: '5px'
    },
    tag: {
      padding: '3px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      color: '#fff',
      display: 'inline-flex',
      alignItems: 'center'
    },
    tagDelete: {
      marginLeft: '5px',
      cursor: 'pointer',
      fontSize: '14px'
    },
    detailView: {
      backgroundColor: '#fff',
      padding: '20px',
      borderRadius: '12px',
      marginTop: '15px'
    },
    detailHeader: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '20px'
    },
    detailPhoto: {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      backgroundColor: '#ddd',
      marginRight: '15px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      fontSize: '24px',
      color: '#666'
    },
    detailInfo: {
      flex: 1
    },
    detailName: {
      margin: '0 0 5px 0',
      fontSize: '24px',
      fontWeight: 'bold'
    },
    tagSelector: {
      marginTop: '20px'
    },
    tagSelectorTitle: {
      fontSize: '18px',
      fontWeight: '500',
      marginBottom: '10px'
    },
    tagOptions: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '10px'
    },
    tagOption: {
      padding: '5px 12px',
      borderRadius: '15px',
      fontSize: '14px',
      color: '#fff',
      cursor: 'pointer'
    },
    socialInfo: {
      marginTop: '20px',
      padding: '15px',
      backgroundColor: '#f0f2f5', // Facebook-like color
      borderRadius: '8px'
    },
    socialInfoTitle: {
      fontSize: '16px',
      fontWeight: '500',
      marginBottom: '10px',
      display: 'flex',
      alignItems: 'center'
    },
    permissionDenied: {
      textAlign: 'center',
      padding: '40px 20px',
      backgroundColor: '#fff',
      borderRadius: '12px',
      margin: '20px'
    },
    permissionTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      marginBottom: '15px',
      color: '#d0021b'
    },
    permissionText: {
      fontSize: '16px',
      lineHeight: '1.5',
      marginBottom: '20px'
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#fff'
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div>Loading contacts...</div>
      </div>
    );
  }
  
  // Permission denied state
  if (permissionStatus === 'denied') {
    return (
      <div style={styles.container}>
        <div style={styles.permissionDenied}>
          <h2 style={styles.permissionTitle}>Contact Access Required</h2>
          <p style={styles.permissionText}>
            BeeTagged needs access to your contacts to help you organize and tag your network.
            Please grant permission in your device settings.
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => setPermissionStatus('pending')}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div style={styles.container}>
      {/* Header with search */}
      <div style={styles.header}>
        <h1 style={styles.title}>BeeTagged Contacts</h1>
        <div style={styles.searchBar}>
          <input
            type="text"
            placeholder="Search contacts..."
            style={styles.searchInput}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>
      
      {/* Contact list view */}
      {!selectedContact && (
        <ul style={styles.contactsList}>
          {filteredContacts.map(contact => (
            <li
              key={contact.id}
              style={styles.contactItem}
              onClick={() => handleSelectContact(contact)}
            >
              <div style={styles.contactPhoto}>
                {contact.photo ? (
                  <img src={contact.photo} alt={contact.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  contact.name.charAt(0)
                )}
              </div>
              <div style={styles.contactInfo}>
                <h3 style={styles.contactName}>{contact.name}</h3>
                <p style={styles.contactDetail}>{contact.phone}</p>
                
                {/* Display tags */}
                {contact.tags && contact.tags.length > 0 && (
                  <div style={styles.tagList}>
                    {contact.tags.map(tagId => {
                      const tag = availableTags.find(t => t.id === tagId);
                      return tag ? (
                        <span
                          key={tagId}
                          style={{
                            ...styles.tag,
                            backgroundColor: tag.color
                          }}
                        >
                          {tag.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
                
                {/* Display Facebook indicator if present */}
                {contact.facebookData && (
                  <div style={{ marginTop: '5px', fontSize: '12px', color: '#1877F2' }}>
                    <span role="img" aria-label="Facebook">📘</span> Facebook Connected
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      
      {/* Contact detail view */}
      {selectedContact && (
        <div style={styles.detailView}>
          {/* Back button */}
          <div style={{ marginBottom: '15px' }}>
            <button 
              style={{ 
                background: 'none',
                border: 'none',
                color: '#007AFF',
                fontSize: '16px',
                padding: '5px 0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              onClick={() => setSelectedContact(null)}
            >
              &larr; Back to Contacts
            </button>
          </div>
          
          {/* Contact header */}
          <div style={styles.detailHeader}>
            <div style={styles.detailPhoto}>
              {selectedContact.photo ? (
                <img src={selectedContact.photo} alt={selectedContact.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                selectedContact.name.charAt(0)
              )}
            </div>
            <div style={styles.detailInfo}>
              <h2 style={styles.detailName}>{selectedContact.name}</h2>
              <p style={styles.contactDetail}>{selectedContact.phone}</p>
              {selectedContact.email && (
                <p style={styles.contactDetail}>{selectedContact.email}</p>
              )}
            </div>
          </div>
          
          {/* Tags */}
          <div style={styles.tagSelector}>
            <h3 style={styles.tagSelectorTitle}>Tags</h3>
            
            {/* Current tags */}
            {selectedContact.tags && selectedContact.tags.length > 0 ? (
              <div style={styles.tagList}>
                {selectedContact.tags.map(tagId => {
                  const tag = availableTags.find(t => t.id === tagId);
                  return tag ? (
                    <span
                      key={tagId}
                      style={{
                        ...styles.tag,
                        backgroundColor: tag.color
                      }}
                    >
                      {tag.name}
                      <span 
                        style={styles.tagDelete}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveTag(selectedContact.id, tagId);
                        }}
                      >
                        &times;
                      </span>
                    </span>
                  ) : null;
                })}
              </div>
            ) : (
              <p>No tags yet. Add some below:</p>
            )}
            
            {/* Tag options */}
            <div style={{ marginTop: '10px' }}>
              <h4 style={{ fontSize: '14px', margin: '10px 0', color: '#666' }}>Add tags:</h4>
              <div style={styles.tagOptions}>
                {availableTags.map(tag => {
                  const isSelected = selectedContact.tags.includes(tag.id);
                  return (
                    <span
                      key={tag.id}
                      style={{
                        ...styles.tagOption,
                        backgroundColor: tag.color,
                        opacity: isSelected ? 0.6 : 1,
                        cursor: isSelected ? 'default' : 'pointer'
                      }}
                      onClick={() => {
                        if (!isSelected) {
                          handleAddTag(selectedContact.id, tag.id);
                        }
                      }}
                    >
                      {tag.name}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Facebook information if available */}
          {selectedContact.facebookData && (
            <div style={styles.socialInfo}>
              <h3 style={styles.socialInfoTitle}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#1877F2" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
                  <path d="M9.19795 21.5H13.198V13.4901H16.8021L17.198 9.50977H13.198V7.5C13.198 6.94772 13.6457 6.5 14.198 6.5H17.198V2.5H14.198C11.4365 2.5 9.19795 4.73858 9.19795 7.5V9.50977H7.19795L6.80206 13.4901H9.19795V21.5Z"/>
                </svg>
                Facebook Connection
              </h3>
              {selectedContact.facebookData.picture && (
                <img 
                  src={selectedContact.facebookData.picture.data.url} 
                  alt="Facebook profile"
                  style={{ width: '60px', height: '60px', borderRadius: '50%', marginRight: '10px' }}
                />
              )}
              <p style={{ margin: '8px 0' }}>
                <strong>Name:</strong> {selectedContact.facebookData.name}
              </p>
              {selectedContact.facebookData.email && (
                <p style={{ margin: '8px 0' }}>
                  <strong>Email:</strong> {selectedContact.facebookData.email}
                </p>
              )}
              {selectedContact.facebookData.id && (
                <p style={{ margin: '8px 0' }}>
                  <strong>Facebook ID:</strong> {selectedContact.facebookData.id}
                </p>
              )}
            </div>
          )}
          
        </div>
      )}
    </div>
  );
};

ContactsOverlay.propTypes = {
  facebookData: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    email: PropTypes.string,
    picture: PropTypes.object,
    friends: PropTypes.array
  }),
  onPermissionDenied: PropTypes.func
};

export default ContactsOverlay;