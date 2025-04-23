import api from '../utils/api';

/**
 * Service for contact-related operations
 */
class ContactService {
  /**
   * Fetches all contacts for the authenticated user
   * @returns {Promise<Array>} Array of contact objects
   */
  async getAllContacts() {
    try {
      const response = await api.get('/contacts');
      return response.data;
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw error;
    }
  }

  /**
   * Fetches a specific contact by ID
   * @param {string} id Contact ID
   * @returns {Promise<Object>} Contact object
   */
  async getContactById(id) {
    try {
      const response = await api.get(`/contacts/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching contact ${id}:`, error);
      throw error;
    }
  }

  /**
   * Creates a new contact
   * @param {Object} contactData Contact data to create
   * @returns {Promise<Object>} Created contact object
   */
  async createContact(contactData) {
    try {
      const response = await api.post('/contacts', contactData);
      return response.data;
    } catch (error) {
      console.error('Error creating contact:', error);
      throw error;
    }
  }

  /**
   * Updates an existing contact
   * @param {string} id Contact ID
   * @param {Object} contactData Updated contact data
   * @returns {Promise<Object>} Updated contact object
   */
  async updateContact(id, contactData) {
    try {
      const response = await api.put(`/contacts/${id}`, contactData);
      return response.data;
    } catch (error) {
      console.error(`Error updating contact ${id}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a contact
   * @param {string} id Contact ID to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteContact(id) {
    try {
      await api.delete(`/contacts/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting contact ${id}:`, error);
      throw error;
    }
  }

  /**
   * Imports contacts from the phone
   * @returns {Promise<Object>} Import result statistics
   */
  async importPhoneContacts() {
    try {
      const response = await api.post('/contacts/import/phone');
      return response.data;
    } catch (error) {
      console.error('Error importing phone contacts:', error);
      throw error;
    }
  }

  /**
   * Imports contacts from a social network
   * @param {string} provider Social network provider ('linkedin' or 'facebook')
   * @returns {Promise<Object>} Import result statistics
   */
  async importSocialContacts(provider) {
    try {
      const response = await api.post(`/contacts/import/${provider}`);
      return response.data;
    } catch (error) {
      console.error(`Error importing ${provider} contacts:`, error);
      throw error;
    }
  }

  /**
   * Adds a tag to a contact
   * @param {string} contactId Contact ID
   * @param {string} tagId Tag ID
   * @returns {Promise<Object>} Updated contact object
   */
  async addTagToContact(contactId, tagId) {
    try {
      const response = await api.post(`/contacts/${contactId}/tags/${tagId}`);
      return response.data;
    } catch (error) {
      console.error(`Error adding tag ${tagId} to contact ${contactId}:`, error);
      throw error;
    }
  }

  /**
   * Removes a tag from a contact
   * @param {string} contactId Contact ID
   * @param {string} tagId Tag ID
   * @returns {Promise<Object>} Updated contact object
   */
  async removeTagFromContact(contactId, tagId) {
    try {
      const response = await api.delete(`/contacts/${contactId}/tags/${tagId}`);
      return response.data;
    } catch (error) {
      console.error(`Error removing tag ${tagId} from contact ${contactId}:`, error);
      throw error;
    }
  }
}

export default new ContactService();
