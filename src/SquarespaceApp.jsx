import React, { useState } from 'react';

// Use empty string for same-origin (Vite proxy) or full URL for production
const API_URL = window.location.hostname.includes('localhost') || window.location.hostname.includes('replit')
  ? '' // Use Vite proxy for /api requests
  : 'https://your-heroku-app.herokuapp.com'; // Update with your Heroku URL

export default function BeeTaggedApp() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);

  // Search contacts as user types
  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Get userId from localStorage or default
      const userId = localStorage.getItem('beetagged_user_id') || 'default';
      const response = await fetch(`${API_URL}/api/contacts?userId=${userId}&search=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data.contacts || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle CSV file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('Uploading...');

    const formData = new FormData();
    formData.append('csvFile', file);
    // Use consistent userId from localStorage or default
    let userId = localStorage.getItem('beetagged_user_id');
    if (!userId) {
      userId = 'default';
      localStorage.setItem('beetagged_user_id', userId);
    }
    formData.append('userId', userId);

    try {
      const response = await fetch(`${API_URL}/api/linkedin/import`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setUploadStatus(`✅ Success! Imported ${result.results.imported} contacts`);
        setTimeout(() => setUploadStatus(''), 5000);
      } else {
        setUploadStatus(`❌ Error: ${result.error || result.details || 'Upload failed'}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus(`❌ Error: ${error.message}`);
    } finally {
      setIsUploading(false);
      event.target.value = ''; // Reset file input
    }
  };

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '800px',
      margin: '40px auto',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5em', margin: '0 0 10px 0', color: '#667eea' }}>
          🐝 BeeTagged
        </h1>
        <p style={{ color: '#666', fontSize: '1.1em' }}>
          AI-Powered Contact Search
        </p>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '30px' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search your contacts... (e.g., 'engineers at Google' or 'founders in SF')"
          style={{
            width: '100%',
            padding: '16px 20px',
            fontSize: '1.1em',
            border: '2px solid #e0e0e0',
            borderRadius: '12px',
            outline: 'none',
            transition: 'border-color 0.2s',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => e.target.style.borderColor = '#667eea'}
          onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
        />
      </div>

      {/* Search Results */}
      {isSearching && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          Searching...
        </div>
      )}

      {searchResults.length > 0 && (
        <div style={{
          marginBottom: '30px',
          border: '1px solid #e0e0e0',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          {searchResults.map((contact, index) => (
            <div
              key={contact._id || index}
              onClick={() => setSelectedContact(selectedContact?._id === contact._id ? null : contact)}
              style={{
                padding: '16px 20px',
                borderBottom: index < searchResults.length - 1 ? '1px solid #f0f0f0' : 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                backgroundColor: selectedContact?._id === contact._id ? '#f8f9ff' : 'white'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9ff'}
              onMouseLeave={(e) => {
                if (selectedContact?._id !== contact._id) {
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              <div style={{ fontWeight: '600', fontSize: '1.1em', marginBottom: '4px' }}>
                {contact.name || `${contact.firstName} ${contact.lastName}`.trim()}
              </div>
              {(contact.currentPosition || contact.currentCompany) && (
                <div style={{ color: '#666', fontSize: '0.95em', marginBottom: '4px' }}>
                  {contact.currentPosition} {contact.currentPosition && contact.currentCompany && 'at'} {contact.currentCompany}
                </div>
              )}
              {contact.email && (
                <div style={{ color: '#888', fontSize: '0.9em' }}>
                  {contact.email}
                </div>
              )}
              
              {/* Expanded contact details */}
              {selectedContact?._id === contact._id && (
                <div style={{
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid #e0e0e0',
                  fontSize: '0.9em',
                  color: '#555'
                }}>
                  {contact.location && <div><strong>Location:</strong> {contact.location}</div>}
                  {contact.linkedinUrl && (
                    <div>
                      <strong>LinkedIn:</strong>{' '}
                      <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>
                        View Profile
                      </a>
                    </div>
                  )}
                  {contact.tags && contact.tags.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      {contact.tags.map((tag, i) => (
                        <span
                          key={i}
                          style={{
                            display: 'inline-block',
                            backgroundColor: '#e8ebff',
                            color: '#667eea',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '0.85em',
                            marginRight: '6px',
                            marginTop: '4px'
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {searchQuery.trim().length >= 2 && !isSearching && searchResults.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#888',
          backgroundColor: '#f8f9ff',
          borderRadius: '12px',
          marginBottom: '30px'
        }}>
          No contacts found for "{searchQuery}"
        </div>
      )}

      {/* Upload Section */}
      <div style={{
        marginTop: '40px',
        padding: '30px',
        backgroundColor: '#f8f9ff',
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>
          📁 Import LinkedIn Contacts
        </h3>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Upload your LinkedIn Connections.csv or Contacts.csv file
        </p>
        
        <label style={{
          display: 'inline-block',
          padding: '14px 32px',
          backgroundColor: '#667eea',
          color: 'white',
          borderRadius: '8px',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          fontWeight: '600',
          fontSize: '1.05em',
          transition: 'transform 0.2s, box-shadow 0.2s',
          opacity: isUploading ? 0.6 : 1
        }}
        onMouseEnter={(e) => {
          if (!isUploading) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        >
          {isUploading ? 'Uploading...' : 'Choose CSV File'}
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isUploading}
            style={{ display: 'none' }}
          />
        </label>

        {uploadStatus && (
          <div style={{
            marginTop: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            backgroundColor: uploadStatus.includes('✅') ? '#d4edda' : '#f8d7da',
            color: uploadStatus.includes('✅') ? '#155724' : '#721c24',
            fontWeight: '500'
          }}>
            {uploadStatus}
          </div>
        )}

        <div style={{
          marginTop: '20px',
          fontSize: '0.9em',
          color: '#666',
          textAlign: 'left'
        }}>
          <strong>How to export from LinkedIn:</strong>
          <ol style={{ marginTop: '8px', paddingLeft: '20px' }}>
            <li>Go to LinkedIn Settings & Privacy</li>
            <li>Click "Get a copy of your data"</li>
            <li>Select "Connections" or "Contacts"</li>
            <li>Request archive and wait for email</li>
            <li>Upload the CSV file here</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
