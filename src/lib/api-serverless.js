// BeeTagged API Configuration for Serverless Backend
// Use this version when deploying to Vercel/Netlify serverless functions

// Choose your serverless platform URL:
// export const BACKEND_URL = 'https://beetagged-serverless.vercel.app'; // Vercel
export const BACKEND_URL = 'https://beetagged-app.netlify.app'; // Netlify
// export const BACKEND_URL = 'https://your-custom-domain.com'; // Custom domain

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

// Specific API functions for BeeTagged Serverless
export const contactsAPI = {
  // Load all contacts with pagination
  getAll: async (page = 1, limit = 50) => {
    const response = await fetch(`${BACKEND_URL}/api/contacts?page=${page}&limit=${limit}`, {
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