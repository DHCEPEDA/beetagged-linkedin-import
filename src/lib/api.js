// BeeTagged API Configuration
// Always use full Heroku URL - never relative paths

export const BACKEND_URL = 'https://beetagged-app-53414697acd3.herokuapp.com';

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
  }
};