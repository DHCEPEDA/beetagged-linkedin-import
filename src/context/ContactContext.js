import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

export const ContactContext = createContext();

export const ContactProvider = ({ children }) => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [tags, setTags] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTag, setActiveTag] = useState(null);
  
  const { user } = useAuth();
  
  // Load contacts when user is authenticated
  useEffect(() => {
    if (user) {
      loadContacts();
      loadTags();
      loadGroups();
    } else {
      // Clear data when user logs out
      setContacts([]);
      setFilteredContacts([]);
      setTags([]);
      setGroups([]);
    }
  }, [user]);
  
  // Filter contacts based on search term and active tag
  useEffect(() => {
    let filtered = [...contacts];
    
    // Filter by search term
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(contact => 
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contact.phone && contact.phone.includes(searchTerm))
      );
    }
    
    // Filter by tag
    if (activeTag) {
      filtered = filtered.filter(contact => 
        contact.tags && contact.tags.some(tag => tag._id === activeTag)
      );
    }
    
    setFilteredContacts(filtered);
  }, [contacts, searchTerm, activeTag]);
  
  // Load all contacts
  const loadContacts = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get('/api/contacts');
      
      if (res.data.success) {
        setContacts(res.data.data);
        setFilteredContacts(res.data.data);
        setError(null);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
      setError('Failed to load contacts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load all tags
  const loadTags = async () => {
    try {
      const res = await axios.get('/api/tags');
      
      if (res.data.success) {
        setTags(res.data.data);
      }
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };
  
  // Load all groups
  const loadGroups = async () => {
    try {
      const res = await axios.get('/api/groups');
      
      if (res.data.success) {
        setGroups(res.data.data);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };
  
  // Get a single contact
  const getContact = async (id) => {
    try {
      setIsLoading(true);
      const res = await axios.get(`/api/contacts/${id}`);
      
      if (res.data.success) {
        return res.data.data;
      }
    } catch (error) {
      console.error('Error getting contact:', error);
      setError('Failed to load contact details. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create a new contact
  const createContact = async (contactData) => {
    try {
      setIsLoading(true);
      const res = await axios.post('/api/contacts', contactData);
      
      if (res.data.success) {
        setContacts([...contacts, res.data.data]);
        setError(null);
        return res.data.data;
      }
    } catch (error) {
      console.error('Error creating contact:', error);
      setError(error.response?.data?.message || 'Failed to create contact. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update a contact
  const updateContact = async (id, contactData) => {
    try {
      setIsLoading(true);
      const res = await axios.put(`/api/contacts/${id}`, contactData);
      
      if (res.data.success) {
        setContacts(contacts.map(contact => 
          contact._id === id ? res.data.data : contact
        ));
        setError(null);
        return res.data.data;
      }
    } catch (error) {
      console.error('Error updating contact:', error);
      setError(error.response?.data?.message || 'Failed to update contact. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete a contact
  const deleteContact = async (id) => {
    try {
      setIsLoading(true);
      const res = await axios.delete(`/api/contacts/${id}`);
      
      if (res.data.success) {
        setContacts(contacts.filter(contact => contact._id !== id));
        setError(null);
        return true;
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      setError(error.response?.data?.message || 'Failed to delete contact. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  

  
  // Add a tag to a contact
  const addTagToContact = async (contactId, tagId) => {
    try {
      setIsLoading(true);
      const res = await axios.post(`/api/contacts/${contactId}/tags/${tagId}`);
      
      if (res.data.success) {
        setContacts(contacts.map(contact => 
          contact._id === contactId ? res.data.data : contact
        ));
        setError(null);
        return res.data.data;
      }
    } catch (error) {
      console.error('Error adding tag to contact:', error);
      setError(error.response?.data?.message || 'Failed to add tag. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Remove a tag from a contact
  const removeTagFromContact = async (contactId, tagId) => {
    try {
      setIsLoading(true);
      const res = await axios.delete(`/api/contacts/${contactId}/tags/${tagId}`);
      
      if (res.data.success) {
        setContacts(contacts.map(contact => 
          contact._id === contactId ? res.data.data : contact
        ));
        setError(null);
        return res.data.data;
      }
    } catch (error) {
      console.error('Error removing tag from contact:', error);
      setError(error.response?.data?.message || 'Failed to remove tag. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create a tag
  const createTag = async (tagData) => {
    try {
      setIsLoading(true);
      const res = await axios.post('/api/tags', tagData);
      
      if (res.data.success) {
        setTags([...tags, res.data.data]);
        setError(null);
        return res.data.data;
      }
    } catch (error) {
      console.error('Error creating tag:', error);
      setError(error.response?.data?.message || 'Failed to create tag. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete a tag
  const deleteTag = async (id) => {
    try {
      setIsLoading(true);
      const res = await axios.delete(`/api/tags/${id}`);
      
      if (res.data.success) {
        setTags(tags.filter(tag => tag._id !== id));
        setError(null);
        return true;
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
      setError(error.response?.data?.message || 'Failed to delete tag. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Import contacts from social network
  const importSocialContacts = async (provider) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const res = await axios.post(`/api/contacts/import/${provider}`);
      
      if (res.data.success) {
        // Refresh the contacts list
        await loadContacts();
        return {
          success: true,
          imported: res.data.imported || 0,
          message: res.data.message
        };
      } else {
        throw new Error(res.data.message || `Failed to import contacts from ${provider}`);
      }
    } catch (error) {
      console.error(`Error importing contacts from ${provider}:`, error);
      setError(error.response?.data?.message || `Failed to import contacts from ${provider}. Please try again.`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <ContactContext.Provider
      value={{
        contacts,
        filteredContacts,
        tags,
        groups,
        isLoading,
        error,
        searchTerm,
        setSearchTerm,
        activeTag,
        setActiveTag,
        loadContacts,
        getContact,
        createContact,
        updateContact,
        deleteContact,
        importSocialContacts,
        addTagToContact,
        removeTagFromContact,
        createTag,
        deleteTag
      }}
    >
      {children}
    </ContactContext.Provider>
  );
};

// Custom hook to use the contact context
export const useContacts = () => {
  const context = useContext(ContactContext);
  
  if (!context) {
    throw new Error('useContacts must be used within a ContactProvider');
  }
  
  return context;
};