import React, { useState, useEffect } from 'react';
import { contactsAPI } from './lib/api.js';

// Contact Detail Modal Component
const ContactDetailModal = ({ contact, onClose }) => {
  if (!contact) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="contact-card" onClick={e => e.stopPropagation()}>
        <div className="contact-card-header">
          <h2>{contact.basicInfo?.fullName || 'Unknown Contact'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="contact-card-content">
          <div className="card-section">
            <h3>📱 Contact Info</h3>
            <div className="info-grid">
              <div><strong>Email:</strong> {contact.basicInfo?.email || 'Not available'}</div>
              <div><strong>Phone:</strong> {contact.basicInfo?.phone || 'Not available'}</div>
              <div><strong>Nickname:</strong> {contact.basicInfo?.nickname || 'Not set'}</div>
            </div>
          </div>

          {(contact.professional?.company || contact.professional?.position) && (
            <div className="card-section">
              <h3>💼 Professional</h3>
              <div className="info-grid">
                {contact.professional.company && (
                  <div><strong>Company:</strong> {contact.professional.company}</div>
                )}
                {contact.professional.position && (
                  <div><strong>Position:</strong> {contact.professional.position}</div>
                )}
                {contact.professional.profileUrl && (
                  <div>
                    <strong>Profile:</strong> 
                    <a href={contact.professional.profileUrl} target="_blank" rel="noopener noreferrer">
                      View LinkedIn
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {(contact.personal?.location || contact.personal?.interests?.length > 0) && (
            <div className="card-section">
              <h3>🌍 Personal</h3>
              <div className="info-grid">
                {contact.personal.location && (
                  <div><strong>Location:</strong> {contact.personal.location}</div>
                )}
                {contact.personal.interests?.length > 0 && (
                  <div>
                    <strong>Interests:</strong> 
                    <div className="tags">
                      {contact.personal.interests.map((interest, i) => (
                        <span key={i} className="tag">{interest}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {contact.networking?.connectedDate && (
            <div className="card-section">
              <h3>🤝 Networking</h3>
              <div className="info-grid">
                <div><strong>Connected:</strong> {new Date(contact.networking.connectedDate).toLocaleDateString()}</div>
              </div>
            </div>
          )}

          {(contact.metadata?.tags?.length > 0 || contact.metadata?.notes) && (
            <div className="card-section">
              <h3>📝 Notes & Tags</h3>
              {contact.metadata.tags?.length > 0 && (
                <div>
                  <strong>Tags:</strong>
                  <div className="tags">
                    {contact.metadata.tags.map((tag, i) => (
                      <span key={i} className="tag tag-primary">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
              {contact.metadata.notes && (
                <div><strong>Notes:</strong> {contact.metadata.notes}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Duplicate Detection Component
const DuplicateDetection = ({ onClose }) => {
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [merging, setMerging] = useState(false);

  const findDuplicates = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://beetagged-app-53414697acd3.herokuapp.com/api/contacts/find-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      if (data.success) {
        setDuplicates(data.duplicates);
      } else {
        alert('Error finding duplicates: ' + data.message);
      }
    } catch (error) {
      alert('Error finding duplicates: ' + error.message);
    }
    setLoading(false);
  };

  const mergeDuplicates = async (contactIds, mergedData) => {
    setMerging(true);
    try {
      const response = await fetch('https://beetagged-app-53414697acd3.herokuapp.com/api/contacts/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactIds, mergedData })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Contacts merged successfully!');
        findDuplicates();
      } else {
        alert('Error merging contacts: ' + data.message);
      }
    } catch (error) {
      alert('Error merging contacts: ' + error.message);
    }
    setMerging(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="duplicate-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔍 Duplicate Detection</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          <button 
            className="btn btn-primary" 
            onClick={findDuplicates} 
            disabled={loading}
          >
            {loading ? 'Analyzing Contacts...' : 'Find Duplicates'}
          </button>

          {duplicates.length > 0 && (
            <div className="duplicates-list">
              <h3>Potential Duplicates Found:</h3>
              {duplicates.map((group, i) => (
                <div key={i} className="duplicate-group">
                  <div className="duplicate-reason">
                    <strong>Reason:</strong> {group.reason} 
                    <span className="confidence">(Confidence: {Math.round(group.confidence * 100)}%)</span>
                  </div>
                  
                  <div className="duplicate-contacts">
                    {group.contacts.map(contact => (
                      <div key={contact._id} className="duplicate-contact">
                        <strong>{contact.name}</strong>
                        {contact.email && <div>Email: {contact.email}</div>}
                        {contact.company && <div>Company: {contact.company}</div>}
                      </div>
                    ))}
                  </div>

                  <button 
                    className="btn btn-success"
                    onClick={() => mergeDuplicates(
                      group.contacts.map(c => c._id),
                      group.suggested_merge
                    )}
                    disabled={merging}
                  >
                    {merging ? 'Merging...' : 'Merge These Contacts'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {duplicates.length === 0 && !loading && (
            <p>No duplicates found. Your contacts look clean! 🎉</p>
          )}
        </div>
      </div>
    </div>
  );
};

const BeeTaggedApp = () => {
  const [contacts, setContacts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [showDuplicates, setShowDuplicates] = useState(false);

  useEffect(() => {
    checkBackendHealth();
    loadContacts();
  }, []);

  const checkBackendHealth = async () => {
    try {
      await contactsAPI.health();
      setBackendConnected(true);
    } catch (error) {
      setBackendConnected(false);
      console.error('Backend health check failed:', error);
    }
  };

  const loadContacts = async () => {
    try {
      const data = await contactsAPI.getAll();
      setContacts(data.contacts || []);
      setSearchResults(data.contacts || []);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults(contacts);
      return;
    }

    setIsLoading(true);
    try {
      const data = await contactsAPI.search(query);
      setSearchResults(data.contacts || []);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadStatus('Uploading...');
    try {
      const result = await contactsAPI.importCSV(file);
      setUploadStatus(`Success! Imported ${result.count} contacts`);
      loadContacts(); // Reload contacts after import
      setTimeout(() => setUploadStatus(''), 3000);
    } catch (error) {
      setUploadStatus('Upload failed. Please check file format.');
      setTimeout(() => setUploadStatus(''), 3000);
    }
  };

  const handleContactClick = async (contact) => {
    try {
      const response = await fetch(`https://beetagged-app-53414697acd3.herokuapp.com/api/contacts/${contact._id}/details`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedContact(data.contact);
      } else {
        alert('Error loading contact details');
      }
    } catch (error) {
      alert('Error loading contact details: ' + error.message);
    }
  };

  return (
    <div className="beetagged-container">
      <div className="beetagged-card">
        {/* Header */}
        <div className="beetagged-header">
          <div className="beetagged-title-section">
            <svg className="beetagged-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <h1 className="beetagged-title">BeeTagged Professional Search</h1>
          </div>
          <div className={`beetagged-status ${backendConnected ? 'connected' : 'offline'}`}>
            {backendConnected ? `Connected (${contacts.length} contacts)` : 'Backend Offline'}
          </div>
        </div>

        {/* Search Section */}
        <div className="beetagged-search-section">
          <div className="beetagged-search-container">
            <input
              type="text"
              placeholder="Who do you know at Google? Basketball fans in Austin?"
              className="beetagged-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
            />
            <button 
              onClick={() => handleSearch(searchQuery)}
              className="beetagged-search-button"
              disabled={isLoading}
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Upload Section */}
        <div className="beetagged-upload-section">
          <label className="beetagged-upload-label">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="beetagged-file-input"
            />
            Upload LinkedIn CSV
          </label>
          <button 
            onClick={() => setShowDuplicates(true)}
            className="beetagged-duplicate-btn"
          >
            Find Duplicates
          </button>
          {uploadStatus && (
            <div className={`beetagged-upload-status ${uploadStatus.includes('Success') ? 'success' : 'error'}`}>
              {uploadStatus}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="beetagged-results">
          {searchResults.length > 0 ? (
            <div className="beetagged-contacts-grid">
              {searchResults.map((contact, index) => (
                <div 
                  key={index} 
                  className="beetagged-contact-card clickable-contact"
                  onClick={() => handleContactClick(contact)}
                >
                  <div className="beetagged-contact-name">{contact.name}</div>
                  <div className="beetagged-contact-details">
                    {contact.company && <div className="beetagged-company">{contact.company}</div>}
                    {contact.position && <div className="beetagged-position">{contact.position}</div>}
                    {contact.location && <div className="beetagged-location">{contact.location}</div>}
                    {contact.email && <div className="beetagged-email">{contact.email}</div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="beetagged-empty-state">
              <svg className="beetagged-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
              </svg>
              <p>Search your professional network</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="beetagged-footer">
          <p>Powered by BeeTagged AI • Professional Network Intelligence</p>
          <p className="beetagged-pricing">$0.99/month • Advanced contact search and insights</p>
        </div>
      </div>

      {/* Modals */}
      {selectedContact && (
        <ContactDetailModal 
          contact={selectedContact} 
          onClose={() => setSelectedContact(null)} 
        />
      )}
      
      {showDuplicates && (
        <DuplicateDetection 
          onClose={() => setShowDuplicates(false)} 
        />
      )}
    </div>
  );
};

// Mount the React app to the DOM
const mountApp = () => {
  const rootElement = document.getElementById('my-react-app-root');
  if (rootElement && window.React && window.ReactDOM) {
    window.ReactDOM.render(React.createElement(BeeTaggedApp), rootElement);
  }
};

// Auto-mount when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}

export default BeeTaggedApp;