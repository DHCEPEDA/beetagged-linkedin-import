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

// Duplicate Resolution Modal Component
const DuplicateResolutionModal = ({ potentialDuplicates, newContacts, onClose, onMergeDecisions }) => {
  const [decisions, setDecisions] = useState(() => {
    const initialDecisions = {};
    potentialDuplicates.forEach((duplicate, index) => {
      initialDecisions[index] = {
        action: 'add', // default to adding as new
        newContact: duplicate.newContact,
        existingContactId: null
      };
    });
    return initialDecisions;
  });

  const handleDecisionChange = (index, action, existingContactId = null) => {
    setDecisions(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        action,
        existingContactId: action === 'merge' ? existingContactId : null
      }
    }));
  };

  const handleSubmit = () => {
    const mergeDecisions = Object.values(decisions);
    
    // Also add decisions for new contacts (no duplicates)
    newContacts.forEach(contact => {
      mergeDecisions.push({
        action: 'add',
        newContact: contact,
        existingContactId: null
      });
    });

    onMergeDecisions(mergeDecisions);
  };

  return (
    <div className="modal-overlay">
      <div className="contact-card" style={{ maxWidth: '800px', maxHeight: '90vh' }}>
        <div className="contact-card-header">
          <h2>Resolve Duplicate Contacts</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="contact-card-content">
          <div style={{ marginBottom: '20px' }}>
            <p>We found {potentialDuplicates.length} potential duplicate(s) and {newContacts.length} new contact(s). 
               Please choose how to handle each duplicate:</p>
          </div>

          {potentialDuplicates.map((duplicate, index) => (
            <div key={index} className="card-section" style={{ border: '1px solid #e5e5e5', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
              <h3>Potential Duplicate #{index + 1}</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
                {/* New Contact */}
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#059669' }}>New Contact</h4>
                  <div style={{ backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '6px' }}>
                    <div><strong>{duplicate.newContact.name}</strong></div>
                    {duplicate.newContact.email && <div>Email: {duplicate.newContact.email}</div>}
                    {duplicate.newContact.company && <div>Company: {duplicate.newContact.company}</div>}
                    {duplicate.newContact.position && <div>Position: {duplicate.newContact.position}</div>}
                    {duplicate.newContact.location && <div>Location: {duplicate.newContact.location}</div>}
                  </div>
                </div>

                {/* Existing Contacts */}
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#dc2626' }}>Existing Contact(s)</h4>
                  {duplicate.existingContacts.map((existing, idx) => (
                    <div key={idx} style={{ backgroundColor: '#fef2f2', padding: '12px', borderRadius: '6px', marginBottom: '8px' }}>
                      <div><strong>{existing.name}</strong></div>
                      {existing.email && <div>Email: {existing.email}</div>}
                      {existing.company && <div>Company: {existing.company}</div>}
                      {existing.position && <div>Position: {existing.position}</div>}
                      {existing.location && <div>Location: {existing.location}</div>}
                      
                      <button
                        className={`beetagged-button ${decisions[index]?.action === 'merge' && decisions[index]?.existingContactId === existing._id ? 'active' : ''}`}
                        style={{
                          marginTop: '8px',
                          padding: '4px 8px',
                          fontSize: '12px',
                          backgroundColor: decisions[index]?.action === 'merge' && decisions[index]?.existingContactId === existing._id ? '#059669' : '#6b7280',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleDecisionChange(index, 'merge', existing._id)}
                      >
                        Merge with this contact
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  className={`beetagged-button ${decisions[index]?.action === 'add' ? 'active' : ''}`}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: decisions[index]?.action === 'add' ? '#2196f3' : '#e5e5e5',
                    color: decisions[index]?.action === 'add' ? 'white' : '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleDecisionChange(index, 'add')}
                >
                  Add as New Contact
                </button>
                
                <button
                  className={`beetagged-button ${decisions[index]?.action === 'skip' ? 'active' : ''}`}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: decisions[index]?.action === 'skip' ? '#dc2626' : '#e5e5e5',
                    color: decisions[index]?.action === 'skip' ? 'white' : '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleDecisionChange(index, 'skip')}
                >
                  Skip This Contact
                </button>
              </div>
            </div>
          ))}

          {newContacts.length > 0 && (
            <div className="card-section" style={{ border: '1px solid #10b981', borderRadius: '8px', padding: '16px', backgroundColor: '#f0fdf4' }}>
              <h3 style={{ color: '#059669' }}>New Contacts (No Duplicates Found)</h3>
              <p>These {newContacts.length} contact(s) will be added automatically:</p>
              <div style={{ display: 'grid', gap: '8px' }}>
                {newContacts.slice(0, 5).map((contact, idx) => (
                  <div key={idx} style={{ padding: '8px', backgroundColor: 'white', borderRadius: '4px' }}>
                    <strong>{contact.name}</strong>
                    {contact.company && ` - ${contact.company}`}
                  </div>
                ))}
                {newContacts.length > 5 && (
                  <div style={{ padding: '8px', fontStyle: 'italic', color: '#6b7280' }}>
                    ... and {newContacts.length - 5} more contacts
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e5e5' }}>
            <button
              className="beetagged-button"
              style={{
                padding: '12px 24px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="beetagged-button"
              style={{
                padding: '12px 24px',
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
              onClick={handleSubmit}
            >
              Apply Decisions
            </button>
          </div>
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
  const [potentialDuplicates, setPotentialDuplicates] = useState([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [newContacts, setNewContacts] = useState([]);

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
      
      if (result.hasDuplicates) {
        // Show duplicate resolution UI
        setPotentialDuplicates(result.potentialDuplicates || []);
        setNewContacts(result.newContacts || []);
        setShowDuplicateModal(true);
        setUploadStatus(`Found ${result.potentialDuplicates?.length || 0} potential duplicates. Please review.`);
      } else {
        // Normal import success
        setUploadStatus(`Success! Imported ${result.count || result.added || 0} contacts`);
        loadContacts(); // Reload contacts after import
        setTimeout(() => setUploadStatus(''), 3000);
      }
    } catch (error) {
      console.error('Upload error:', error);
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

  const handleMergeDecisions = async (mergeDecisions) => {
    try {
      setUploadStatus('Processing merge decisions...');
      const result = await contactsAPI.mergeDuplicates(mergeDecisions);
      
      setShowDuplicateModal(false);
      setPotentialDuplicates([]);
      setNewContacts([]);
      
      setUploadStatus(`${result.message}`);
      loadContacts(); // Reload contacts after merge
      setTimeout(() => setUploadStatus(''), 5000);
    } catch (error) {
      console.error('Merge error:', error);
      setUploadStatus('Failed to process merge decisions.');
      setTimeout(() => setUploadStatus(''), 3000);
    }
  };

  const closeDuplicateModal = () => {
    setShowDuplicateModal(false);
    setPotentialDuplicates([]);
    setNewContacts([]);
    setUploadStatus('');
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
      
      {showDuplicateModal && (
        <DuplicateResolutionModal 
          potentialDuplicates={potentialDuplicates}
          newContacts={newContacts}
          onClose={closeDuplicateModal}
          onMergeDecisions={handleMergeDecisions}
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