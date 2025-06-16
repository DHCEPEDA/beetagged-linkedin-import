/**
 * UserSearchHelper equivalent to UserSearchHelper.java
 * Provides intelligent search functionality for contacts with tag-based filtering
 */
import { User } from '../models/User.js';

export class UserSearchHelper {
  /**
   * Search users by name or tags (equivalent to Java searchUsers method)
   * @param {User[]} users - Array of User objects to search
   * @param {string} searchTerm - Term to search for
   * @returns {User[]} Array of matching users
   */
  static searchUsers(users, searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      return users;
    }

    const results = [];
    const normalizedSearchTerm = searchTerm.toLowerCase().trim();

    for (const user of users) {
      // Search by name first
      if (user.getName().toLowerCase().includes(normalizedSearchTerm)) {
        results.push(user);
        continue;
      }

      // Search by tags
      const tags = user.getTags();
      let tagMatch = false;
      for (const tag of tags) {
        if (tag.toLowerCase().includes(normalizedSearchTerm)) {
          results.push(user);
          tagMatch = true;
          break;
        }
      }
    }

    return results;
  }

  /**
   * Advanced search with multiple criteria
   * @param {User[]} users - Array of User objects
   * @param {Object} searchCriteria - Search parameters
   * @returns {User[]} Filtered results
   */
  static advancedSearch(users, searchCriteria) {
    const {
      name = '',
      company = '',
      title = '',
      location = '',
      industry = '',
      tags = []
    } = searchCriteria;

    return users.filter(user => {
      const userData = user.toDisplayObject();
      
      // Name search
      if (name && !userData.name.toLowerCase().includes(name.toLowerCase())) {
        return false;
      }

      // Company search
      if (company && (!userData.company || !userData.company.toLowerCase().includes(company.toLowerCase()))) {
        return false;
      }

      // Title search
      if (title && (!userData.title || !userData.title.toLowerCase().includes(title.toLowerCase()))) {
        return false;
      }

      // Location search
      if (location && (!userData.location || !userData.location.toLowerCase().includes(location.toLowerCase()))) {
        return false;
      }

      // Industry search
      if (industry && (!userData.industry || !userData.industry.toLowerCase().includes(industry.toLowerCase()))) {
        return false;
      }

      // Tag search
      if (tags.length > 0) {
        const userTags = userData.tags.map(tag => tag.toLowerCase());
        const hasMatchingTag = tags.some(searchTag => 
          userTags.some(userTag => userTag.includes(searchTag.toLowerCase()))
        );
        if (!hasMatchingTag) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Natural language search for queries like "Who works at Google?" or "Marketing professionals"
   * @param {User[]} users - Array of User objects
   * @param {string} query - Natural language query
   * @returns {User[]} Matching users
   */
  static naturalLanguageSearch(users, query) {
    const normalizedQuery = query.toLowerCase();
    
    // Common patterns for natural language queries
    const patterns = [
      { regex: /who\s+works?\s+at\s+(.+)/i, field: 'company' },
      { regex: /who\s+is\s+in\s+(.+)/i, field: 'location' },
      { regex: /(.+)\s+professionals?/i, field: 'industry' },
      { regex: /(.+)\s+managers?/i, field: 'title' },
      { regex: /(.+)\s+developers?/i, field: 'title' },
      { regex: /(.+)\s+engineers?/i, field: 'title' },
      { regex: /(.+)\s+specialists?/i, field: 'title' }
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern.regex);
      if (match) {
        const searchTerm = match[1].trim();
        return this.advancedSearch(users, { [pattern.field]: searchTerm });
      }
    }

    // Fallback to regular search
    return this.searchUsers(users, query);
  }

  /**
   * Get unique values for autocomplete suggestions
   * @param {User[]} users - Array of users
   * @param {string} field - Field to extract values from
   * @returns {string[]} Unique values
   */
  static getUniqueValues(users, field) {
    const values = new Set();
    
    users.forEach(user => {
      const userData = user.toDisplayObject();
      
      if (field === 'tags') {
        userData.tags.forEach(tag => values.add(tag));
      } else if (userData[field]) {
        values.add(userData[field]);
      }
    });

    return Array.from(values).sort();
  }

  /**
   * Search with ranking based on relevance
   * @param {User[]} users - Array of users
   * @param {string} searchTerm - Search term
   * @returns {Array} Users with relevance scores
   */
  static searchWithRanking(users, searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      return users.map(user => ({ user, score: 0 }));
    }

    const normalizedSearchTerm = searchTerm.toLowerCase().trim();
    const results = [];

    users.forEach(user => {
      let score = 0;
      const userData = user.toDisplayObject();

      // Exact name match gets highest score
      if (userData.name.toLowerCase() === normalizedSearchTerm) {
        score += 100;
      } else if (userData.name.toLowerCase().includes(normalizedSearchTerm)) {
        score += 50;
      }

      // Company matches
      if (userData.company && userData.company.toLowerCase().includes(normalizedSearchTerm)) {
        score += 30;
      }

      // Title matches
      if (userData.title && userData.title.toLowerCase().includes(normalizedSearchTerm)) {
        score += 25;
      }

      // Location matches
      if (userData.location && userData.location.toLowerCase().includes(normalizedSearchTerm)) {
        score += 20;
      }

      // Industry matches
      if (userData.industry && userData.industry.toLowerCase().includes(normalizedSearchTerm)) {
        score += 15;
      }

      // Tag matches
      userData.tags.forEach(tag => {
        if (tag.toLowerCase().includes(normalizedSearchTerm)) {
          score += 10;
        }
      });

      if (score > 0) {
        results.push({ user, score });
      }
    });

    // Sort by score (highest first)
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Load users from LinkedIn import data
   * @param {Object[]} linkedinContacts - Raw LinkedIn contact data
   * @returns {User[]} Array of User objects
   */
  static loadFromLinkedInData(linkedinContacts) {
    if (!Array.isArray(linkedinContacts)) {
      return [];
    }

    return linkedinContacts.map(contact => User.fromLinkedInContact(contact));
  }
}