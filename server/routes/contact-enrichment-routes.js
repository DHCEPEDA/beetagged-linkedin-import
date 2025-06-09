/**
 * Contact Enrichment Routes
 * Handles phone contact import and Facebook/LinkedIn enrichment
 */

const express = require('express');
const router = express.Router();
const contactMatchingService = require('../services/contact-matching-service');
const contactSearchService = require('../services/contact-search-service');
const automatedTaggingService = require('../services/automated-tagging-service');
const authService = require('../services/auth-service');
const Contact = require('../models/Contact');
const logger = require('../../utils/logger');

/**
 * Import phone contacts and enrich with Facebook data
 * POST /api/contacts/import-and-enrich
 */
router.post('/import-and-enrich', async (req, res) => {
  try {
    const { phoneContacts, facebookToken, userId } = req.body;

    if (!phoneContacts || !Array.isArray(phoneContacts)) {
      return res.status(400).json({
        success: false,
        message: 'Phone contacts array is required'
      });
    }

    if (!facebookToken) {
      return res.status(400).json({
        success: false,
        message: 'Facebook token is required for enrichment'
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    logger.info('Starting contact import and enrichment', {
      userId,
      phoneContactsCount: phoneContacts.length
    });

    // Step 1: Get Facebook friends list
    const facebookContacts = await authService.facebook.getContacts(facebookToken);
    
    logger.info('Retrieved Facebook contacts', {
      userId,
      facebookContactsCount: facebookContacts.length
    });

    // Step 2: Match phone contacts with Facebook profiles
    const matchedContacts = await contactMatchingService.matchContactsWithFacebook(
      phoneContacts,
      facebookContacts,
      facebookToken
    );

    // Step 3: Save enriched contacts to database
    const savedContacts = [];
    for (const contact of matchedContacts) {
      try {
        const contactDoc = new Contact({
          userId: userId,
          name: contact.name || contact.facebookData?.name,
          email: contact.email || contact.facebookData?.email,
          phoneNumber: contact.phoneNumber,
          company: contact.workHistory?.[0]?.employer,
          jobTitle: contact.workHistory?.[0]?.position,
          location: contact.locationData?.currentLocation?.name,
          hometown: contact.locationData?.hometown?.name,
          profilePictureUrl: contact.facebookData?.profilePictureUrl,
          facebookId: contact.facebookMatch?.id,
          facebookData: contact.facebookData,
          locationData: contact.locationData,
          workHistory: contact.workHistory,
          education: contact.education,
          tags: contact.tags || [],
          matchConfidence: contact.facebookMatch?.confidence || 0,
          matchMethod: contact.facebookMatch?.method,
          lastEnriched: new Date(),
          source: 'phone_facebook'
        });

        const saved = await contactDoc.save();
        savedContacts.push(saved);
      } catch (saveError) {
        logger.warn('Failed to save contact', {
          contactName: contact.name,
          error: saveError.message
        });
      }
    }

    const enrichedCount = savedContacts.filter(c => c.facebookId).length;

    logger.info('Contact import and enrichment completed', {
      userId,
      totalContacts: phoneContacts.length,
      enrichedContacts: enrichedCount,
      savedContacts: savedContacts.length
    });

    res.json({
      success: true,
      message: `Successfully imported ${savedContacts.length} contacts and enriched ${enrichedCount} with Facebook data`,
      data: {
        totalImported: savedContacts.length,
        enrichedWithFacebook: enrichedCount,
        contacts: savedContacts
      }
    });

  } catch (error) {
    logger.error('Contact import and enrichment failed', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to import and enrich contacts',
      error: error.message
    });
  }
});

/**
 * Search contacts by location (Seattle travel use case)
 * GET /api/contacts/search/location/:location
 */
router.get('/search/location/:location', async (req, res) => {
  try {
    const { location } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    logger.info('Location-based contact search', {
      userId,
      location
    });

    // Search contacts by location
    const searchResults = await contactSearchService.searchContacts(userId, {
      location: location
    });

    // Also search in hometown and work locations
    const hometownResults = await Contact.find({
      userId: userId,
      'locationData.hometown.name': new RegExp(location, 'i')
    });

    const workLocationResults = await Contact.find({
      userId: userId,
      'workHistory.location': new RegExp(location, 'i')
    });

    // Combine and deduplicate results
    const allResults = [
      ...searchResults,
      ...hometownResults,
      ...workLocationResults
    ];

    const uniqueResults = allResults.filter((contact, index, self) => 
      index === self.findIndex(c => c._id.toString() === contact._id.toString())
    );

    // Sort by match relevance and enrichment quality
    const sortedResults = uniqueResults.sort((a, b) => {
      // Prioritize contacts with current location matches
      if (a.location && a.location.toLowerCase().includes(location.toLowerCase())) return -1;
      if (b.location && b.location.toLowerCase().includes(location.toLowerCase())) return 1;
      
      // Then by match confidence
      return (b.matchConfidence || 0) - (a.matchConfidence || 0);
    });

    logger.info('Location search completed', {
      userId,
      location,
      resultCount: sortedResults.length
    });

    res.json({
      success: true,
      message: `Found ${sortedResults.length} contacts in ${location}`,
      data: {
        location: location,
        contacts: sortedResults,
        searchTypes: {
          currentLocation: searchResults.length,
          hometown: hometownResults.length,
          workLocation: workLocationResults.length
        }
      }
    });

  } catch (error) {
    logger.error('Location search failed', {
      location: req.params.location,
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
 * Search contacts by company (job search use case)
 * GET /api/contacts/search/company/:company
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

    logger.info('Company-based contact search', {
      userId,
      company
    });

    const searchResults = await contactSearchService.searchContacts(userId, {
      company: company
    });

    logger.info('Company search completed', {
      userId,
      company,
      resultCount: searchResults.length
    });

    res.json({
      success: true,
      message: `Found ${searchResults.length} contacts at ${company}`,
      data: {
        company: company,
        contacts: searchResults
      }
    });

  } catch (error) {
    logger.error('Company search failed', {
      company: req.params.company,
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
 * Search contacts by job function/title
 * GET /api/contacts/search/function/:jobTitle
 */
router.get('/search/function/:jobTitle', async (req, res) => {
  try {
    const { jobTitle } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const searchResults = await contactSearchService.searchContacts(userId, {
      jobTitle: jobTitle
    });

    res.json({
      success: true,
      message: `Found ${searchResults.length} contacts in ${jobTitle}`,
      data: {
        jobTitle: jobTitle,
        contacts: searchResults
      }
    });

  } catch (error) {
    logger.error('Job function search failed', {
      jobTitle: req.params.jobTitle,
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
 * Get search suggestions for user
 * GET /api/contacts/search/suggestions
 */
router.get('/search/suggestions', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const suggestions = await contactSearchService.getSearchSuggestions(userId);

    res.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    logger.error('Failed to get search suggestions', {
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
 * Advanced search with multiple criteria
 * POST /api/contacts/search/advanced
 */
router.post('/search/advanced', async (req, res) => {
  try {
    const { userId, searchParams } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const searchResults = await contactSearchService.searchContacts(userId, searchParams);

    res.json({
      success: true,
      message: `Found ${searchResults.length} contacts matching your criteria`,
      data: {
        searchParams: searchParams,
        contacts: searchResults
      }
    });

  } catch (error) {
    logger.error('Advanced search failed', {
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
 * Get contact enrichment status
 * GET /api/contacts/enrichment/status/:userId
 */
router.get('/enrichment/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const stats = await Contact.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalContacts: { $sum: 1 },
          enrichedWithFacebook: {
            $sum: { $cond: [{ $ne: ["$facebookId", null] }, 1, 0] }
          },
          enrichedWithLinkedIn: {
            $sum: { $cond: [{ $ne: ["$linkedinId", null] }, 1, 0] }
          },
          averageMatchConfidence: { $avg: "$matchConfidence" },
          lastEnrichment: { $max: "$lastEnriched" }
        }
      }
    ]);

    const enrichmentStats = stats.length > 0 ? stats[0] : {
      totalContacts: 0,
      enrichedWithFacebook: 0,
      enrichedWithLinkedIn: 0,
      averageMatchConfidence: 0,
      lastEnrichment: null
    };

    res.json({
      success: true,
      data: enrichmentStats
    });

  } catch (error) {
    logger.error('Failed to get enrichment status', {
      userId: req.params.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get enrichment status',
      error: error.message
    });
  }
});

module.exports = router;