import api from '../utils/api';

/**
 * Service for tag-related operations
 */
class TagService {
  /**
   * Fetches all tags for the authenticated user
   * @returns {Promise<Array>} Array of tag objects
   */
  async getAllTags() {
    try {
      const response = await api.get('/tags');
      return response.data;
    } catch (error) {
      console.error('Error fetching tags:', error);
      throw error;
    }
  }

  /**
   * Fetches a specific tag by ID
   * @param {string} id Tag ID
   * @returns {Promise<Object>} Tag object
   */
  async getTagById(id) {
    try {
      const response = await api.get(`/tags/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching tag ${id}:`, error);
      throw error;
    }
  }

  /**
   * Creates a new tag
   * @param {Object} tagData Tag data to create
   * @returns {Promise<Object>} Created tag object
   */
  async createTag(tagData) {
    try {
      const response = await api.post('/tags', tagData);
      return response.data;
    } catch (error) {
      console.error('Error creating tag:', error);
      throw error;
    }
  }

  /**
   * Updates an existing tag
   * @param {string} id Tag ID
   * @param {Object} tagData Updated tag data
   * @returns {Promise<Object>} Updated tag object
   */
  async updateTag(id, tagData) {
    try {
      const response = await api.put(`/tags/${id}`, tagData);
      return response.data;
    } catch (error) {
      console.error(`Error updating tag ${id}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a tag
   * @param {string} id Tag ID to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteTag(id) {
    try {
      await api.delete(`/tags/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting tag ${id}:`, error);
      throw error;
    }
  }

  /**
   * Gets contacts associated with a specific tag
   * @param {string} tagId Tag ID
   * @returns {Promise<Array>} Array of contact objects
   */
  async getContactsByTag(tagId) {
    try {
      const response = await api.get(`/tags/${tagId}/contacts`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching contacts for tag ${tagId}:`, error);
      throw error;
    }
  }
}

export default new TagService();
