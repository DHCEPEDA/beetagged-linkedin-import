import React, { useState } from 'react';
import './App.css';

// Simple import instructions component
const ImportInstructions = () => (
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
          onClick={() => window.location.reload()}
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
        <form onSubmit={async (e) => {
          e.preventDefault();
          const fileInput = document.getElementById('csvFile');
          const loading = document.getElementById('loading');
          const result = document.getElementById('result');
          
          if (!fileInput.files[0]) {
            alert('Please select a CSV file');
            return;
          }

          const formData = new FormData();
          formData.append('csvFile', fileInput.files[0]);

          loading.style.display = 'block';
          result.style.display = 'none';

          try {
            const response = await fetch('/api/import/linkedin', {
              method: 'POST',
              body: formData
            });

            const data = await response.json();
            loading.style.display = 'none';

            if (data.success) {
              result.innerHTML = 'Successfully imported ' + data.count + ' contacts!';
              result.style.backgroundColor = '#dcfce7';
              result.style.color = '#059669';
              result.style.display = 'block';
              setTimeout(() => window.location.reload(), 2000);
            } else {
              result.innerHTML = 'Error: ' + (data.message || 'Import failed');
              result.style.backgroundColor = '#fee2e2';
              result.style.color = '#dc2626';
              result.style.display = 'block';
            }
          } catch (error) {
            loading.style.display = 'none';
            result.innerHTML = 'Error: ' + error.message;
            result.style.backgroundColor = '#fee2e2';
            result.style.color = '#dc2626';
            result.style.display = 'block';
          }
        }}>
          <input
            type="file"
            id="csvFile"
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
            style={{
              backgroundColor: '#0077b5',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            Upload and Import Contacts
          </button>
        </form>
      </div>

      <div id="loading" style={{ display: 'none', textAlign: 'center', margin: '20px 0' }}>
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

      <div id="result" style={{
        margin: '20px 0',
        padding: '15px',
        borderRadius: '5px',
        display: 'none'
      }} />
    </div>
  </div>
);

// Simple search component
const SearchContacts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/search/natural?q=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
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
            onClick={() => window.location.reload()}
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

        <form onSubmit={handleSearch} style={{ marginBottom: '30px' }}>
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
              marginBottom: '15px'
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

        {results.length > 0 && (
          <div>
            <h3 style={{ marginBottom: '20px' }}>Results ({results.length})</h3>
            {results.map((contact, index) => (
              <div key={index} style={{
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '10px',
                backgroundColor: '#f9f9f9'
              }}>
                <h4 style={{ margin: '0 0 5px 0', color: '#2563eb' }}>{contact.name}</h4>
                <p style={{ margin: '0 0 5px 0', color: '#666' }}>{contact.company} - {contact.position}</p>
                <p style={{ margin: '0', color: '#888', fontSize: '14px' }}>{contact.location}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Main App component
function App() {
  const [currentView, setCurrentView] = useState('home');

  if (currentView === 'import') {
    return <ImportInstructions />;
  }

  if (currentView === 'search') {
    return <SearchContacts />;
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
      </div>
    </div>
  );
}

export default App;