/**
 * Professional Search Routes
 * Core MVP functionality for job search and professional networking
 */

const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const intelligentSearchService = require('../services/intelligent-search-service');
const logger = require('../../utils/logger');

/**
 * Search contacts by company - "Who do I know at Google?"
 * GET /api/professional/search/company/:company
 */
router.get('/search/company/:company', async (req, res) => {
  try {
    const { company } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Use intelligent search for company-specific queries
    const searchResults = await intelligentSearchService.intelligentSearch(userId, {
      query: `people at ${company}`,
      intent: 'job_search',
      company: company
    });

    res.json({
      success: true,
      message: `Found ${searchResults.results.length} contacts at ${company}`,
      data: {
        company: company,
        contacts: searchResults.results.map(contact => ({
          id: contact._id,
          name: contact.name,
          jobTitle: contact.jobTitle,
          company: contact.company,
          location: contact.location,
          profilePictureUrl: contact.profilePictureUrl,
          email: contact.email,
          workHistory: contact.workHistory,
          matchReasons: contact.matchReasons,
          relevanceScore: contact.relevanceScore,
          linkedinProfile: contact.linkedinData?.publicProfileUrl,
          lastInteraction: contact.lastInteraction,
          matchConfidence: contact.matchConfidence
        })),
        searchMetadata: searchResults.searchMetadata
      }
    });

  } catch (error) {
    logger.error('Company search failed', {
      company: req.params.company,
      userId: req.query.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to search contacts by company',
      error: error.message
    });
  }
});

/**
 * Search contacts by job function - "Who do I know in marketing?"
 * GET /api/professional/search/function/:jobFunction
 */
router.get('/search/function/:jobFunction', async (req, res) => {
  try {
    const { jobFunction } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const searchResults = await intelligentSearchService.intelligentSearch(userId, {
      query: `people in ${jobFunction}`,
      intent: 'skill_help',
      skill: jobFunction
    });

    res.json({
      success: true,
      message: `Found ${searchResults.results.length} contacts in ${jobFunction}`,
      data: {
        jobFunction: jobFunction,
        contacts: searchResults.results.map(contact => ({
          id: contact._id,
          name: contact.name,
          jobTitle: contact.jobTitle,
          company: contact.company,
          location: contact.location,
          profilePictureUrl: contact.profilePictureUrl,
          email: contact.email,
          workHistory: contact.workHistory,
          skills: contact.skills,
          relevanceScore: contact.relevanceScore,
          matchReasons: contact.matchReasons,
          experienceLevel: this.calculateExperienceLevel(contact.workHistory),
          linkedinProfile: contact.linkedinData?.publicProfileUrl
        })),
        searchMetadata: searchResults.searchMetadata
      }
    });

  } catch (error) {
    logger.error('Job function search failed', {
      jobFunction: req.params.jobFunction,
      userId: req.query.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to search contacts by job function',
      error: error.message
    });
  }
});

/**
 * Get professional overview of user's network
 * GET /api/professional/network-overview/:userId
 */
router.get('/network-overview/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const overview = await Contact.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalContacts: { $sum: 1 },
          enrichedContacts: {
            $sum: {
              $cond: [
                { $or: [{ $ne: ['$facebookId', null] }, { $ne: ['$linkedinId', null] }] },
                1, 0
              ]
            }
          },
          topCompanies: { 
            $push: { 
              $cond: [{ $ne: ['$company', null] }, '$company', null] 
            }
          },
          topJobTitles: { 
            $push: { 
              $cond: [{ $ne: ['$jobTitle', null] }, '$jobTitle', null] 
            }
          },
          topLocations: { 
            $push: { 
              $cond: [{ $ne: ['$location', null] }, '$location', null] 
            }
          },
          withLinkedIn: {
            $sum: { $cond: [{ $ne: ['$linkedinId', null] }, 1, 0] }
          },
          withJobInfo: {
            $sum: { $cond: [{ $ne: ['$company', null] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          totalContacts: 1,
          enrichedContacts: 1,
          withLinkedIn: 1,
          withJobInfo: 1,
          enrichmentRate: { 
            $multiply: [
              { $divide: ['$enrichedContacts', '$totalContacts'] }, 
              100
            ]
          },
          topCompanies: {
            $slice: [
              { $setUnion: [{ $filter: { input: '$topCompanies', cond: { $ne: ['$$this', null] } } }] },
              10
            ]
          },
          topJobTitles: {
            $slice: [
              { $setUnion: [{ $filter: { input: '$topJobTitles', cond: { $ne: ['$$this', null] } } }] },
              10
            ]
          },
          topLocations: {
            $slice: [
              { $setUnion: [{ $filter: { input: '$topLocations', cond: { $ne: ['$$this', null] } } }] },
              10
            ]
          }
        }
      }
    ]);

    const networkData = overview.length > 0 ? overview[0] : {
      totalContacts: 0,
      enrichedContacts: 0,
      withLinkedIn: 0,
      withJobInfo: 0,
      enrichmentRate: 0,
      topCompanies: [],
      topJobTitles: [],
      topLocations: []
    };

    res.json({
      success: true,
      data: {
        networkSize: networkData.totalContacts,
        professionalData: {
          enrichmentRate: Math.round(networkData.enrichmentRate * 100) / 100,
          contactsWithJobInfo: networkData.withJobInfo,
          linkedinConnections: networkData.withLinkedIn,
          dataCompleteness: networkData.withJobInfo > 0 ? 
            Math.round((networkData.withJobInfo / networkData.totalContacts) * 100) : 0
        },
        topCompanies: networkData.topCompanies,
        topJobFunctions: networkData.topJobTitles,
        topLocations: networkData.topLocations,
        quickSearchSuggestions: {
          companies: networkData.topCompanies.slice(0, 5),
          jobFunctions: this.extractJobFunctions(networkData.topJobTitles),
          locations: networkData.topLocations.slice(0, 5)
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get network overview', {
      userId: req.params.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get network overview',
      error: error.message
    });
  }
});

/**
 * Smart professional search with natural language
 * POST /api/professional/search/smart
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
        extractedContext: searchResults.extractedContext,
        results: searchResults.results.map(contact => ({
          id: contact._id,
          name: contact.name,
          jobTitle: contact.jobTitle,
          company: contact.company,
          location: contact.location,
          profilePictureUrl: contact.profilePictureUrl,
          email: contact.email,
          relevanceScore: contact.relevanceScore,
          matchReasons: contact.matchReasons,
          workHistory: contact.workHistory?.slice(0, 2), // Show recent positions
          linkedinProfile: contact.linkedinData?.publicProfileUrl,
          lastInteraction: contact.lastInteraction
        })),
        metadata: searchResults.searchMetadata
      }
    });

  } catch (error) {
    logger.error('Smart search failed', {
      userId: req.body.userId,
      query: req.body.query,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Smart search failed',
      error: error.message
    });
  }
});

/**
 * Get professional search suggestions
 * GET /api/professional/search-suggestions/:userId
 */
router.get('/search-suggestions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const suggestions = await intelligentSearchService.getSmartSuggestions(userId);

    // Add professional-specific suggestions
    const professionalSuggestions = {
      popularSearches: [
        "Who do I know at Google?",
        "Who do I know in marketing?",
        "Who do I know in New York?",
        "Who can help with programming?",
        "Who works in finance?"
      ],
      yourNetwork: {
        companies: suggestions.jobSearch || [],
        functions: this.extractJobFunctions(suggestions.skillHelp || []),
        locations: suggestions.travel || []
      },
      recentContacts: suggestions.recent || []
    };

    res.json({
      success: true,
      data: professionalSuggestions
    });

  } catch (error) {
    logger.error('Failed to get search suggestions', {
      userId: req.params.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get search suggestions',
      error: error.message
    });
  }
});

/**
 * Track search interaction for learning
 * POST /api/professional/track-interaction
 */
router.post('/track-interaction', async (req, res) => {
  try {
    const { userId, contactId, interactionType, searchQuery } = req.body;

    if (!userId || !contactId || !interactionType) {
      return res.status(400).json({
        success: false,
        message: 'userId, contactId, and interactionType are required'
      });
    }

    // Update contact interaction tracking
    await Contact.findOneAndUpdate(
      { _id: contactId, userId: userId },
      {
        $set: { lastInteraction: new Date() },
        $inc: { interactionCount: 1 }
      }
    );

    logger.info('Professional search interaction tracked', {
      userId,
      contactId,
      interactionType,
      searchQuery
    });

    res.json({
      success: true,
      message: 'Interaction tracked successfully'
    });

  } catch (error) {
    logger.error('Failed to track interaction', {
      userId: req.body.userId,
      contactId: req.body.contactId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to track interaction',
      error: error.message
    });
  }
});

/**
 * Calculate experience level from work history
 * @param {Array} workHistory - Work history array
 * @returns {string} Experience level
 */
function calculateExperienceLevel(workHistory) {
  if (!workHistory || workHistory.length === 0) return 'unknown';
  
  // Simple calculation based on number of positions and tenure
  const positions = workHistory.length;
  const hasCurrentJob = workHistory.some(job => job.isCurrent || !job.endDate);
  
  if (positions >= 3 && hasCurrentJob) return 'senior';
  if (positions >= 2) return 'mid-level';
  return 'junior';
}

/**
 * Extract job functions from job titles
 * @param {Array} jobTitles - Array of job titles
 * @returns {Array} Extracted job functions
 */
function extractJobFunctions(jobTitles) {
  const functions = new Set();
  
  const functionKeywords = {
    'marketing': ['marketing', 'brand', 'growth', 'demand'],
    'engineering': ['engineer', 'developer', 'programmer', 'technical'],
    'sales': ['sales', 'account', 'business development'],
    'product': ['product', 'pm'],
    'design': ['design', 'ux', 'ui'],
    'finance': ['finance', 'accounting', 'analyst'],
    'operations': ['operations', 'ops', 'logistics'],
    'hr': ['hr', 'human resources', 'people'],
    'legal': ['legal', 'counsel', 'attorney']
  };

  jobTitles.forEach(title => {
    if (!title) return;
    const lowerTitle = title.toLowerCase();
    
    Object.entries(functionKeywords).forEach(([func, keywords]) => {
      if (keywords.some(keyword => lowerTitle.includes(keyword))) {
        functions.add(func);
      }
    });
  });

  return Array.from(functions).slice(0, 8);
}

module.exports = router;