# Backend URL Integration Guide

## Critical: Always Use Full Heroku URL

### ❌ WRONG - Relative Paths:
```javascript
const response = await fetch('/api/import/linkedin', {...});
const response = await fetch('/api/contacts', {...});
const response = await fetch('/health', {...});
```

### ✅ CORRECT - Full Heroku URL:
```javascript
const BACKEND_URL = 'https://beetagged-app-53414697acd3.herokuapp.com';
const response = await fetch(`${BACKEND_URL}/api/import/linkedin`, {...});
const response = await fetch(`${BACKEND_URL}/api/contacts`, {...});
const response = await fetch(`${BACKEND_URL}/health`, {...});
```

## For Lovable React Frontend:

### 1. Create API Configuration:
```javascript
// src/lib/api.js
export const BACKEND_URL = 'https://beetagged-app-53414697acd3.herokuapp.com';

export const apiCall = async (endpoint, options = {}) => {
  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    },
    ...options
  });
  return response;
};
```

### 2. Use in React Components:
```javascript
// Import CSV
const uploadCSV = async (file) => {
  const formData = new FormData();
  formData.append('linkedinCsv', file);
  
  const response = await fetch(`${BACKEND_URL}/api/import/linkedin`, {
    method: 'POST',
    mode: 'cors',
    body: formData
  });
};

// Search Contacts
const searchContacts = async (query) => {
  const response = await fetch(`${BACKEND_URL}/api/search/natural?q=${encodeURIComponent(query)}`, {
    method: 'GET',
    mode: 'cors',
    headers: { 'Accept': 'application/json' }
  });
};

// Load All Contacts
const loadContacts = async () => {
  const response = await fetch(`${BACKEND_URL}/api/contacts`, {
    method: 'GET',
    mode: 'cors',
    headers: { 'Accept': 'application/json' }
  });
};
```

## Current Widget Status:
The SQUARESPACE-FINAL-WIDGET.html already uses correct full URLs:
- Backend URL: `https://beetagged-app-53414697acd3.herokuapp.com`
- All API calls properly formatted with full paths
- CORS headers included for cross-origin requests

## Key Points:
1. **Never use relative paths** when calling external APIs
2. **Always include CORS mode** for cross-origin requests
3. **Use the complete Heroku URL** for all backend communication
4. **Test with browser console** to verify no CORS errors