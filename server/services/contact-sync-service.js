/**
 * Contact Synchronization Service
 * 
 * Handles synchronization of contacts from various sources (Facebook, LinkedIn, etc.)
 * and merges them into a unified contact database with metadata and tags.
 */
const facebookService = require('./facebook-service');
const linkedinService = require('./linkedin-service');
const Contact = require('../models/Contact');
const logger = require('../../utils/logger');
const mongoose = require('mongoose');

/**
 * Synchronize contacts from Facebook
 * 
 * @param {Object} user MongoDB user document
 * @param {string} accessToken Facebook access token
 * @returns {Promise<Object>} Result of synchronization
 */
async function syncFacebookContacts(user, accessToken) {
  try {
    logger.info('Starting Facebook contacts sync', { userId: user._id });
    
    // Fetch user data and friends from Facebook
    const userData = await facebookService.getUserData(accessToken);
    
    if (!userData.friends || userData.friends.length === 0) {
      logger.warn('No Facebook friends found or insufficient permissions', { userId: user._id });
      return {
        success: false,
        message: 'No Facebook friends found or insufficient permissions',
        totalContacts: 0,
        newContacts: 0,
        updatedContacts: 0
      };
    }
    
    // Stats for tracking sync results
    let totalContacts = userData.friends.length;
    let newContacts = 0;
    let updatedContacts = 0;
    
    // Process each friend
    for (const friend of userData.friends) {
      try {
        // Check if we already have this contact
        let contact = await Contact.findOne({
          user: user._id,
          'sources.type': 'facebook',
          'sources.sourceId': friend.id
        });
        
        // If contact doesn't exist, check if we have a contact with the same name
        // that might be the same person but from a different source
        if (!contact) {
          contact = await Contact.findOne({
            user: user._id,
            name: friend.name
          });
        }
        
        // Get detailed friend metadata if available
        let friendMetadata;
        try {
          friendMetadata = await facebookService.getFriendMetadata(friend.id, accessToken);
        } catch (metadataError) {
          logger.warn('Could not fetch detailed metadata for Facebook friend', {
            friendId: friend.id,
            error: metadataError.message
          });
          // Continue with basic friend data
          friendMetadata = friend;
        }
        
        // Extract metadata and tags
        const extractedMetadata = extractMetadataFromFacebookFriend(friendMetadata);
        const extractedTags = extractTagsFromFacebookFriend(friendMetadata);
        
        if (!contact) {
          // Create new contact
          contact = new Contact({
            user: user._id,
            name: friend.name,
            photoUrl: friend.picture?.data?.url || null,
            sources: [{
              type: 'facebook',
              sourceId: friend.id,
              profileUrl: friend.link || `https://facebook.com/${friend.id}`,
              lastSynced: new Date(),
              rawData: friendMetadata
            }],
            metadata: extractedMetadata,
            tags: extractedTags
          });
          
          await contact.save();
          newContacts++;
        } else {
          // Update existing contact
          // Check if this source already exists
          const sourceIndex = contact.sources.findIndex(s => 
            s.type === 'facebook' && s.sourceId === friend.id
          );
          
          if (sourceIndex >= 0) {
            // Update existing source
            contact.sources[sourceIndex].lastSynced = new Date();
            contact.sources[sourceIndex].rawData = friendMetadata;
            if (friend.picture?.data?.url) {
              contact.photoUrl = friend.picture.data.url;
            }
          } else {
            // Add new source to existing contact
            contact.sources.push({
              type: 'facebook',
              sourceId: friend.id,
              profileUrl: friend.link || `https://facebook.com/${friend.id}`,
              lastSynced: new Date(),
              rawData: friendMetadata
            });
          }
          
          // Update metadata with new Facebook data
          Object.assign(contact.metadata, extractedMetadata);
          
          // Add new tags if they don't already exist
          for (const newTag of extractedTags) {
            const tagExists = contact.tags.some(existingTag => 
              existingTag.name === newTag.name && existingTag.source === 'facebook'
            );
            
            if (!tagExists) {
              contact.tags.push(newTag);
            }
          }
          
          await contact.save();
          updatedContacts++;
        }
      } catch (friendError) {
        logger.error('Error processing Facebook friend', {
          friendId: friend.id,
          error: friendError.message
        });
        // Continue with next friend
      }
    }
    
    logger.info('Facebook contacts sync completed', {
      userId: user._id,
      totalContacts,
      newContacts,
      updatedContacts
    });
    
    return {
      success: true,
      message: 'Facebook contacts synchronized successfully',
      totalContacts,
      newContacts,
      updatedContacts
    };
  } catch (error) {
    logger.error('Error synchronizing Facebook contacts', {
      userId: user._id,
      error: error.message
    });
    
    throw new Error(`Failed to sync Facebook contacts: ${error.message}`);
  }
}

/**
 * Synchronize contacts from LinkedIn
 * 
 * @param {Object} user MongoDB user document
 * @param {string} accessToken LinkedIn access token
 * @returns {Promise<Object>} Result of synchronization
 */
async function syncLinkedInContacts(user, accessToken) {
  try {
    logger.info('Starting LinkedIn contacts sync', { userId: user._id });
    
    // Fetch user profile from LinkedIn
    const userProfile = await linkedinService.getUserProfile(accessToken);
    
    // Try to fetch connections (may be restricted by LinkedIn API permissions)
    const connections = await linkedinService.getUserConnections(accessToken);
    
    // Check if we got a restricted access error
    if (connections.error === 'restricted') {
      logger.warn('LinkedIn API access to connections is restricted', { userId: user._id });
      return {
        success: false,
        message: connections.message,
        totalContacts: 0,
        newContacts: 0,
        updatedContacts: 0
      };
    }
    
    // If we have no connections, return early
    if (!connections || connections.length === 0) {
      logger.warn('No LinkedIn connections found or insufficient permissions', { userId: user._id });
      return {
        success: false,
        message: 'No LinkedIn connections found or insufficient permissions',
        totalContacts: 0,
        newContacts: 0,
        updatedContacts: 0
      };
    }
    
    // Stats for tracking sync results
    let totalContacts = connections.length;
    let newContacts = 0;
    let updatedContacts = 0;
    
    // Process each connection
    for (const connection of connections) {
      try {
        // Check if we already have this contact
        let contact = await Contact.findOne({
          user: user._id,
          'sources.type': 'linkedin',
          'sources.sourceId': connection.id
        });
        
        // If not found by ID, try to find by name
        if (!contact) {
          const fullName = formatLinkedInName(connection);
          contact = await Contact.findOne({
            user: user._id,
            name: fullName
          });
        }
        
        // Extract metadata and tags
        const extractedMetadata = extractMetadataFromLinkedInConnection(connection);
        const extractedTags = linkedinService.extractTagsFromProfile(connection);
        
        if (!contact) {
          // Create new contact
          contact = new Contact({
            user: user._id,
            name: formatLinkedInName(connection),
            photoUrl: extractProfilePictureUrl(connection),
            sources: [{
              type: 'linkedin',
              sourceId: connection.id,
              profileUrl: `https://www.linkedin.com/in/${connection.vanityName || connection.id}`,
              lastSynced: new Date(),
              rawData: connection
            }],
            metadata: extractedMetadata,
            tags: extractedTags
          });
          
          await contact.save();
          newContacts++;
        } else {
          // Update existing contact
          // Check if this source already exists
          const sourceIndex = contact.sources.findIndex(s => 
            s.type === 'linkedin' && s.sourceId === connection.id
          );
          
          if (sourceIndex >= 0) {
            // Update existing source
            contact.sources[sourceIndex].lastSynced = new Date();
            contact.sources[sourceIndex].rawData = connection;
            const profilePicUrl = extractProfilePictureUrl(connection);
            if (profilePicUrl) {
              contact.photoUrl = profilePicUrl;
            }
          } else {
            // Add new source to existing contact
            contact.sources.push({
              type: 'linkedin',
              sourceId: connection.id,
              profileUrl: `https://www.linkedin.com/in/${connection.vanityName || connection.id}`,
              lastSynced: new Date(),
              rawData: connection
            });
          }
          
          // Update metadata with new LinkedIn data
          Object.assign(contact.metadata, extractedMetadata);
          
          // Add new tags if they don't already exist
          for (const newTag of extractedTags) {
            const tagExists = contact.tags.some(existingTag => 
              existingTag.name === newTag.name && existingTag.source === 'linkedin'
            );
            
            if (!tagExists) {
              contact.tags.push(newTag);
            }
          }
          
          await contact.save();
          updatedContacts++;
        }
      } catch (connectionError) {
        logger.error('Error processing LinkedIn connection', {
          connectionId: connection.id,
          error: connectionError.message
        });
        // Continue with next connection
      }
    }
    
    logger.info('LinkedIn contacts sync completed', {
      userId: user._id,
      totalContacts,
      newContacts,
      updatedContacts
    });
    
    return {
      success: true,
      message: 'LinkedIn contacts synchronized successfully',
      totalContacts,
      newContacts,
      updatedContacts
    };
  } catch (error) {
    logger.error('Error synchronizing LinkedIn contacts', {
      userId: user._id,
      error: error.message
    });
    
    throw new Error(`Failed to sync LinkedIn contacts: ${error.message}`);
  }
}

/**
 * Search contacts with complex query
 * 
 * @param {Object} user MongoDB user document
 * @param {Object} searchParams Search parameters
 * @returns {Promise<Array>} Matching contacts
 */
async function searchContacts(user, searchParams) {
  try {
    logger.info('Searching contacts', { userId: user._id, searchParams });
    
    const query = { user: user._id };
    
    // Process text search
    if (searchParams.text) {
      query.$or = [
        { name: { $regex: searchParams.text, $options: 'i' } },
        { email: { $regex: searchParams.text, $options: 'i' } },
        { 'metadata.location': { $regex: searchParams.text, $options: 'i' } },
        { 'metadata.hometown': { $regex: searchParams.text, $options: 'i' } },
        { 'metadata.work.company': { $regex: searchParams.text, $options: 'i' } },
        { 'metadata.work.position': { $regex: searchParams.text, $options: 'i' } },
        { 'metadata.education.school': { $regex: searchParams.text, $options: 'i' } },
        { 'metadata.education.fieldOfStudy': { $regex: searchParams.text, $options: 'i' } }
      ];
    }
    
    // Process tag search
    if (searchParams.tags && searchParams.tags.length > 0) {
      query['tags.name'] = { $all: searchParams.tags };
    }
    
    // Process location search
    if (searchParams.location) {
      query.$or = query.$or || [];
      query.$or.push(
        { 'metadata.location': { $regex: searchParams.location, $options: 'i' } },
        { 'metadata.hometown': { $regex: searchParams.location, $options: 'i' } },
        { 'tags.name': { $regex: `location:${searchParams.location}`, $options: 'i' } }
      );
    }
    
    // Process work search
    if (searchParams.company) {
      query['metadata.work'] = {
        $elemMatch: {
          company: { $regex: searchParams.company, $options: 'i' }
        }
      };
    }
    
    // Process education search
    if (searchParams.school) {
      query['metadata.education'] = {
        $elemMatch: {
          school: { $regex: searchParams.school, $options: 'i' }
        }
      };
    }
    
    // Process gender search
    if (searchParams.gender) {
      query['metadata.gender'] = searchParams.gender;
    }
    
    // Process source search
    if (searchParams.source) {
      query['sources.type'] = searchParams.source;
    }
    
    // Process group search
    if (searchParams.group) {
      query.groups = mongoose.Types.ObjectId(searchParams.group);
    }
    
    // Process favorite search
    if (searchParams.favorite) {
      query.isFavorite = (searchParams.favorite === 'true');
    }
    
    const contacts = await Contact.find(query).sort({ name: 1 });
    
    logger.info('Contact search results', {
      userId: user._id,
      resultCount: contacts.length
    });
    
    return contacts;
  } catch (error) {
    logger.error('Error searching contacts', {
      userId: user._id,
      error: error.message
    });
    
    throw new Error(`Failed to search contacts: ${error.message}`);
  }
}

/**
 * Get popular tags for a user
 * 
 * @param {Object} user MongoDB user document
 * @param {number} limit Maximum number of tags to return
 * @returns {Promise<Array>} Popular tags with counts
 */
async function getPopularTags(user, limit = 20) {
  try {
    logger.info('Getting popular tags', { userId: user._id });
    
    const tags = await Contact.getCommonTags(user._id, limit);
    
    logger.info('Retrieved popular tags', {
      userId: user._id,
      tagCount: tags.length
    });
    
    return tags;
  } catch (error) {
    logger.error('Error getting popular tags', {
      userId: user._id,
      error: error.message
    });
    
    throw new Error(`Failed to get popular tags: ${error.message}`);
  }
}

// Helper Functions

/**
 * Extract metadata from Facebook friend object
 * 
 * @param {Object} friend Facebook friend object
 * @returns {Object} Extracted metadata
 */
function extractMetadataFromFacebookFriend(friend) {
  const metadata = {};
  
  // Location
  if (friend.location && friend.location.name) {
    metadata.location = friend.location.name;
  }
  
  // Hometown
  if (friend.hometown && friend.hometown.name) {
    metadata.hometown = friend.hometown.name;
  }
  
  // Gender
  if (friend.gender) {
    metadata.gender = friend.gender;
  }
  
  // Birthday
  if (friend.birthday) {
    // Facebook format: MM/DD/YYYY
    const parts = friend.birthday.split('/');
    if (parts.length === 3) {
      metadata.birthday = new Date(parts[2], parts[0] - 1, parts[1]);
    }
  }
  
  // Work history
  if (friend.work && friend.work.length > 0) {
    metadata.work = friend.work.map(job => ({
      company: job.employer ? job.employer.name : null,
      position: job.position ? job.position.name : null,
      dateRange: job.start_date || job.end_date ? 
        `${job.start_date || 'Unknown'} to ${job.end_date || 'Present'}` : null
    }));
  }
  
  // Education history
  if (friend.education && friend.education.length > 0) {
    metadata.education = friend.education.map(edu => ({
      school: edu.school ? edu.school.name : null,
      degree: edu.degree ? edu.degree.name : null,
      fieldOfStudy: edu.concentration && edu.concentration.length > 0 ? 
        edu.concentration[0].name : null,
      dateRange: edu.year ? `${edu.year.name}` : null
    }));
  }
  
  // Languages
  if (friend.languages && friend.languages.length > 0) {
    metadata.languages = friend.languages.map(lang => lang.name);
  }
  
  // Interests
  let interests = [];
  
  // Sports
  if (friend.sports && friend.sports.length > 0) {
    const sportNames = friend.sports.map(sport => sport.name);
    interests = interests.concat(sportNames);
  }
  
  // Favorite teams
  if (friend.favorite_teams && friend.favorite_teams.length > 0) {
    const teamNames = friend.favorite_teams.map(team => team.name);
    interests = interests.concat(teamNames);
  }
  
  // Favorite athletes
  if (friend.favorite_athletes && friend.favorite_athletes.length > 0) {
    const athleteNames = friend.favorite_athletes.map(athlete => athlete.name);
    interests = interests.concat(athleteNames);
  }
  
  if (interests.length > 0) {
    metadata.interests = interests;
  }
  
  return metadata;
}

/**
 * Extract tags from Facebook friend object
 * 
 * @param {Object} friend Facebook friend object
 * @returns {Array} Extracted tags
 */
function extractTagsFromFacebookFriend(friend) {
  const tags = [];
  
  // Location tag
  if (friend.location && friend.location.name) {
    tags.push({
      name: `location:${friend.location.name}`,
      type: 'location',
      source: 'facebook'
    });
  }
  
  // Hometown tag
  if (friend.hometown && friend.hometown.name) {
    tags.push({
      name: `hometown:${friend.hometown.name}`,
      type: 'location',
      source: 'facebook'
    });
  }
  
  // Gender tag
  if (friend.gender) {
    tags.push({
      name: `gender:${friend.gender}`,
      type: 'custom',
      source: 'facebook'
    });
  }
  
  // Work tags
  if (friend.work && friend.work.length > 0) {
    friend.work.forEach(job => {
      if (job.employer && job.employer.name) {
        tags.push({
          name: `company:${job.employer.name}`,
          type: 'work',
          source: 'facebook'
        });
      }
      
      if (job.position && job.position.name) {
        tags.push({
          name: `position:${job.position.name}`,
          type: 'work',
          source: 'facebook'
        });
      }
    });
  }
  
  // Education tags
  if (friend.education && friend.education.length > 0) {
    friend.education.forEach(edu => {
      if (edu.school && edu.school.name) {
        tags.push({
          name: `school:${edu.school.name}`,
          type: 'education',
          source: 'facebook'
        });
      }
      
      if (edu.type) {
        tags.push({
          name: `education_type:${edu.type}`,
          type: 'education',
          source: 'facebook'
        });
      }
      
      if (edu.concentration && edu.concentration.length > 0) {
        edu.concentration.forEach(conc => {
          if (conc.name) {
            tags.push({
              name: `field:${conc.name}`,
              type: 'education',
              source: 'facebook'
            });
          }
        });
      }
    });
  }
  
  // Interest tags
  // Sports
  if (friend.sports && friend.sports.length > 0) {
    friend.sports.forEach(sport => {
      if (sport.name) {
        tags.push({
          name: `sport:${sport.name}`,
          type: 'interest',
          source: 'facebook'
        });
      }
    });
  }
  
  // Favorite teams
  if (friend.favorite_teams && friend.favorite_teams.length > 0) {
    friend.favorite_teams.forEach(team => {
      if (team.name) {
        tags.push({
          name: `team:${team.name}`,
          type: 'interest',
          source: 'facebook'
        });
      }
    });
  }
  
  // Relationship status
  if (friend.relationship_status) {
    tags.push({
      name: `relationship:${friend.relationship_status}`,
      type: 'custom',
      source: 'facebook'
    });
  }
  
  return tags;
}

/**
 * Extract metadata from LinkedIn connection
 * 
 * @param {Object} connection LinkedIn connection object
 * @returns {Object} Extracted metadata
 */
function extractMetadataFromLinkedInConnection(connection) {
  const metadata = {};
  
  // Industry
  if (connection.industryName) {
    metadata.work = metadata.work || [];
    metadata.work.push({
      company: null,
      position: null,
      industry: connection.industryName
    });
  }
  
  // Current positions
  if (connection.positions && connection.positions.elements) {
    metadata.work = metadata.work || [];
    
    connection.positions.elements.forEach(position => {
      metadata.work.push({
        company: position.companyName,
        position: position.title,
        dateRange: position.timePeriod ? 
          `${position.timePeriod.startDate ? `${position.timePeriod.startDate.year}` : 'Unknown'} to ${
            position.timePeriod.endDate ? `${position.timePeriod.endDate.year}` : 'Present'
          }` : null
      });
    });
  }
  
  // Education
  if (connection.educations && connection.educations.elements) {
    metadata.education = connection.educations.elements.map(edu => ({
      school: edu.school ? edu.school.name : null,
      degree: edu.degreeName || null,
      fieldOfStudy: edu.fieldOfStudy || null,
      dateRange: edu.timePeriod ? 
        `${edu.timePeriod.startDate ? `${edu.timePeriod.startDate.year}` : 'Unknown'} to ${
          edu.timePeriod.endDate ? `${edu.timePeriod.endDate.year}` : 'Present'
        }` : null
    }));
  }
  
  // Skills
  if (connection.skills && connection.skills.elements) {
    metadata.skills = connection.skills.elements.map(skill => skill.name);
  }
  
  // Location
  if (connection.location && connection.location.preferredGeoPlace) {
    if (connection.location.preferredGeoPlace.city) {
      metadata.location = `${connection.location.preferredGeoPlace.city.defaultName}, ${connection.location.preferredGeoPlace.country.defaultName}`;
    } else {
      metadata.location = connection.location.preferredGeoPlace.country.defaultName;
    }
  }
  
  return metadata;
}

/**
 * Format LinkedIn name from profile
 * 
 * @param {Object} profile LinkedIn profile
 * @returns {string} Formatted name
 */
function formatLinkedInName(profile) {
  let firstName = '';
  let lastName = '';
  
  if (profile.firstName) {
    // Handle localized name
    if (profile.firstName.localized) {
      firstName = profile.firstName.localized['en_US'] || Object.values(profile.firstName.localized)[0];
    } else {
      firstName = profile.firstName;
    }
  }
  
  if (profile.lastName) {
    // Handle localized name
    if (profile.lastName.localized) {
      lastName = profile.lastName.localized['en_US'] || Object.values(profile.lastName.localized)[0];
    } else {
      lastName = profile.lastName;
    }
  }
  
  return `${firstName} ${lastName}`.trim();
}

/**
 * Extract profile picture URL from LinkedIn profile
 * 
 * @param {Object} profile LinkedIn profile
 * @returns {string|null} URL of profile picture
 */
function extractProfilePictureUrl(profile) {
  if (profile.profilePicture && 
      profile.profilePicture['displayImage~'] && 
      profile.profilePicture['displayImage~'].elements && 
      profile.profilePicture['displayImage~'].elements.length > 0) {
    
    // Get the highest quality image
    const images = profile.profilePicture['displayImage~'].elements;
    const highestQuality = images.sort((a, b) => b.width - a.width)[0];
    
    if (highestQuality && highestQuality.identifiers && highestQuality.identifiers.length > 0) {
      return highestQuality.identifiers[0].identifier;
    }
  }
  
  return null;
}

module.exports = {
  syncFacebookContacts,
  syncLinkedInContacts,
  searchContacts,
  getPopularTags
};