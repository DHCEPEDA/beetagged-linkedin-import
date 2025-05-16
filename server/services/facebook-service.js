/**
 * Facebook Service
 * 
 * Handles Facebook API interactions for fetching user profile,
 * friends list, and friend metadata.
 */
const axios = require('axios');
const logger = require('../../utils/logger');

/**
 * Fetches user profile and friends data from Facebook Graph API
 * 
 * @param {string} accessToken Valid Facebook access token
 * @returns {Promise<Object>} User profile and friends with metadata
 */
async function getUserData(accessToken) {
  try {
    logger.info('Fetching user data from Facebook', { accessToken: accessToken.substring(0, 5) + '...' });
    
    // First, fetch the user's profile
    const userResponse = await axios.get('https://graph.facebook.com/v19.0/me', {
      params: {
        fields: 'id,name,email,picture.type(large)',
        access_token: accessToken
      }
    });
    
    // Next, fetch the user's friends list with available metadata
    const friendsResponse = await axios.get('https://graph.facebook.com/v19.0/me/friends', {
      params: {
        // Request all available public fields for each friend
        fields: 'id,name,picture.type(large),location,work,education,gender,link,age_range,birthday,hometown,languages,sports,favorite_teams,favorite_athletes,quotes,about,relationship_status,significant_other,website',
        limit: 100, // Adjust as needed
        access_token: accessToken
      }
    });
    
    // Combine the data
    const userData = {
      profile: userResponse.data,
      friends: friendsResponse.data.data || [],
      friendsPaging: friendsResponse.data.paging || null
    };
    
    logger.info('Successfully fetched Facebook user data', { 
      userId: userData.profile.id,
      friendCount: userData.friends.length
    });
    
    return userData;
  } catch (error) {
    // Handle specific Facebook API errors
    if (error.response && error.response.data) {
      logger.error('Facebook API error', { 
        errorCode: error.response.data.error.code,
        errorMessage: error.response.data.error.message
      });
      throw new Error(`Facebook API: ${error.response.data.error.message}`);
    }
    
    // Handle other errors
    logger.error('Error fetching Facebook user data', { error: error.message });
    throw new Error(`Failed to fetch Facebook data: ${error.message}`);
  }
}

/**
 * Fetches metadata for a specific friend
 * 
 * @param {string} friendId Facebook ID of the friend
 * @param {string} accessToken Valid Facebook access token
 * @returns {Promise<Object>} Detailed friend metadata
 */
async function getFriendMetadata(friendId, accessToken) {
  try {
    logger.info('Fetching friend metadata from Facebook', { 
      friendId, 
      accessToken: accessToken.substring(0, 5) + '...' 
    });
    
    const response = await axios.get(`https://graph.facebook.com/v19.0/${friendId}`, {
      params: {
        fields: 'id,name,picture.type(large),location,work,education,gender,link,age_range,birthday,hometown,languages,sports,favorite_teams,favorite_athletes,quotes,about,relationship_status,significant_other,website',
        access_token: accessToken
      }
    });
    
    logger.info('Successfully fetched friend metadata', { friendId });
    return response.data;
  } catch (error) {
    // Handle specific Facebook API errors
    if (error.response && error.response.data) {
      logger.error('Facebook API error fetching friend metadata', { 
        friendId,
        errorCode: error.response.data.error.code,
        errorMessage: error.response.data.error.message
      });
      throw new Error(`Facebook API: ${error.response.data.error.message}`);
    }
    
    // Handle other errors
    logger.error('Error fetching friend metadata', { friendId, error: error.message });
    throw new Error(`Failed to fetch friend metadata: ${error.message}`);
  }
}

/**
 * Fetches the next page of friends if available
 * 
 * @param {string} nextPageUrl URL for the next page of results
 * @returns {Promise<Object>} Next page of friends data
 */
async function getNextFriendsPage(nextPageUrl) {
  try {
    logger.info('Fetching next page of friends');
    
    const response = await axios.get(nextPageUrl);
    
    return {
      friends: response.data.data || [],
      friendsPaging: response.data.paging || null
    };
  } catch (error) {
    logger.error('Error fetching next page of friends', { error: error.message });
    throw new Error(`Failed to fetch next page: ${error.message}`);
  }
}

/**
 * Extract metadata tags from friend profiles
 * 
 * @param {Array} friends List of friend objects with metadata
 * @returns {Object} Mapped tags with count of occurrences
 */
function extractTagsFromFriends(friends) {
  const tags = {};
  
  friends.forEach(friend => {
    // Process location
    if (friend.location && friend.location.name) {
      const locationTag = `location:${friend.location.name}`;
      tags[locationTag] = (tags[locationTag] || 0) + 1;
    }
    
    // Process work
    if (friend.work && friend.work.length > 0) {
      friend.work.forEach(work => {
        if (work.employer && work.employer.name) {
          const workTag = `work:${work.employer.name}`;
          tags[workTag] = (tags[workTag] || 0) + 1;
        }
        
        if (work.position && work.position.name) {
          const positionTag = `position:${work.position.name}`;
          tags[positionTag] = (tags[positionTag] || 0) + 1;
        }
      });
    }
    
    // Process education
    if (friend.education && friend.education.length > 0) {
      friend.education.forEach(edu => {
        if (edu.school && edu.school.name) {
          const schoolTag = `school:${edu.school.name}`;
          tags[schoolTag] = (tags[schoolTag] || 0) + 1;
        }
        
        if (edu.type) {
          const eduTypeTag = `education:${edu.type}`;
          tags[eduTypeTag] = (tags[eduTypeTag] || 0) + 1;
        }
      });
    }
    
    // Process gender
    if (friend.gender) {
      const genderTag = `gender:${friend.gender}`;
      tags[genderTag] = (tags[genderTag] || 0) + 1;
    }
    
    // Process hometown
    if (friend.hometown && friend.hometown.name) {
      const hometownTag = `hometown:${friend.hometown.name}`;
      tags[hometownTag] = (tags[hometownTag] || 0) + 1;
    }
    
    // Process sports
    if (friend.sports && friend.sports.length > 0) {
      friend.sports.forEach(sport => {
        if (sport.name) {
          const sportTag = `sport:${sport.name}`;
          tags[sportTag] = (tags[sportTag] || 0) + 1;
        }
      });
    }
    
    // Process relationship status
    if (friend.relationship_status) {
      const relationshipTag = `relationship:${friend.relationship_status}`;
      tags[relationshipTag] = (tags[relationshipTag] || 0) + 1;
    }
  });
  
  return tags;
}

module.exports = {
  getUserData,
  getFriendMetadata,
  getNextFriendsPage,
  extractTagsFromFriends
};