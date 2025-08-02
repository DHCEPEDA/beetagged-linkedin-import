// Backend URL configuration for different environments
export const BACKEND_URL = process.env.NODE_ENV === 'production' 
  ? 'https://beetagged-app-53414697acd3.herokuapp.com'
  : 'http://localhost:5000';

// API endpoints
export const API_ENDPOINTS = {
  HEALTH: `${BACKEND_URL}/health`,
  CONTACTS: `${BACKEND_URL}/api/contacts`,
  SEARCH: `${BACKEND_URL}/api/search/natural`,
  IMPORT_LINKEDIN: `${BACKEND_URL}/api/import/linkedin`,
} as const;

// App configuration
export const APP_CONFIG = {
  NAME: 'BeeTagged',
  VERSION: '1.0.0',
  DESCRIPTION: 'Professional Contact Search Platform',
} as const;