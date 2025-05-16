/**
 * LinkedIn Service
 * 
 * Handles LinkedIn API interactions for fetching user profile,
 * connections, and connection metadata.
 */
const axios = require('axios');
const logger = require('../../utils/logger');

// LinkedIn API base URL
const API_BASE = 'https://api.linkedin.com/v2';

/**
 * Fetches user profile data from LinkedIn API
 * 
 * @param {string} accessToken Valid LinkedIn access token
 * @returns {Promise<Object>} User profile data
 */
async function getUserProfile(accessToken) {
  try {
    logger.info('Fetching user profile from LinkedIn');
    
    const response = await axios.get(`${API_BASE}/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'cache-control': 'no-cache',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      params: {
        projection: '(id,firstName,lastName,profilePicture(displayImage~:playableStreams),emailAddress)'
      }
    });
    
    logger.info('Successfully fetched LinkedIn user profile', { 
      userId: response.data.id 
    });
    
    return response.data;
  } catch (error) {
    handleLinkedInApiError(error, 'fetching user profile');
  }
}

/**
 * Fetches user's connections from LinkedIn
 * 
 * Note: LinkedIn's API has restrictions on accessing connections data.
 * This requires the r_network permission which is only available to
 * LinkedIn Marketing Developer Platform partners.
 * 
 * This function is implemented for completeness but may not work
 * without partner approval.
 * 
 * @param {string} accessToken Valid LinkedIn access token
 * @returns {Promise<Array>} List of connections
 */
async function getUserConnections(accessToken) {
  try {
    logger.info('Fetching user connections from LinkedIn');
    
    const response = await axios.get(`${API_BASE}/connections`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'cache-control': 'no-cache',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      params: {
        q: 'viewer',
        start: 0,
        count: 50
      }
    });
    
    logger.info('Successfully fetched LinkedIn connections', {
      connectionCount: response.data.elements?.length || 0
    });
    
    return response.data.elements || [];
  } catch (error) {
    // Special handling for r_network permission issues
    if (error.response && error.response.status === 403) {
      logger.warn('LinkedIn API access to connections restricted - requires partner approval');
      return {
        error: 'restricted',
        message: 'LinkedIn restricts access to connections data to approved Marketing Developer Platform partners.'
      };
    }
    
    handleLinkedInApiError(error, 'fetching connections');
    return [];
  }
}

/**
 * Alternative method to get LinkedIn profile data via email search
 * For contacts already in the system with email addresses
 * 
 * @param {string} email Email address to search
 * @param {string} accessToken Valid LinkedIn access token
 * @returns {Promise<Object>} LinkedIn profile data if found
 */
async function findProfileByEmail(email, accessToken) {
  try {
    logger.info('Searching LinkedIn profile by email', { email });
    
    const response = await axios.get(`${API_BASE}/people/search`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'cache-control': 'no-cache',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      params: {
        q: 'email',
        email: email,
        projection: '(id,firstName,lastName,profilePicture(displayImage~:playableStreams),headline,industryName,location)'
      }
    });
    
    if (response.data.elements && response.data.elements.length > 0) {
      logger.info('LinkedIn profile found by email', { email });
      return response.data.elements[0];
    } else {
      logger.info('No LinkedIn profile found for email', { email });
      return null;
    }
  } catch (error) {
    handleLinkedInApiError(error, 'searching profile by email');
    return null;
  }
}

/**
 * Extracts tags from LinkedIn profile data
 * 
 * @param {Object} profile LinkedIn profile object
 * @returns {Array} List of tags extracted from profile
 */
function extractTagsFromProfile(profile) {
  const tags = [];
  
  // Industry tag
  if (profile.industryName) {
    tags.push({
      name: `industry:${profile.industryName}`,
      type: 'work',
      source: 'linkedin'
    });
  }
  
  // Location tag
  if (profile.location && profile.location.preferredGeoPlace) {
    tags.push({
      name: `location:${profile.location.preferredGeoPlace.country.defaultName}`,
      type: 'location',
      source: 'linkedin'
    });
    
    if (profile.location.preferredGeoPlace.city) {
      tags.push({
        name: `city:${profile.location.preferredGeoPlace.city.defaultName}`,
        type: 'location',
        source: 'linkedin'
      });
    }
  }
  
  // Skills tags (if available)
  if (profile.skills && profile.skills.elements) {
    profile.skills.elements.forEach(skill => {
      tags.push({
        name: `skill:${skill.name}`,
        type: 'skill',
        source: 'linkedin'
      });
    });
  }
  
  // Education tags
  if (profile.educations && profile.educations.elements) {
    profile.educations.elements.forEach(education => {
      if (education.school && education.school.name) {
        tags.push({
          name: `school:${education.school.name}`,
          type: 'education',
          source: 'linkedin'
        });
      }
      
      if (education.fieldOfStudy) {
        tags.push({
          name: `field:${education.fieldOfStudy}`,
          type: 'education',
          source: 'linkedin'
        });
      }
    });
  }
  
  // Position tags
  if (profile.positions && profile.positions.elements) {
    profile.positions.elements.forEach(position => {
      if (position.companyName) {
        tags.push({
          name: `company:${position.companyName}`,
          type: 'work',
          source: 'linkedin'
        });
      }
      
      if (position.title) {
        tags.push({
          name: `position:${position.title}`,
          type: 'work',
          source: 'linkedin'
        });
      }
    });
  }
  
  return tags;
}

/**
 * Helper function to handle LinkedIn API errors
 * 
 * @param {Error} error Error object
 * @param {string} context Context where error occurred
 */
function handleLinkedInApiError(error, context) {
  if (error.response && error.response.data) {
    logger.error(`LinkedIn API error ${context}`, {
      status: error.response.status,
      message: error.response.data.message || error.message
    });
    
    throw new Error(`LinkedIn API error ${context}: ${error.response.data.message || error.message}`);
  } else {
    logger.error(`Error ${context} from LinkedIn`, { error: error.message });
    throw new Error(`Error ${context} from LinkedIn: ${error.message}`);
  }
}

module.exports = {
  getUserProfile,
  getUserConnections,
  findProfileByEmail,
  extractTagsFromProfile
};