import React, { useState, useEffect } from 'react';
import { contactsAPI } from './lib/api.js';

const BeeTaggedApp = () => {
  const [contacts, setContacts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

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
                <div key={index} className="beetagged-contact-card">
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