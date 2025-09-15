import React, { useState, useEffect } from 'react';
import { contactsAPI } from './lib/api.js';

// Contact Detail Modal Component
const ContactDetailModal = ({ contact, onClose, onContactUpdate }) => {
  const [newTag, setNewTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [localContact, setLocalContact] = useState(contact);
  
  if (!contact) return null;

  const handleAddTag = async () => {
    if (!newTag.trim() || isAddingTag) return;
    
    setIsAddingTag(true);
    try {
      // Update local state immediately for UI responsiveness
      const updatedTags = [...(localContact.tags || []), newTag.trim()];
      const updatedContact = { ...localContact, tags: updatedTags };
      setLocalContact(updatedContact);
      
      // Call API to persist the tag
      await contactsAPI.updateContact(contact._id, { tags: updatedTags });
      
      // Update parent component's contact list if callback provided
      if (onContactUpdate) {
        onContactUpdate(updatedContact);
      }
      
      // Clear input
      setNewTag('');
      
    } catch (error) {
      console.error('Failed to add tag:', error);
      // Revert local state on error
      setLocalContact(contact);
      alert('Failed to add tag. Please try again.');
    } finally {
      setIsAddingTag(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddTag();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="contact-card" onClick={e => e.stopPropagation()}>
        <div className="contact-card-header">
          <h2>{contact.name || 'Unknown Contact'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="contact-card-content">
          {/* Basic Contact Info */}
          <div className="card-section">
            <h3>📱 Contact Information</h3>
            <div className="info-grid">
              <div><strong>Email:</strong> {contact.email || 'Not available'}</div>
              <div><strong>Phone:</strong> {contact.phone || contact.phoneNumber || 'Not available'}</div>
              {contact.linkedinUrl && (
                <div>
                  <strong>LinkedIn:</strong> 
                  <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer">
                    View Profile
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Current Position */}
          {(contact.company || contact.position) && (
            <div className="card-section">
              <h3>💼 Current Position</h3>
              <div className="info-grid">
                {contact.company && <div><strong>Company:</strong> {contact.company}</div>}
                {contact.position && <div><strong>Position:</strong> {contact.position}</div>}
                {contact.jobTitle && <div><strong>Job Title:</strong> {contact.jobTitle}</div>}
                {contact.location && <div><strong>Location:</strong> {contact.location}</div>}
              </div>
            </div>
          )}

          {/* Experience History */}
          {contact.experience && contact.experience.length > 0 && (
            <div className="card-section">
              <h3>🏢 Experience History</h3>
              <div className="experience-list">
                {contact.experience.map((exp, i) => (
                  <div key={i} className="experience-item">
                    <div className="experience-header">
                      <strong>{exp.title}</strong> at <strong>{exp.company}</strong>
                    </div>
                    <div className="experience-dates">
                      {exp.startDate} - {exp.endDate || 'Present'}
                    </div>
                    {exp.location && <div className="experience-location">{exp.location}</div>}
                    {exp.description && <div className="experience-description">{exp.description}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {contact.education && contact.education.length > 0 && (
            <div className="card-section">
              <h3>🎓 Education</h3>
              <div className="education-list">
                {contact.education.map((edu, i) => (
                  <div key={i} className="education-item">
                    <div className="education-header">
                      <strong>{edu.school}</strong>
                    </div>
                    {edu.degree && <div className="education-degree">{edu.degree}</div>}
                    <div className="education-dates">
                      {edu.startYear} - {edu.endYear || 'Present'}
                    </div>
                    {edu.activities && <div className="education-activities">{edu.activities}</div>}
                    {edu.notes && <div className="education-notes">{edu.notes}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills & Expertise */}
          {((contact.skills && contact.skills.length > 0) || (contact.expertise_areas && contact.expertise_areas.length > 0)) && (
            <div className="card-section">
              <h3>🎯 Skills & Expertise</h3>
              {contact.skills && contact.skills.length > 0 && (
                <div>
                  <strong>Skills:</strong>
                  <div className="tags">
                    {contact.skills.map((skill, i) => (
                      <span key={i} className="tag tag-skill">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
              {contact.expertise_areas && contact.expertise_areas.length > 0 && (
                <div>
                  <strong>Expertise Areas:</strong>
                  <div className="tags">
                    {contact.expertise_areas.map((area, i) => (
                      <span key={i} className="tag tag-expertise">{area}</span>
                    ))}
                  </div>
                </div>
              )}
              {contact.industries && contact.industries.length > 0 && (
                <div>
                  <strong>Industries:</strong>
                  <div className="tags">
                    {contact.industries.map((industry, i) => (
                      <span key={i} className="tag tag-industry">{industry}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Career Stage & Insights */}
          {(contact.career_stage || contact.interests) && (
            <div className="card-section">
              <h3>💡 Professional Insights</h3>
              <div className="info-grid">
                {contact.career_stage && <div><strong>Career Stage:</strong> {contact.career_stage}</div>}
                {contact.interests && contact.interests.length > 0 && (
                  <div>
                    <strong>Interests:</strong>
                    <div className="tags">
                      {contact.interests.map((interest, i) => (
                        <span key={i} className="tag tag-interest">{interest}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Connection & Tags */}
          <div className="card-section">
            <h3>🤝 Connection Details</h3>
            <div className="info-grid">
              {contact.connectedOn && <div><strong>Connected On:</strong> {contact.connectedOn}</div>}
              {contact.source && <div><strong>Source:</strong> {contact.source}</div>}
              {localContact.tags && localContact.tags.length > 0 && (
                <div>
                  <strong>Custom Tags:</strong>
                  <div className="tags">
                    {localContact.tags.map((tag, i) => (
                      <span key={i} className="tag tag-custom">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Add Custom Tag Section */}
          <div className="card-section">
            <h3>📝 Add Custom Tags</h3>
            <div className="custom-tag-input">
              <input 
                type="text" 
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a custom tag (e.g., 'Hot Lead', 'Friend', 'Mentor')" 
                className="tag-input"
                disabled={isAddingTag}
              />
              <button 
                className="add-tag-btn" 
                onClick={handleAddTag}
                disabled={isAddingTag || !newTag.trim()}
              >
                {isAddingTag ? 'Adding...' : 'Add Tag'}
              </button>
            </div>
          </div>
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

  const handleContactClick = (contact) => {
    // Use the contact data we already have instead of fetching from non-existent endpoint
    setSelectedContact(contact);
  };

  const handleContactUpdate = (updatedContact) => {
    // Update the contact in both contacts and searchResults arrays
    const updateContactInArray = (contactsArray) => {
      return contactsArray.map(c => 
        c._id === updatedContact._id ? updatedContact : c
      );
    };
    
    setContacts(prev => updateContactInArray(prev));
    setSearchResults(prev => updateContactInArray(prev));
    setSelectedContact(updatedContact);
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
          onContactUpdate={handleContactUpdate}
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