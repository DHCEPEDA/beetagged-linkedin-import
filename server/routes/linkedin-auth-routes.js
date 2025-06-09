/**
 * LinkedIn Authentication Routes
 * Handles LinkedIn OAuth flow and profile data retrieval
 */

const express = require('express');
const router = express.Router();
const linkedinService = require('../services/linkedin-service');
const Contact = require('../models/Contact');
const logger = require('../../utils/logger');
const crypto = require('crypto');

// Store temporary auth states (in production, use Redis or database)
const authStates = new Map();

/**
 * Initiate LinkedIn OAuth flow
 * GET /api/linkedin/auth
 */
router.get('/auth', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID required for LinkedIn authentication'
      });
    }

    // Generate CSRF protection state
    const state = crypto.randomBytes(32).toString('hex');
    const redirectUri = `${req.protocol}://${req.get('host')}/api/linkedin/callback`;
    
    // Store state temporarily
    authStates.set(state, {
      userId: userId,
      timestamp: Date.now()
    });

    // Generate authorization URL
    const authUrl = linkedinService.getAuthorizationUrl(redirectUri, state);
    
    logger.info('LinkedIn auth initiated', { userId, state });
    
    res.json({
      success: true,
      authUrl: authUrl,
      message: 'Redirect user to LinkedIn for authorization'
    });

  } catch (error) {
    logger.error('LinkedIn auth initiation failed', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to initiate LinkedIn authentication',
      error: error.message
    });
  }
});

/**
 * Handle LinkedIn OAuth callback
 * GET /api/linkedin/callback
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    // Check for authorization errors
    if (error) {
      logger.error('LinkedIn authorization error', { error });
      return res.redirect('/?linkedin_error=' + encodeURIComponent(error));
    }

    if (!code || !state) {
      logger.error('Missing authorization code or state');
      return res.redirect('/?linkedin_error=missing_parameters');
    }

    // Validate state parameter
    const authData = authStates.get(state);
    if (!authData) {
      logger.error('Invalid or expired state parameter', { state });
      return res.redirect('/?linkedin_error=invalid_state');
    }

    // Clean up state
    authStates.delete(state);

    // Check state expiration (5 minutes)
    if (Date.now() - authData.timestamp > 5 * 60 * 1000) {
      logger.error('State parameter expired', { state });
      return res.redirect('/?linkedin_error=expired_state');
    }

    const redirectUri = `${req.protocol}://${req.get('host')}/api/linkedin/callback`;
    
    // Exchange code for access token
    const tokenData = await linkedinService.exchangeCodeForToken(code, redirectUri);
    
    // Get complete LinkedIn profile
    const linkedinProfile = await linkedinService.getCompleteProfile(tokenData.access_token);
    
    logger.info('LinkedIn profile retrieved successfully', {
      userId: authData.userId,
      profileId: linkedinProfile.id
    });

    // Store LinkedIn data for the user (you might want to store this in database)
    // For now, redirect with success
    res.redirect(`/?linkedin_success=true&profile_id=${linkedinProfile.id}`);

  } catch (error) {
    logger.error('LinkedIn callback failed', {
      error: error.message
    });

    res.redirect('/?linkedin_error=' + encodeURIComponent(error.message));
  }
});

/**
 * Get LinkedIn profile data for a user
 * POST /api/linkedin/profile
 */
router.post('/profile', async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'LinkedIn access token required'
      });
    }

    // Validate token first
    const isValid = await linkedinService.validateToken(accessToken);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired LinkedIn access token'
      });
    }

    // Get complete profile data
    const profileData = await linkedinService.getCompleteProfile(accessToken);

    res.json({
      success: true,
      message: 'LinkedIn profile retrieved successfully',
      data: profileData
    });

  } catch (error) {
    logger.error('LinkedIn profile retrieval failed', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve LinkedIn profile',
      error: error.message
    });
  }
});

/**
 * Enrich contact with LinkedIn data
 * POST /api/linkedin/enrich-contact
 */
router.post('/enrich-contact', async (req, res) => {
  try {
    const { contactId, linkedinAccessToken, linkedinProfileId } = req.body;

    if (!contactId) {
      return res.status(400).json({
        success: false,
        message: 'Contact ID required'
      });
    }

    if (!linkedinAccessToken) {
      return res.status(400).json({
        success: false,
        message: 'LinkedIn access token required'
      });
    }

    // Get contact from database
    const contact = await Contact.findById(contactId);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Get LinkedIn profile data
    const linkedinData = await linkedinService.getCompleteProfile(linkedinAccessToken);

    // Update contact with LinkedIn data
    contact.linkedinData = linkedinData;
    contact.lastEnriched = new Date();
    
    // Extract priority data fields
    const priorityDataExtractionService = require('../services/priority-data-extraction-service');
    const priorityData = priorityDataExtractionService.extractPriorityFields({
      ...contact.toObject(),
      linkedinData: linkedinData
    });
    
    // Generate searchable tags
    const priorityTags = priorityDataExtractionService.generateSearchableTags(priorityData);
    
    // Update contact with priority data
    contact.priorityData = priorityData;
    contact.priorityTags = priorityTags;
    contact.allTags = [...(contact.tags || []), ...priorityTags];

    await contact.save();

    logger.info('Contact enriched with LinkedIn data', {
      contactId: contactId,
      linkedinProfileId: linkedinData.id
    });

    res.json({
      success: true,
      message: 'Contact enriched with LinkedIn data successfully',
      data: {
        contactId: contactId,
        linkedinProfileId: linkedinData.id,
        extractedFields: priorityData,
        generatedTags: priorityTags
      }
    });

  } catch (error) {
    logger.error('LinkedIn contact enrichment failed', {
      contactId: req.body.contactId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to enrich contact with LinkedIn data',
      error: error.message
    });
  }
});

/**
 * Test LinkedIn API connection
 * POST /api/linkedin/test
 */
router.post('/test', async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'LinkedIn access token required for testing'
      });
    }

    // Test basic profile access
    const profile = await linkedinService.getProfile(accessToken);
    
    // Test additional endpoints
    const [positions, educations, skills] = await Promise.all([
      linkedinService.getPositions(accessToken),
      linkedinService.getEducations(accessToken),
      linkedinService.getSkills(accessToken)
    ]);

    const testResults = {
      profileAccess: !!profile.id,
      positionsAccess: positions.values?.length >= 0,
      educationAccess: educations.values?.length >= 0,
      skillsAccess: skills.values?.length >= 0,
      dataQuality: {
        profileFields: Object.keys(profile).length,
        positionsCount: positions.values?.length || 0,
        educationCount: educations.values?.length || 0,
        skillsCount: skills.values?.length || 0
      }
    };

    res.json({
      success: true,
      message: 'LinkedIn API test completed successfully',
      data: testResults,
      sampleData: {
        profile: {
          id: profile.id,
          name: `${profile.firstName} ${profile.lastName}`,
          headline: profile.headline,
          location: profile.location?.name
        },
        hasPositions: positions.values?.length > 0,
        hasEducation: educations.values?.length > 0,
        hasSkills: skills.values?.length > 0
      }
    });

  } catch (error) {
    logger.error('LinkedIn API test failed', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'LinkedIn API test failed',
      error: error.message,
      troubleshooting: {
        checkToken: 'Verify access token is valid and not expired',
        checkScopes: 'Ensure required OAuth scopes are granted',
        checkQuota: 'Check if API rate limits have been exceeded'
      }
    });
  }
});

module.exports = router;