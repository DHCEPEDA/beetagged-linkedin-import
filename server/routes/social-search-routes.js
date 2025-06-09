/**
 * Social Search Routes
 * Comprehensive social networking and lifestyle search capabilities
 */

const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const intelligentSearchService = require('../services/intelligent-search-service');
const logger = require('../../utils/logger');

/**
 * Search contacts by location for travel and social meetups
 * GET /api/social/search/location/:location
 */
router.get('/search/location/:location', async (req, res) => {
  try {
    const { location } = req.params;
    const { userId, context } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const searchResults = await intelligentSearchService.intelligentSearch(userId, {
      query: `people in ${location}`,
      intent: 'travel',
      location: location
    });

    // Enhanced location context analysis
    const locationAnalysis = await this.analyzeLocationConnections(userId, location);

    res.json({
      success: true,
      message: `Found ${searchResults.results.length} contacts in ${location}`,
      data: {
        location: location,
        searchContext: context || 'general',
        contacts: searchResults.results.map(contact => ({
          id: contact._id,
          name: contact.name,
          currentLocation: contact.location,
          hometown: contact.hometown,
          profilePictureUrl: contact.profilePictureUrl,
          email: contact.email,
          company: contact.company,
          jobTitle: contact.jobTitle,
          socialConnections: {
            facebookProfile: contact.facebookId ? `https://facebook.com/${contact.facebookId}` : null,
            linkedinProfile: contact.linkedinData?.publicProfileUrl,
            mutualFriends: contact.facebookData?.mutualFriends || 0
          },
          locationData: {
            currentLocation: contact.locationData?.currentLocation,
            hometown: contact.locationData?.hometown,
            familiarCities: contact.locationData?.cities || []
          },
          relevanceScore: contact.relevanceScore,
          matchReasons: contact.matchReasons,
          lastInteraction: contact.lastInteraction
        })),
        locationInsights: locationAnalysis,
        searchMetadata: searchResults.searchMetadata
      }
    });

  } catch (error) {
    logger.error('Social location search failed', {
      location: req.params.location,
      userId: req.query.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to search contacts by location',
      error: error.message
    });
  }
});

/**
 * Search contacts by interests and hobbies
 * GET /api/social/search/interest/:interest
 */
router.get('/search/interest/:interest', async (req, res) => {
  try {
    const { interest } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Search contacts with matching interests from Facebook data
    const contacts = await Contact.aggregate([
      { $match: { userId: userId } },
      {
        $addFields: {
          relevanceScore: {
            $add: [
              // Facebook interests match
              {
                $cond: [
                  {
                    $gt: [
                      {
                        $size: {
                          $filter: {
                            input: { $ifNull: ['$facebookData.interests', []] },
                            cond: { $regexMatch: { input: '$$this.name', regex: interest, options: 'i' } }
                          }
                        }
                      }, 0
                    ]
                  },
                  15, 0
                ]
              },
              // Tags match
              {
                $multiply: [
                  {
                    $size: {
                      $filter: {
                        input: '$tags',
                        cond: {
                          $and: [
                            { $eq: ['$$this.category', 'interests'] },
                            { $regexMatch: { input: '$$this.value', regex: interest, options: 'i' } }
                          ]
                        }
                      }
                    }
                  },
                  10
                ]
              },
              // About section mentions
              {
                $cond: [
                  { $regexMatch: { input: { $ifNull: ['$facebookData.about', ''] }, regex: interest, options: 'i' } },
                  8, 0
                ]
              }
            ]
          },
          matchReasons: {
            $concatArrays: [
              {
                $cond: [
                  {
                    $gt: [
                      {
                        $size: {
                          $filter: {
                            input: { $ifNull: ['$facebookData.interests', []] },
                            cond: { $regexMatch: { input: '$$this.name', regex: interest, options: 'i' } }
                          }
                        }
                      }, 0
                    ]
                  },
                  [`interested in ${interest}`], []
                ]
              }
            ]
          }
        }
      },
      { $match: { relevanceScore: { $gt: 0 } } },
      { $sort: { relevanceScore: -1, name: 1 } },
      { $limit: 50 }
    ]);

    res.json({
      success: true,
      message: `Found ${contacts.length} contacts interested in ${interest}`,
      data: {
        interest: interest,
        contacts: contacts.map(contact => ({
          id: contact._id,
          name: contact.name,
          profilePictureUrl: contact.profilePictureUrl,
          location: contact.location,
          company: contact.company,
          relevanceScore: contact.relevanceScore,
          matchReasons: contact.matchReasons,
          socialData: {
            facebookInterests: contact.facebookData?.interests || [],
            about: contact.facebookData?.about,
            mutualFriends: contact.facebookData?.mutualFriends || 0
          },
          interestTags: contact.tags?.filter(tag => tag.category === 'interests') || []
        }))
      }
    });

  } catch (error) {
    logger.error('Interest search failed', {
      interest: req.params.interest,
      userId: req.query.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to search contacts by interest',
      error: error.message
    });
  }
});

/**
 * Search contacts by relationship status and personal attributes
 * GET /api/social/search/relationship/:status
 */
router.get('/search/relationship/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const { userId } = req.query;

    const contacts = await Contact.find({
      userId: userId,
      'facebookData.relationshipStatus': new RegExp(status, 'i')
    }).sort({ name: 1 });

    res.json({
      success: true,
      data: {
        relationshipStatus: status,
        contacts: contacts.map(contact => ({
          id: contact._id,
          name: contact.name,
          profilePictureUrl: contact.profilePictureUrl,
          location: contact.location,
          relationshipStatus: contact.facebookData?.relationshipStatus,
          age: this.calculateAge(contact.facebookData?.birthday),
          mutualFriends: contact.facebookData?.mutualFriends || 0
        }))
      }
    });

  } catch (error) {
    logger.error('Relationship search failed', {
      status: req.params.status,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to search by relationship status',
      error: error.message
    });
  }
});

/**
 * Search contacts by school/education for alumni networks
 * GET /api/social/search/school/:school
 */
router.get('/search/school/:school', async (req, res) => {
  try {
    const { school } = req.params;
    const { userId } = req.query;

    const contacts = await Contact.aggregate([
      { $match: { userId: userId } },
      {
        $addFields: {
          relevanceScore: {
            $add: [
              // Education history match
              {
                $multiply: [
                  {
                    $size: {
                      $filter: {
                        input: '$education',
                        cond: { $regexMatch: { input: '$$this.school', regex: school, options: 'i' } }
                      }
                    }
                  },
                  15
                ]
              },
              // Facebook education match
              {
                $cond: [
                  {
                    $gt: [
                      {
                        $size: {
                          $filter: {
                            input: { $ifNull: ['$facebookData.education', []] },
                            cond: { $regexMatch: { input: '$$this.school.name', regex: school, options: 'i' } }
                          }
                        }
                      }, 0
                    ]
                  },
                  12, 0
                ]
              }
            ]
          }
        }
      },
      { $match: { relevanceScore: { $gt: 0 } } },
      { $sort: { relevanceScore: -1, name: 1 } }
    ]);

    res.json({
      success: true,
      message: `Found ${contacts.length} alumni from ${school}`,
      data: {
        school: school,
        contacts: contacts.map(contact => ({
          id: contact._id,
          name: contact.name,
          profilePictureUrl: contact.profilePictureUrl,
          location: contact.location,
          company: contact.company,
          jobTitle: contact.jobTitle,
          education: contact.education?.filter(edu => 
            edu.school && edu.school.toLowerCase().includes(school.toLowerCase())
          ),
          graduationYear: this.extractGraduationYear(contact.education, school),
          relevanceScore: contact.relevanceScore
        }))
      }
    });

  } catch (error) {
    logger.error('School search failed', {
      school: req.params.school,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to search by school',
      error: error.message
    });
  }
});

/**
 * Get social network overview and insights
 * GET /api/social/network-insights/:userId
 */
router.get('/network-insights/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const insights = await Contact.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalContacts: { $sum: 1 },
          withFacebookData: { $sum: { $cond: [{ $ne: ['$facebookId', null] }, 1, 0] } },
          locations: { $addToSet: '$location' },
          hometowns: { $addToSet: '$hometown' },
          relationshipStatuses: { $addToSet: '$facebookData.relationshipStatus' },
          schools: { 
            $push: { 
              $map: {
                input: '$education',
                as: 'edu',
                in: '$$edu.school'
              }
            }
          },
          avgMutualFriends: { $avg: '$facebookData.mutualFriends' },
          interestCategories: {
            $push: {
              $map: {
                input: { $filter: { input: '$tags', cond: { $eq: ['$$this.category', 'interests'] } } },
                as: 'tag',
                in: '$$tag.value'
              }
            }
          }
        }
      },
      {
        $project: {
          totalContacts: 1,
          socialDataCoverage: { 
            $multiply: [{ $divide: ['$withFacebookData', '$totalContacts'] }, 100]
          },
          geographicReach: {
            locations: { $size: { $filter: { input: '$locations', cond: { $ne: ['$$this', null] } } } },
            topLocations: { $slice: [{ $filter: { input: '$locations', cond: { $ne: ['$$this', null] } } }, 10] }
          },
          socialInsights: {
            avgMutualFriends: { $round: ['$avgMutualFriends', 1] },
            relationshipDiversity: { $size: { $filter: { input: '$relationshipStatuses', cond: { $ne: ['$$this', null] } } } }
          },
          educationNetwork: {
            schools: { 
              $slice: [
                { 
                  $setUnion: [
                    { 
                      $reduce: {
                        input: '$schools',
                        initialValue: [],
                        in: { $concatArrays: ['$$value', '$$this'] }
                      }
                    }
                  ]
                }, 
                15
              ]
            }
          },
          topInterests: {
            $slice: [
              {
                $setUnion: [
                  {
                    $reduce: {
                      input: '$interestCategories',
                      initialValue: [],
                      in: { $concatArrays: ['$$value', '$$this'] }
                    }
                  }
                ]
              },
              20
            ]
          }
        }
      }
    ]);

    const networkData = insights.length > 0 ? insights[0] : {
      totalContacts: 0,
      socialDataCoverage: 0,
      geographicReach: { locations: 0, topLocations: [] },
      socialInsights: { avgMutualFriends: 0, relationshipDiversity: 0 },
      educationNetwork: { schools: [] },
      topInterests: []
    };

    res.json({
      success: true,
      data: {
        networkSize: networkData.totalContacts,
        socialDataCoverage: Math.round(networkData.socialDataCoverage * 100) / 100,
        geographicReach: networkData.geographicReach,
        socialConnectivity: networkData.socialInsights,
        educationNetwork: networkData.educationNetwork,
        interests: networkData.topInterests,
        quickSocialSearches: {
          popularLocations: networkData.geographicReach.topLocations.slice(0, 5),
          popularInterests: networkData.topInterests.slice(0, 8),
          schools: networkData.educationNetwork.schools.slice(0, 5)
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get social network insights', {
      userId: req.params.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get network insights',
      error: error.message
    });
  }
});

/**
 * Smart social search with natural language
 * POST /api/social/search/smart
 */
router.post('/search/smart', async (req, res) => {
  try {
    const { userId, query } = req.body;

    if (!userId || !query) {
      return res.status(400).json({
        success: false,
        message: 'userId and query are required'
      });
    }

    const searchResults = await intelligentSearchService.intelligentSearch(userId, {
      query: query,
      autoDetect: true
    });

    res.json({
      success: true,
      data: {
        originalQuery: query,
        detectedIntent: searchResults.detectedIntent,
        results: searchResults.results.map(contact => ({
          id: contact._id,
          name: contact.name,
          profilePictureUrl: contact.profilePictureUrl,
          location: contact.location,
          company: contact.company,
          socialProfile: {
            facebookProfile: contact.facebookId ? `https://facebook.com/${contact.facebookId}` : null,
            mutualFriends: contact.facebookData?.mutualFriends || 0,
            relationshipStatus: contact.facebookData?.relationshipStatus
          },
          relevanceScore: contact.relevanceScore,
          matchReasons: contact.matchReasons
        })),
        metadata: searchResults.searchMetadata
      }
    });

  } catch (error) {
    logger.error('Smart social search failed', {
      userId: req.body.userId,
      query: req.body.query,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Smart social search failed',
      error: error.message
    });
  }
});

/**
 * Analyze location connections for travel insights
 * @param {string} userId - User ID
 * @param {string} location - Location to analyze
 * @returns {Object} Location analysis
 */
async function analyzeLocationConnections(userId, location) {
  try {
    const analysis = await Contact.aggregate([
      { 
        $match: { 
          userId: userId,
          $or: [
            { location: new RegExp(location, 'i') },
            { hometown: new RegExp(location, 'i') },
            { 'workHistory.location': new RegExp(location, 'i') }
          ]
        }
      },
      {
        $group: {
          _id: null,
          currentResidents: {
            $sum: { $cond: [{ $regexMatch: { input: '$location', regex: location, options: 'i' } }, 1, 0] }
          },
          fromThereOriginally: {
            $sum: { $cond: [{ $regexMatch: { input: '$hometown', regex: location, options: 'i' } }, 1, 0] }
          },
          workedThere: {
            $sum: {
              $cond: [
                {
                  $gt: [
                    {
                      $size: {
                        $filter: {
                          input: '$workHistory',
                          cond: { $regexMatch: { input: '$$this.location', regex: location, options: 'i' } }
                        }
                      }
                    }, 0
                  ]
                }, 1, 0
              ]
            }
          },
          avgMutualFriends: { $avg: '$facebookData.mutualFriends' },
          companies: { $addToSet: '$company' }
        }
      }
    ]);

    return analysis.length > 0 ? analysis[0] : {
      currentResidents: 0,
      fromThereOriginally: 0,
      workedThere: 0,
      avgMutualFriends: 0,
      companies: []
    };

  } catch (error) {
    logger.error('Location analysis failed', { userId, location, error: error.message });
    return { currentResidents: 0, fromThereOriginally: 0, workedThere: 0 };
  }
}

/**
 * Calculate age from birthday string
 * @param {string} birthday - Birthday string
 * @returns {number} Age or null
 */
function calculateAge(birthday) {
  if (!birthday) return null;
  
  try {
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    
    if (today.getMonth() < birthDate.getMonth() || 
        (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age > 0 && age < 120 ? age : null;
  } catch (error) {
    return null;
  }
}

/**
 * Extract graduation year for specific school
 * @param {Array} education - Education array
 * @param {string} school - School name
 * @returns {string} Graduation year or null
 */
function extractGraduationYear(education, school) {
  if (!education || !Array.isArray(education)) return null;
  
  const schoolMatch = education.find(edu => 
    edu.school && edu.school.toLowerCase().includes(school.toLowerCase())
  );
  
  return schoolMatch?.year || null;
}

module.exports = router;