/**
 * Natural Language Search Routes - Core User Pain Point Solutions
 * 
 * ADDRESSES RESEARCH FINDINGS:
 * - 67% struggle with friend communication -> "Who can help with X?"
 * - 48% work-related tasks -> "Who works at Y?" "Who knows Z?"
 * - 46% shopping -> "Who recommends restaurants?" "Who shops at X?"
 * - 35% event attendance -> "Who's going?" "Who should I invite?"
 * 
 * CORE VALUE: Search YOUR world as YOU define it
 */

const express = require('express');
const router = express.Router();
const naturalLanguageSearchService = require('../services/natural-language-search-service');
const Contact = require('../models/Contact');
const logger = require('../../utils/logger');

/**
 * Main natural language search endpoint
 * POST /api/search/natural
 */
router.post('/natural', async (req, res) => {
  try {
    const { query, userId, userLocation } = req.body;

    if (!query || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Query and userId required'
      });
    }

    // Process the natural language query
    const searchResults = await naturalLanguageSearchService.processNaturalLanguageQuery(query, userId);

    // Log search for analytics
    logger.info('Natural language search performed', {
      userId: userId,
      query: query,
      resultCount: searchResults.resultCount,
      intent: searchResults.intent?.type
    });

    res.json(searchResults);

  } catch (error) {
    logger.error('Natural language search failed', {
      userId: req.body.userId,
      query: req.body.query,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
});

/**
 * Quick search for common use cases
 * GET /api/search/quick/:type
 */
router.get('/quick/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { userId, location, interest } = req.query;

    let searchQuery;
    let explanation;

    switch (type) {
      case 'friends-nearby':
        searchQuery = location ? `friends in ${location}` : 'friends near me';
        explanation = 'Find friends in your area for activities';
        break;
      
      case 'work-connections':
        searchQuery = 'work colleagues';
        explanation = 'Find professional connections for work tasks';
        break;
      
      case 'shopping-recommendations':
        searchQuery = interest ? `friends who like ${interest}` : 'friends who shop';
        explanation = 'Find friends who can recommend products or services';
        break;
      
      case 'event-invites':
        searchQuery = interest ? `friends interested in ${interest}` : 'social friends';
        explanation = 'Find friends to invite to events';
        break;
      
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid quick search type'
        });
    }

    const searchResults = await naturalLanguageSearchService.processNaturalLanguageQuery(searchQuery, userId);
    searchResults.quickSearchType = type;
    searchResults.explanation = explanation;

    res.json(searchResults);

  } catch (error) {
    logger.error('Quick search failed', {
      type: req.params.type,
      userId: req.query.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Quick search failed',
      error: error.message
    });
  }
});

/**
 * Search suggestions based on user's contact patterns
 * GET /api/search/suggestions/:userId
 */
router.get('/suggestions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Analyze user's contacts to generate personalized suggestions
    const contacts = await Contact.find({ userId }).limit(100);
    
    const suggestions = {
      byFunction: [],
      byLocation: [],
      byCompany: [],
      byInterest: []
    };

    // Extract common patterns from user's network
    const functionCounts = {};
    const locationCounts = {};
    const companyCounts = {};

    contacts.forEach(contact => {
      // Count job functions
      const jobFunction = contact.priorityData?.employment?.current?.jobFunction;
      if (jobFunction) {
        functionCounts[jobFunction] = (functionCounts[jobFunction] || 0) + 1;
      }

      // Count locations
      const location = contact.priorityData?.location?.current;
      if (location) {
        locationCounts[location] = (locationCounts[location] || 0) + 1;
      }

      // Count companies
      const company = contact.priorityData?.employment?.current?.employer;
      if (company) {
        companyCounts[company] = (companyCounts[company] || 0) + 1;
      }
    });

    // Generate suggestions based on most common patterns
    suggestions.byFunction = Object.entries(functionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([func, count]) => ({
        query: `who works in ${func}`,
        description: `Find your ${count} contacts in ${func}`,
        count: count
      }));

    suggestions.byLocation = Object.entries(locationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([loc, count]) => ({
        query: `who lives in ${loc}`,
        description: `Find your ${count} contacts in ${loc}`,
        count: count
      }));

    suggestions.byCompany = Object.entries(companyCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([company, count]) => ({
        query: `who works at ${company}`,
        description: `Find your ${count} contacts at ${company}`,
        count: count
      }));

    // Add use-case specific suggestions based on research
    suggestions.useCases = [
      {
        category: 'Friend Communication (67% need)',
        queries: [
          'friends in my city',
          'friends who like music',
          'friends for weekend activities'
        ]
      },
      {
        category: 'Work Tasks (48% need)',
        queries: [
          'who works in marketing',
          'who knows about startups',
          'former colleagues'
        ]
      },
      {
        category: 'Shopping (46% need)',
        queries: [
          'friends who love food',
          'friends in fashion',
          'friends who travel'
        ]
      },
      {
        category: 'Events (35% need)',
        queries: [
          'friends for networking events',
          'friends who like parties',
          'friends in tech meetups'
        ]
      }
    ];

    res.json({
      success: true,
      message: 'Personalized search suggestions generated',
      data: suggestions,
      totalContacts: contacts.length
    });

  } catch (error) {
    logger.error('Failed to generate search suggestions', {
      userId: req.params.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to generate suggestions',
      error: error.message
    });
  }
});

/**
 * Advanced search with multiple filters
 * POST /api/search/advanced
 */
router.post('/advanced', async (req, res) => {
  try {
    const { 
      userId, 
      jobFunction, 
      location, 
      company, 
      interest,
      timeframe,
      relationship 
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId required'
      });
    }

    // Build complex query
    const query = { userId };
    const orConditions = [];

    if (jobFunction) {
      orConditions.push(
        { 'priorityData.employment.current.jobFunction': new RegExp(jobFunction, 'i') },
        { 'priorityData.employment.history.jobFunction': new RegExp(jobFunction, 'i') }
      );
    }

    if (location) {
      orConditions.push(
        { 'priorityData.location.current': new RegExp(location, 'i') },
        { 'priorityData.location.workLocations': new RegExp(location, 'i') }
      );
    }

    if (company) {
      if (timeframe === 'current') {
        orConditions.push({ 'priorityData.employment.current.employer': new RegExp(company, 'i') });
      } else {
        orConditions.push(
          { 'priorityData.employment.current.employer': new RegExp(company, 'i') },
          { 'priorityData.employment.history.employer': new RegExp(company, 'i') }
        );
      }
    }

    if (interest) {
      orConditions.push(
        { 'priorityData.social.interests.name': new RegExp(interest, 'i') },
        { 'priorityData.social.hobbies': new RegExp(interest, 'i') }
      );
    }

    if (orConditions.length > 0) {
      query.$or = orConditions;
    }

    const contacts = await Contact.find(query)
      .sort({ lastEnriched: -1 })
      .limit(50);

    // Format results for display
    const results = contacts.map(contact => ({
      id: contact._id,
      name: contact.name,
      currentJob: contact.priorityData?.employment?.current?.jobFunction,
      currentEmployer: contact.priorityData?.employment?.current?.employer,
      currentLocation: contact.priorityData?.location?.current,
      phoneNumber: contact.phoneNumber,
      email: contact.email,
      lastEnriched: contact.lastEnriched,
      dataSources: {
        hasFacebook: !!contact.facebookData,
        hasLinkedIn: !!contact.linkedinData
      }
    }));

    res.json({
      success: true,
      message: 'Advanced search completed',
      data: {
        results: results,
        resultCount: results.length,
        filters: {
          jobFunction,
          location,
          company,
          interest,
          timeframe,
          relationship
        }
      }
    });

  } catch (error) {
    logger.error('Advanced search failed', {
      userId: req.body.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Advanced search failed',
      error: error.message
    });
  }
});

/**
 * Search analytics for understanding user behavior
 * GET /api/search/analytics/:userId
 */
router.get('/analytics/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const analytics = await naturalLanguageSearchService.getSearchAnalytics(userId);

    // Add user-specific insights
    const userContacts = await Contact.find({ userId });
    const enrichmentStats = {
      totalContacts: userContacts.length,
      enrichedContacts: userContacts.filter(c => c.facebookData || c.linkedinData).length,
      facebookEnriched: userContacts.filter(c => c.facebookData).length,
      linkedinEnriched: userContacts.filter(c => c.linkedinData).length
    };

    res.json({
      success: true,
      message: 'Search analytics retrieved',
      data: {
        ...analytics,
        userStats: enrichmentStats,
        searchEffectiveness: {
          searchableContacts: enrichmentStats.enrichedContacts,
          searchablePercentage: Math.round((enrichmentStats.enrichedContacts / enrichmentStats.totalContacts) * 100) || 0
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get search analytics', {
      userId: req.params.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get analytics',
      error: error.message
    });
  }
});

module.exports = router;