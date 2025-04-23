import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle unauthorized errors (expired token, etc.)
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const registerUser = async (name, email, password) => {
  const response = await api.post('/auth/register', { name, email, password });
  return response.data;
};

export const socialAuth = async (provider, userData) => {
  const response = await api.post(`/auth/${provider}`, userData);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Contacts API calls
export const getContacts = async () => {
  const response = await api.get('/contacts');
  return response.data;
};

export const getContact = async (id) => {
  const response = await api.get(`/contacts/${id}`);
  return response.data;
};

export const createContact = async (contactData) => {
  const response = await api.post('/contacts', contactData);
  return response.data;
};

export const updateContact = async (id, contactData) => {
  const response = await api.put(`/contacts/${id}`, contactData);
  return response.data;
};

export const deleteContact = async (id) => {
  const response = await api.delete(`/contacts/${id}`);
  return response.data;
};

export const importPhoneContacts = async () => {
  const response = await api.post('/contacts/import/phone');
  return response.data;
};

export const importSocialContacts = async (provider) => {
  const response = await api.post(`/contacts/import/${provider}`);
  return response.data;
};

// Tags API calls
export const getTags = async () => {
  const response = await api.get('/tags');
  return response.data;
};

export const createTag = async (tagData) => {
  const response = await api.post('/tags', tagData);
  return response.data;
};

export const updateTag = async (id, tagData) => {
  const response = await api.put(`/tags/${id}`, tagData);
  return response.data;
};

export const deleteTag = async (id) => {
  const response = await api.delete(`/tags/${id}`);
  return response.data;
};

export const addTagToContact = async (contactId, tagId) => {
  const response = await api.post(`/contacts/${contactId}/tags/${tagId}`);
  return response.data;
};

export const removeTagFromContact = async (contactId, tagId) => {
  const response = await api.delete(`/contacts/${contactId}/tags/${tagId}`);
  return response.data;
};

// Groups API calls
export const getGroups = async () => {
  const response = await api.get('/groups');
  return response.data;
};

export const getGroup = async (id) => {
  const response = await api.get(`/groups/${id}`);
  return response.data;
};

export const getGroupMembers = async (id) => {
  const response = await api.get(`/groups/${id}/members`);
  return response.data;
};

export const createGroup = async (groupData) => {
  const response = await api.post('/groups', groupData);
  return response.data;
};

export const updateGroup = async (id, groupData) => {
  const response = await api.put(`/groups/${id}`, groupData);
  return response.data;
};

export const deleteGroup = async (id) => {
  const response = await api.delete(`/groups/${id}`);
  return response.data;
};

export default api;
