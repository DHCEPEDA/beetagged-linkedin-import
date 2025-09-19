// BeeTagged API Configuration
// Auto-detect development vs production environment

const isProduction = window.location.hostname === 'www.beetagged.com' || 
                     window.location.hostname === 'beetagged.com' ||
                     window.location.hostname.includes('squarespace.com');

export const BACKEND_URL = isProduction 
  ? 'https://beetagged-app-53414697acd3.herokuapp.com'
  : 'http://localhost:5000';

// Enhanced authentication token management with session persistence
let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
  // Persist token in localStorage for session continuity
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('beetagged_session_token', token);
  }
};

export const getAuthToken = () => {
  if (!authToken) {
    // Try to restore from localStorage first
    if (typeof localStorage !== 'undefined') {
      authToken = localStorage.getItem('beetagged_session_token');
    }
    
    if (!authToken) {
      // Generate a stable session token for development
      // Use a consistent user identifier for data continuity
      const userIdentifier = typeof localStorage !== 'undefined' ? 
        (localStorage.getItem('beetagged_user_id') || generateUserId()) :
        'anonymous-user';
      
      authToken = `beetagged-session-${userIdentifier}-${Date.now()}`;
      
      // Store the token and user ID
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('beetagged_session_token', authToken);
        localStorage.setItem('beetagged_user_id', userIdentifier);
      }
    }
  }
  return authToken;
};

// Generate a stable user identifier for session continuity
function generateUserId() {
  return 'user-' + Math.random().toString(36).substr(2, 16);
};

// Initialize token on module load
getAuthToken();

// Generic API call function with proper CORS headers
export const apiCall = async (endpoint, options = {}) => {
  const url = `${BACKEND_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers
  };
  
  // Add authorization header for protected endpoints
  if (endpoint.includes('/merge') || endpoint.includes('/import')) {
    headers['Authorization'] = `Bearer ${getAuthToken()}`;
  }
  
  const response = await fetch(url, {
    mode: 'cors',
    headers,
    ...options
  });
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }
  
  return response;
};

// Specific API functions for BeeTagged
export const contactsAPI = {
  // Load all contacts
  getAll: async () => {
    const response = await fetch(`${BACKEND_URL}/api/contacts`, {
      method: 'GET',
      mode: 'cors',
      headers: { 'Accept': 'application/json' }
    });
    return response.json();
  },

  // Search contacts with natural language
  search: async (query) => {
    const response = await fetch(`${BACKEND_URL}/api/search/natural?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      mode: 'cors',
      headers: { 'Accept': 'application/json' }
    });
    return response.json();
  },

  // Import LinkedIn CSV
  importCSV: async (file) => {
    const formData = new FormData();
    formData.append('linkedinCsv', file);
    
    const response = await fetch(`${BACKEND_URL}/api/import/linkedin`, {
      method: 'POST',
      mode: 'cors',
      body: formData
    });
    return response.json();
  },

  // Check backend health
  health: async () => {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      mode: 'cors',
      headers: { 'Accept': 'application/json' }
    });
    return response.json();
  },

  // Update contact (for adding tags and other updates)
  updateContact: async (contactId, updateData) => {
    const response = await fetch(`${BACKEND_URL}/api/contacts/${contactId}`, {
      method: 'PUT',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update contact: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  },

  // Merge duplicate contacts
  mergeDuplicates: async (mergeDecisions) => {
    const response = await fetch(`${BACKEND_URL}/api/contacts/merge`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({ mergeDecisions })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to merge contacts: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }
};