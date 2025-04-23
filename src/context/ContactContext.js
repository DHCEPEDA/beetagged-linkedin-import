import React, { createContext, useState, useCallback } from 'react';
import {
  getContacts as fetchContacts,
  getContact as fetchContact,
  createContact as createContactApi,
  updateContact as updateContactApi,
  deleteContact as deleteContactApi,
  importPhoneContacts as importPhoneContactsApi,
  importSocialContacts as importSocialContactsApi,
  getTags as fetchTags,
  createTag as createTagApi,
  updateTag as updateTagApi,
  deleteTag as deleteTagApi,
  addTagToContact as addTagApi,
  removeTagFromContact as removeTagApi,
  getGroups as fetchGroups,
  getGroup as fetchGroup,
  getGroupMembers as fetchGroupMembers,
  createGroup as createGroupApi,
  updateGroup as updateGroupApi,
  deleteGroup as deleteGroupApi
} from '../utils/api';

export const ContactContext = createContext();

export const ContactProvider = ({ children }) => {
  const [contacts, setContacts] = useState([]);
  const [tags, setTags] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Contact operations
  const getContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchContacts();
      setContacts(data);
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch contacts');
      setLoading(false);
      throw err;
    }
  }, []);

  const getContact = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchContact(id);
      // Update the contact in the contacts array if it exists
      setContacts(prevContacts => {
        const contactIndex = prevContacts.findIndex(c => c.id === id);
        if (contactIndex >= 0) {
          const updatedContacts = [...prevContacts];
          updatedContacts[contactIndex] = data;
          return updatedContacts;
        }
        return prevContacts;
      });
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch contact');
      setLoading(false);
      throw err;
    }
  }, []);

  const createContact = useCallback(async (contactData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await createContactApi(contactData);
      setContacts(prevContacts => [...prevContacts, data]);
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create contact');
      setLoading(false);
      throw err;
    }
  }, []);

  const updateContact = useCallback(async (id, contactData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await updateContactApi(id, contactData);
      setContacts(prevContacts => 
        prevContacts.map(contact => 
          contact.id === id ? { ...contact, ...data } : contact
        )
      );
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update contact');
      setLoading(false);
      throw err;
    }
  }, []);

  const deleteContact = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await deleteContactApi(id);
      setContacts(prevContacts => 
        prevContacts.filter(contact => contact.id !== id)
      );
      setLoading(false);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete contact');
      setLoading(false);
      throw err;
    }
  }, []);

  const importContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await importPhoneContactsApi();
      // Refresh contacts list after import
      await getContacts();
      setLoading(false);
      return results;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to import contacts');
      setLoading(false);
      throw err;
    }
  }, [getContacts]);

  const importSocialContacts = useCallback(async (provider) => {
    setLoading(true);
    setError(null);
    try {
      const results = await importSocialContactsApi(provider);
      // Refresh contacts list after import
      await getContacts();
      setLoading(false);
      return results;
    } catch (err) {
      setError(err.response?.data?.message || `Failed to import ${provider} contacts`);
      setLoading(false);
      throw err;
    }
  }, [getContacts]);

  // Tag operations
  const getTags = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTags();
      setTags(data);
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch tags');
      setLoading(false);
      throw err;
    }
  }, []);

  const createTag = useCallback(async (tagData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await createTagApi(tagData);
      setTags(prevTags => [...prevTags, data]);
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create tag');
      setLoading(false);
      throw err;
    }
  }, []);

  const updateTag = useCallback(async (id, tagData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await updateTagApi(id, tagData);
      setTags(prevTags => 
        prevTags.map(tag => 
          tag.id === id ? { ...tag, ...data } : tag
        )
      );
      
      // Update the tag in contacts that have it
      setContacts(prevContacts => 
        prevContacts.map(contact => {
          if (contact.tags.some(tag => tag.id === id)) {
            return {
              ...contact,
              tags: contact.tags.map(tag => 
                tag.id === id ? { ...tag, ...data } : tag
              )
            };
          }
          return contact;
        })
      );
      
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update tag');
      setLoading(false);
      throw err;
    }
  }, []);

  const deleteTag = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await deleteTagApi(id);
      setTags(prevTags => 
        prevTags.filter(tag => tag.id !== id)
      );
      
      // Remove the tag from contacts that have it
      setContacts(prevContacts => 
        prevContacts.map(contact => ({
          ...contact,
          tags: contact.tags.filter(tag => tag.id !== id)
        }))
      );
      
      setLoading(false);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete tag');
      setLoading(false);
      throw err;
    }
  }, []);

  const addTagToContact = useCallback(async (contactId, tagId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await addTagApi(contactId, tagId);
      
      // Update the contact in the state
      setContacts(prevContacts => 
        prevContacts.map(contact => {
          if (contact.id === contactId) {
            // Find the tag object
            const tagObject = tags.find(tag => tag.id === tagId);
            if (tagObject && !contact.tags.some(tag => tag.id === tagId)) {
              return {
                ...contact,
                tags: [...contact.tags, tagObject]
              };
            }
          }
          return contact;
        })
      );
      
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add tag to contact');
      setLoading(false);
      throw err;
    }
  }, [tags]);

  const removeTagFromContact = useCallback(async (contactId, tagId) => {
    setLoading(true);
    setError(null);
    try {
      await removeTagApi(contactId, tagId);
      
      // Update the contact in the state
      setContacts(prevContacts => 
        prevContacts.map(contact => {
          if (contact.id === contactId) {
            return {
              ...contact,
              tags: contact.tags.filter(tag => tag.id !== tagId)
            };
          }
          return contact;
        })
      );
      
      setLoading(false);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove tag from contact');
      setLoading(false);
      throw err;
    }
  }, []);

  // Group operations
  const getGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGroups();
      setGroups(data);
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch groups');
      setLoading(false);
      throw err;
    }
  }, []);

  const getGroup = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGroup(id);
      
      // Update the group in the groups array if it exists
      setGroups(prevGroups => {
        const groupIndex = prevGroups.findIndex(g => g.id === id);
        if (groupIndex >= 0) {
          const updatedGroups = [...prevGroups];
          updatedGroups[groupIndex] = data;
          return updatedGroups;
        }
        return prevGroups;
      });
      
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch group');
      setLoading(false);
      throw err;
    }
  }, []);

  const getGroupMembers = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGroupMembers(id);
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch group members');
      setLoading(false);
      throw err;
    }
  }, []);

  const createGroup = useCallback(async (groupData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await createGroupApi(groupData);
      setGroups(prevGroups => [...prevGroups, data]);
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group');
      setLoading(false);
      throw err;
    }
  }, []);

  const updateGroup = useCallback(async (id, groupData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await updateGroupApi(id, groupData);
      setGroups(prevGroups => 
        prevGroups.map(group => 
          group.id === id ? { ...group, ...data } : group
        )
      );
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update group');
      setLoading(false);
      throw err;
    }
  }, []);

  const deleteGroup = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await deleteGroupApi(id);
      setGroups(prevGroups => 
        prevGroups.filter(group => group.id !== id)
      );
      setLoading(false);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete group');
      setLoading(false);
      throw err;
    }
  }, []);

  return (
    <ContactContext.Provider
      value={{
        contacts,
        tags,
        groups,
        loading,
        error,
        getContacts,
        getContact,
        createContact,
        updateContact,
        deleteContact,
        importContacts,
        importSocialContacts,
        getTags,
        createTag,
        updateTag,
        deleteTag,
        addTagToContact,
        removeTagFromContact,
        getGroups,
        getGroup,
        getGroupMembers,
        createGroup,
        updateGroup,
        deleteGroup
      }}
    >
      {children}
    </ContactContext.Provider>
  );
};
