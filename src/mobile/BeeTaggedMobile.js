import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

const BeeTaggedMobile = () => {
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Check if running on mobile device
  const isMobile = Capacitor.isNativePlatform();

  useEffect(() => {
    if (isMobile) {
      loadDeviceContacts();
    }
  }, [isMobile]);

  const loadDeviceContacts = async () => {
    setIsLoading(true);
    try {
      // Import Contacts plugin dynamically when on mobile
      const { Contacts } = await import('@capacitor/contacts');
      
      // Request permission to access contacts
      const permission = await Contacts.requestPermissions();
      
      if (permission.contacts === 'granted') {
        // Get all contacts from device
        const result = await Contacts.getContacts();
        
        // Enhance contacts with social media data
        const enhancedContacts = await enhanceContactsWithSocialData(result.contacts);
        setContacts(enhancedContacts);
      } else {
        console.log('Contact permission denied');
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
    setIsLoading(false);
  };

  const enhanceContactsWithSocialData = async (deviceContacts) => {
    const enhanced = [];
    
    for (const contact of deviceContacts) {
      try {
        // Call your BeeTagged server to enhance contact with Facebook/LinkedIn data
        const response = await fetch('/api/contacts/enhance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: contact.name?.display,
            phoneNumbers: contact.phoneNumbers?.map(p => p.number),
            emails: contact.emails?.map(e => e.address)
          })
        });
        
        if (response.ok) {
          const enhancedData = await response.json();
          enhanced.push({
            ...contact,
            socialData: enhancedData,
            tags: generateTagsFromSocialData(enhancedData)
          });
        } else {
          enhanced.push({
            ...contact,
            socialData: null,
            tags: []
          });
        }
      } catch (error) {
        console.error('Error enhancing contact:', contact.name?.display, error);
        enhanced.push({
          ...contact,
          socialData: null,
          tags: []
        });
      }
    }
    
    return enhanced;
  };

  const generateTagsFromSocialData = (socialData) => {
    const tags = [];
    
    if (socialData?.facebook) {
      if (socialData.facebook.work) {
        tags.push(`work:${socialData.facebook.work.toLowerCase().replace(/\s+/g, '-')}`);
      }
      if (socialData.facebook.education) {
        tags.push(`education:${socialData.facebook.education.toLowerCase().replace(/\s+/g, '-')}`);
      }
      if (socialData.facebook.location) {
        tags.push(`location:${socialData.facebook.location.toLowerCase().replace(/\s+/g, '-')}`);
      }
    }
    
    if (socialData?.linkedin) {
      if (socialData.linkedin.company) {
        tags.push(`work:${socialData.linkedin.company.toLowerCase().replace(/\s+/g, '-')}`);
      }
      if (socialData.linkedin.position) {
        tags.push(`position:${socialData.linkedin.position.toLowerCase().replace(/\s+/g, '-')}`);
      }
    }
    
    return tags;
  };

  const filteredContacts = contacts.filter(contact => {
    const nameMatch = contact.name?.display?.toLowerCase().includes(searchTerm.toLowerCase());
    const tagMatch = selectedTags.length === 0 || 
      selectedTags.every(tag => contact.tags?.includes(tag));
    return nameMatch && tagMatch;
  });

  const allTags = [...new Set(contacts.flatMap(contact => contact.tags || []))];

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#f5a623' }}>🐝 BeeTagged</h1>
        <p>Smart Contact Management</p>
      </div>

      {!isMobile && (
        <div style={{ 
          backgroundColor: '#fff3cd', 
          padding: '15px', 
          borderRadius: '5px', 
          marginBottom: '20px',
          border: '1px solid #ffeaa7'
        }}>
          <strong>📱 Mobile Features Available</strong>
          <p>Install this app on your Android device to access native contact integration!</p>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            border: '2px solid #ddd',
            borderRadius: '6px'
          }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>Filter by Tags:</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {allTags.slice(0, 10).map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              style={{
                padding: '6px 12px',
                border: '1px solid #0077b5',
                borderRadius: '20px',
                backgroundColor: selectedTags.includes(tag) ? '#0077b5' : '#f0f7ff',
                color: selectedTags.includes(tag) ? 'white' : '#0077b5',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {tag.replace(/[_-]/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ 
            display: 'inline-block',
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #f5a623',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p>Loading and enhancing your contacts...</p>
        </div>
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '15px' 
      }}>
        {filteredContacts.map((contact, index) => (
          <ContactCard key={index} contact={contact} />
        ))}
      </div>

      {filteredContacts.length === 0 && !isLoading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          {contacts.length === 0 
            ? 'No contacts found. Make sure to grant contact permissions.'
            : 'No contacts match your search criteria.'
          }
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const ContactCard = ({ contact }) => {
  const displayName = contact.name?.display || 'Unknown';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();
  
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      borderLeft: '4px solid #f5a623'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          backgroundColor: '#f5a623',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          marginRight: '15px'
        }}>
          {initials}
        </div>
        <div>
          <h3 style={{ margin: '0 0 5px 0' }}>{displayName}</h3>
          <div style={{ color: '#666', fontSize: '14px' }}>
            {contact.socialData?.facebook?.work || 
             contact.socialData?.linkedin?.company || 
             'Contact'}
          </div>
        </div>
      </div>
      
      {contact.phoneNumbers && contact.phoneNumbers.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <strong>Phone:</strong> {contact.phoneNumbers[0].number}
        </div>
      )}
      
      {contact.emails && contact.emails.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <strong>Email:</strong> {contact.emails[0].address}
        </div>
      )}
      
      {contact.tags && contact.tags.length > 0 && (
        <div style={{ marginTop: '15px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {contact.tags.map((tag, index) => (
              <span
                key={index}
                style={{
                  backgroundColor: '#e8f4f8',
                  color: '#0077b5',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  border: '1px solid #b3d9e8'
                }}
              >
                {tag.replace(/[_-]/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BeeTaggedMobile;