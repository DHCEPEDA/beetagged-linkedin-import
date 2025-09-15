// BeeTagged API Configuration
// Auto-detect development vs production environment

const isProduction = window.location.hostname === 'www.beetagged.com' || 
                     window.location.hostname === 'beetagged.com' ||
                     window.location.hostname.includes('squarespace.com');

export const BACKEND_URL = isProduction 
  ? 'https://beetagged-app-53414697acd3.herokuapp.com'
  : 'http://localhost:5000';

// Generic API call function with proper CORS headers
export const apiCall = async (endpoint, options = {}) => {
  const url = `${BACKEND_URL}${endpoint}`;
  
  const response = await fetch(url, {
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    },
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
  }
};