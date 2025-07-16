import React, { useState, useEffect } from 'react';
import './App.css';

// LinkedIn Import Component with proper React state management
const LinkedInImport = ({ onImportSuccess, onBack }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fileInput = e.target.querySelector('input[type="file"]');
    
    if (!fileInput.files[0]) {
      setError('Please select a CSV file');
      return;
    }

    const formData = new FormData();
    formData.append('linkedinCsv', fileInput.files[0]);

    setIsUploading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/import/linkedin', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setResult(`Successfully imported ${data.count} contacts!`);
        // Call parent callback to refresh contacts and navigate
        if (onImportSuccess) {
          onImportSuccess(data);
        }
      } else {
        setError(data.message || 'Import failed');
      }
    } catch (error) {
      setError('Error: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f8fafc',
      minHeight: '100vh'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#2563eb', marginBottom: '10px' }}>
            🐝 Import LinkedIn Contacts
          </h1>
          <button
            onClick={onBack}
            style={{
              color: '#666',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ← Back to Home
          </button>
        </div>

      <div style={{
        backgroundColor: '#0077b5',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '30px'
      }}>
        <h2 style={{ margin: '0 0 15px 0' }}>Step 1: Export from LinkedIn</h2>
        <ol style={{ margin: 0, paddingLeft: '20px' }}>
          <li>Go to LinkedIn.com and log in</li>
          <li>Click "Me" → "Settings & Privacy"</li>
          <li>Click "Data Privacy" → "Get a copy of your data"</li>
          <li>Select "Connections" and click "Request archive"</li>
          <li>LinkedIn will email you a download link</li>
          <li>Download and extract the .csv file</li>
        </ol>
      </div>

        <div style={{
          backgroundColor: '#f0f9ff',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <h2 style={{ margin: '0 0 15px 0', color: '#2563eb' }}>Step 2: Upload Your CSV</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="file"
              accept=".csv"
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginBottom: '15px'
              }}
            />
            <button
              type="submit"
              disabled={isUploading}
              style={{
                backgroundColor: isUploading ? '#94a3b8' : '#0077b5',
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                width: '100%'
              }}
            >
              {isUploading ? 'Importing...' : 'Upload and Import Contacts'}
            </button>
          </form>
        </div>

        {/* Loading, Success, and Error Messages */}
        {isUploading && (
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <div style={{
              display: 'inline-block',
              width: '20px',
              height: '20px',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #0077b5',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p>Importing contacts...</p>
          </div>
        )}

        {result && (
          <div style={{
            margin: '20px 0',
            padding: '15px',
            borderRadius: '5px',
            backgroundColor: '#dcfce7',
            color: '#059669'
          }}>
            {result}
          </div>
        )}

        {error && (
          <div style={{
            margin: '20px 0',
            padding: '15px',
            borderRadius: '5px',
            backgroundColor: '#fee2e2',
            color: '#dc2626'
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced SearchContacts component with comprehensive error handling
const SearchContacts = ({ onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/search/natural?q=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Search failed with status: ${response.status}`);
      }
      const data = await response.json();
      setResults(data.results || []);
      if ((data.results || []).length === 0) {
        setError('No contacts found matching your search.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'An error occurred during search.');
      setResults([]);
    }
    setLoading(false);
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f8fafc',
      minHeight: '100vh'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#2563eb', marginBottom: '10px' }}>
            🐝 Search Contacts
          </h1>
          <button
            onClick={onBack}
            style={{
              color: '#666',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ← Back to Home
          </button>
        </div>

        <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search contacts... (e.g., 'Who works at Google?', 'marketing', 'Seattle')"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px',
              marginBottom: '15px',
              boxSizing: 'border-box'
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              width: '100%'
            }}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Display Search Results or Loading/Error Messages */}
        {loading && <p>Loading results...</p>}
        
        {error && !loading && <p style={{ color: 'red' }}>{error}</p>}

        {!loading && !error && results.length > 0 && (
          <div className="searchResultsContainer" style={{ marginTop: '20px' }}>
            <h3>Search Results ({results.length})</h3>
            <ul style={{ listStyleType: 'none', padding: 0, maxHeight: '400px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '4px' }}>
              {results.map((contact, index) => (
                <li key={contact.id || index} style={{ padding: '10px', borderBottom: '1px solid #f0f0f0' }}>
                  <strong>{contact.name}</strong>
                  {contact.title && <span> - {contact.title}</span>}
                  {contact.company && <span> at {contact.company}</span>}
                  {contact.location && <span> ({contact.location})</span>}
                  
                  {/* LinkedIn/Facebook profile links if available */}
                  {contact.linkedInData && contact.linkedInData.profileUrl && (
                    <p style={{ margin: '5px 0 0', fontSize: '0.9em' }}>
                      LI Profile: <a href={contact.linkedInData.profileUrl} target="_blank" rel="noopener noreferrer">{contact.linkedInData.profileUrl}</a>
                    </p>
                  )}
                  {contact.facebookData && contact.facebookData.profileUrl && (
                    <p style={{ margin: '5px 0 0', fontSize: '0.9em' }}>
                      FB Profile: <a href={contact.facebookData.profileUrl} target="_blank" rel="noopener noreferrer">{contact.facebookData.profileUrl}</a>
                    </p>
                  )}
                  
                  {/* Email if available */}
                  {contact.email && (
                    <p style={{ margin: '5px 0 0', fontSize: '0.9em', color: '#666' }}>
                      Email: <a href={`mailto:${contact.email}`}>{contact.email}</a>
                    </p>
                  )}
                  
                  {/* Tags if available */}
                  {contact.tags && contact.tags.length > 0 && (
                    <p style={{ margin: '5px 0 0', fontSize: '0.8em' }}>
                      Tags: {contact.tags.join(', ')}
                    </p>
                  )}
                  
                  {contact.source && <span style={{ fontSize: '0.8em', color: '#777', display: 'block' }}> (Source: {contact.source})</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {!loading && !error && results.length === 0 && searchTerm.trim() !== '' && (
          <p>No results found for "{searchTerm}".</p>
        )}
      </div>
    </div>
  );
};

// Contact List Display Component
const ContactList = ({ contacts, onBack }) => {
  const [displayContacts, setDisplayContacts] = useState(contacts);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setDisplayContacts(contacts);
    } else {
      const filtered = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contact.company && contact.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contact.title && contact.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contact.location && contact.location.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setDisplayContacts(filtered);
    }
  }, [searchTerm, contacts]);

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f8fafc',
      minHeight: '100vh'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#2563eb', marginBottom: '10px' }}>
            🐝 Your Contacts ({contacts.length})
          </h1>
          <button
            onClick={onBack}
            style={{
              color: '#666',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ← Back to Home
          </button>
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter contacts..."
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '16px',
            marginBottom: '20px',
            boxSizing: 'border-box'
          }}
        />

        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {displayContacts.map((contact, index) => (
            <div key={contact.id || index} style={{
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '10px',
              backgroundColor: '#f9f9f9'
            }}>
              <h4 style={{ margin: '0 0 5px 0', color: '#2563eb' }}>{contact.name}</h4>
              {contact.title && contact.company && (
                <p style={{ margin: '0 0 5px 0', color: '#666' }}>{contact.title} at {contact.company}</p>
              )}
              {contact.location && (
                <p style={{ margin: '0 0 5px 0', color: '#888', fontSize: '14px' }}>{contact.location}</p>
              )}
              {contact.email && (
                <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
                  <a href={`mailto:${contact.email}`} style={{ color: '#2563eb' }}>{contact.email}</a>
                </p>
              )}
              <span style={{ fontSize: '0.8em', color: '#777' }}>Source: {contact.source}</span>
            </div>
          ))}
        </div>

        {displayContacts.length === 0 && searchTerm && (
          <p style={{ textAlign: 'center', color: '#666', margin: '40px 0' }}>
            No contacts found matching "{searchTerm}"
          </p>
        )}

        {contacts.length === 0 && (
          <p style={{ textAlign: 'center', color: '#666', margin: '40px 0' }}>
            No contacts imported yet. Use the "Import LI Contacts" button to get started.
          </p>
        )}
      </div>
    </div>
  );
};

// Main App component with comprehensive state management
function App() {
  const [currentView, setCurrentView] = useState('home');
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch contacts from API
  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/contacts');
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load contacts on app start
  useEffect(() => {
    fetchContacts();
  }, []);

  // Handle successful LinkedIn import
  const handleImportSuccess = async (importResult) => {
    // Refresh contacts from server
    await fetchContacts();
    // Navigate to contacts view to show imported contacts
    setCurrentView('contacts');
  };

  // Navigation handlers
  const handleBackToHome = () => setCurrentView('home');

  if (currentView === 'import') {
    return <LinkedInImport onImportSuccess={handleImportSuccess} onBack={handleBackToHome} />;
  }

  if (currentView === 'search') {
    return <SearchContacts onBack={handleBackToHome} />;
  }

  if (currentView === 'contacts') {
    return <ContactList contacts={contacts} onBack={handleBackToHome} />;
  }

  // Home view
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '20px'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#2563eb', marginBottom: '10px' }}>
          🐝 BeeTagged
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#666', maxWidth: '600px', lineHeight: '1.6' }}>
          Professional Contact Intelligence Platform
        </p>
        {contacts.length > 0 && (
          <p style={{ fontSize: '1rem', color: '#059669', marginTop: '10px' }}>
            {contacts.length} contacts imported
          </p>
        )}
      </div>

      <div style={{
        display: 'flex',
        gap: '20px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <button
          onClick={() => setCurrentView('import')}
          style={{
            padding: '15px 30px',
            backgroundColor: '#0077b5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: 'pointer',
            minWidth: '200px'
          }}
        >
          Import LI Contacts
        </button>

        <button
          onClick={() => setCurrentView('search')}
          style={{
            padding: '15px 30px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: 'pointer',
            minWidth: '200px'
          }}
        >
          Search
        </button>

        {contacts.length > 0 && (
          <button
            onClick={() => setCurrentView('contacts')}
            style={{
              padding: '15px 30px',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              minWidth: '200px'
            }}
          >
            View Contacts ({contacts.length})
          </button>
        )}
      </div>
    </div>
  );
}

export default App;