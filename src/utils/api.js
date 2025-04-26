import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: '', // Use relative URLs
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to add auth token
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

// Add a response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Auto logout if 401 response returned from api
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      
      // Don't redirect during login/register
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API calls
export const loginUser = async (email, password) => {
  try {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Login failed';
  }
};

export const registerUser = async (name, email, password) => {
  try {
    const response = await api.post('/api/auth/register', { name, email, password });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Registration failed';
  }
};

export const socialAuth = async (provider, userData) => {
  try {
    const response = await api.post(`/api/auth/${provider}`, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || `${provider} authentication failed`;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/api/auth/me');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to get user data';
  }
};

// Contacts API calls
export const getContacts = async () => {
  try {
    const response = await api.get('/api/contacts');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch contacts';
  }
};

export const getContact = async (id) => {
  try {
    const response = await api.get(`/api/contacts/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch contact';
  }
};

export const createContact = async (contactData) => {
  try {
    const response = await api.post('/api/contacts', contactData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to create contact';
  }
};

export const updateContact = async (id, contactData) => {
  try {
    const response = await api.put(`/api/contacts/${id}`, contactData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update contact';
  }
};

export const deleteContact = async (id) => {
  try {
    const response = await api.delete(`/api/contacts/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to delete contact';
  }
};

export const importPhoneContacts = async () => {
  try {
    const response = await api.post('/api/contacts/import/phone');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to import phone contacts';
  }
};

export const importSocialContacts = async (provider) => {
  try {
    const response = await api.post(`/api/contacts/import/${provider}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || `Failed to import ${provider} contacts`;
  }
};

// Tags API calls
export const getTags = async () => {
  try {
    const response = await api.get('/api/tags');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch tags';
  }
};

export const createTag = async (tagData) => {
  try {
    const response = await api.post('/api/tags', tagData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to create tag';
  }
};

export const updateTag = async (id, tagData) => {
  try {
    const response = await api.put(`/api/tags/${id}`, tagData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update tag';
  }
};

export const deleteTag = async (id) => {
  try {
    const response = await api.delete(`/api/tags/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to delete tag';
  }
};

export const addTagToContact = async (contactId, tagId) => {
  try {
    const response = await api.post(`/api/contacts/${contactId}/tags/${tagId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to add tag to contact';
  }
};

export const removeTagFromContact = async (contactId, tagId) => {
  try {
    const response = await api.delete(`/api/contacts/${contactId}/tags/${tagId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to remove tag from contact';
  }
};

// Groups API calls
export const getGroups = async () => {
  try {
    const response = await api.get('/api/groups');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch groups';
  }
};

export const getGroup = async (id) => {
  try {
    const response = await api.get(`/api/groups/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch group';
  }
};

export const getGroupMembers = async (id) => {
  try {
    const response = await api.get(`/api/groups/${id}/members`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch group members';
  }
};

export const createGroup = async (groupData) => {
  try {
    const response = await api.post('/api/groups', groupData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to create group';
  }
};

export const updateGroup = async (id, groupData) => {
  try {
    const response = await api.put(`/api/groups/${id}`, groupData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update group';
  }
};

export const deleteGroup = async (id) => {
  try {
    const response = await api.delete(`/api/groups/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to delete group';
  }
};

export default api;