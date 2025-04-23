import api from '../utils/api';

/**
 * Service for group-related operations
 */
class GroupService {
  /**
   * Fetches all groups for the authenticated user
   * @returns {Promise<Array>} Array of group objects
   */
  async getAllGroups() {
    try {
      const response = await api.get('/groups');
      return response.data;
    } catch (error) {
      console.error('Error fetching groups:', error);
      throw error;
    }
  }

  /**
   * Fetches a specific group by ID
   * @param {string} id Group ID
   * @returns {Promise<Object>} Group object
   */
  async getGroupById(id) {
    try {
      const response = await api.get(`/groups/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching group ${id}:`, error);
      throw error;
    }
  }

  /**
   * Creates a new group
   * @param {Object} groupData Group data to create
   * @returns {Promise<Object>} Created group object
   */
  async createGroup(groupData) {
    try {
      const response = await api.post('/groups', groupData);
      return response.data;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  }

  /**
   * Updates an existing group
   * @param {string} id Group ID
   * @param {Object} groupData Updated group data
   * @returns {Promise<Object>} Updated group object
   */
  async updateGroup(id, groupData) {
    try {
      const response = await api.put(`/groups/${id}`, groupData);
      return response.data;
    } catch (error) {
      console.error(`Error updating group ${id}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a group
   * @param {string} id Group ID to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteGroup(id) {
    try {
      await api.delete(`/groups/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting group ${id}:`, error);
      throw error;
    }
  }

  /**
   * Gets members of a specific group
   * @param {string} groupId Group ID
   * @returns {Promise<Array>} Array of contact objects
   */
  async getGroupMembers(groupId) {
    try {
      const response = await api.get(`/groups/${groupId}/members`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching members for group ${groupId}:`, error);
      throw error;
    }
  }

  /**
   * Adds a contact to a group
   * @param {string} groupId Group ID
   * @param {string} contactId Contact ID
   * @returns {Promise<Object>} Updated group object
   */
  async addContactToGroup(groupId, contactId) {
    try {
      const response = await api.post(`/groups/${groupId}/members/${contactId}`);
      return response.data;
    } catch (error) {
      console.error(`Error adding contact ${contactId} to group ${groupId}:`, error);
      throw error;
    }
  }

  /**
   * Removes a contact from a group
   * @param {string} groupId Group ID
   * @param {string} contactId Contact ID
   * @returns {Promise<Object>} Updated group object
   */
  async removeContactFromGroup(groupId, contactId) {
    try {
      const response = await api.delete(`/groups/${groupId}/members/${contactId}`);
      return response.data;
    } catch (error) {
      console.error(`Error removing contact ${contactId} from group ${groupId}:`, error);
      throw error;
    }
  }
}

export default new GroupService();
