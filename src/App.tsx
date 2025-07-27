import React, { useState, useEffect } from 'react';
import { Search, Upload, Users, Zap } from 'lucide-react';
import './App.css';

const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:5000';

interface Contact {
  _id: string;
  name: string;
  company?: string;
  position?: string;
  location?: string;
  email?: string;
  tags?: string[];
}

function App() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [searchPressed, setSearchPressed] = useState(false);

  // Check backend connection on mount
  useEffect(() => {
    checkBackendHealth();
    loadContacts();
  }, []);

  const checkBackendHealth = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      if (response.ok) {
        setBackendStatus('connected');
      } else {
        setBackendStatus('error');
      }
    } catch (error) {
      setBackendStatus('error');
      console.error('Backend health check failed:', error);
    }
  };

  const loadContacts = async (): Promise<void> => {
    try {
      console.log('Loading contacts from:', `${BACKEND_URL}/api/contacts`);
      const response = await fetch(`${BACKEND_URL}/api/contacts`);
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded contacts:', data.length, 'items');
        setContacts(data);
        setSearchResults(data);
      } else {
        console.error('Failed to load contacts - response not OK:', response.status);
      }
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  };

  const handleSearch = async (query: string): Promise<void> => {
    if (!query.trim()) {
      setSearchResults(contacts);
      return;
    }

    setLoading(true);
    try {
      console.log('Searching for:', query);
      const response = await fetch(`${BACKEND_URL}/api/search/natural?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const result = await response.json();
        console.log('Search results:', result.results?.length || 0, 'found');
        setSearchResults(result.results || []);
      } else {
        // Fallback to local search
        const filtered = contacts.filter((contact: Contact) =>
          contact.name?.toLowerCase().includes(query.toLowerCase()) ||
          contact.company?.toLowerCase().includes(query.toLowerCase()) ||
          contact.position?.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(filtered);
      }
    } catch (error) {
      console.error('Search failed:', error);
      // Fallback to local search
      const filtered = contacts.filter((contact: Contact) =>
        contact.name?.toLowerCase().includes(query.toLowerCase()) ||
        contact.company?.toLowerCase().includes(query.toLowerCase()) ||
        contact.position?.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setSearchPressed(true);
      setTimeout(() => setSearchPressed(false), 200);
      handleSearch(searchQuery);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🐝</div>
              <h1 className="text-2xl font-bold text-gray-900">BeeTagged</h1>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                backendStatus === 'connected' 
                  ? 'bg-green-100 text-green-800' 
                  : backendStatus === 'error'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {backendStatus === 'connected' ? '✓ Connected' : 
                 backendStatus === 'error' ? '✗ Backend Error' : '◦ Checking...'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Professional Contact Intelligence
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Search your network with natural language queries like "Who works at Google?"
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything: 'engineers at Microsoft', 'contacts in Austin', 'who works at startups'..."
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg transition-all duration-200 ${
                  searchPressed 
                    ? 'border-blue-500 ring-2 ring-blue-200 scale-[1.02]' 
                    : loading 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              />
            </div>
            <button
              onClick={() => handleSearch(searchQuery)}
              disabled={loading}
              className="mt-3 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <Search className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="text-lg font-semibold mb-2">AI-Powered Search</h3>
            <p className="text-gray-600">Natural language queries to find exactly who you're looking for</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <Upload className="h-8 w-8 text-green-600 mb-3" />
            <h3 className="text-lg font-semibold mb-2">LinkedIn Import</h3>
            <p className="text-gray-600">Import your professional connections from LinkedIn CSV exports</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <Zap className="h-8 w-8 text-purple-600 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Smart Tagging</h3>
            <p className="text-gray-600">Automatic categorization by company, role, and location</p>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {searchQuery ? `Search Results (${searchResults.length})` : `All Contacts (${contacts.length})`}
              </h3>
              <Users className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          <div className="p-6">
            {searchResults.length === 0 && searchQuery ? (
              <div className="text-center py-8 text-gray-500">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg mb-2">No contacts found</p>
                <p>Try a different search query</p>
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg mb-2">No contacts yet</p>
                <p>Import your LinkedIn connections to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {searchResults.map((contact) => (
                  <div key={contact._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{contact.name}</h4>
                        {contact.position && contact.company && (
                          <p className="text-gray-600">{contact.position} at {contact.company}</p>
                        )}
                        {contact.location && (
                          <p className="text-sm text-gray-500 mt-1">{contact.location}</p>
                        )}
                        {contact.tags && contact.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {contact.tags.map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;