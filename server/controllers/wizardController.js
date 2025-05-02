const User = require('../models/User');
const LinkedinService = require('../services/linkedinService');
const FacebookService = require('../services/facebookService');
const { sessions } = require('../routes/auth');
const axios = require('axios');

/**
 * Get user's social connection status
 * @route GET /api/wizard/status
 * @access Private
 */
exports.getConnectionStatus = async (req, res, next) => {
  try {
    // Get user's connection status from the database or sessions
    const user = req.user;
    
    const status = {
      facebook: {
        connected: !!user.facebookToken || !!sessions[req.authToken]?.facebook?.access_token,
        lastSynced: user.facebookLastSynced || null
      },
      linkedin: {
        connected: !!user.linkedinToken || !!sessions[req.authToken]?.linkedin?.access_token,
        lastSynced: user.linkedinLastSynced || null
      }
    };
    
    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Start connection wizard
 * @route POST /api/wizard/start
 * @access Private
 */
exports.startWizard = async (req, res, next) => {
  try {
    // Make sure the session exists
    if (!sessions[req.authToken]) {
      sessions[req.authToken] = {
        created: new Date(),
        user: req.user
      };
    }
    
    // Initialize wizard session
    if (!sessions[req.authToken].wizard) {
      sessions[req.authToken].wizard = {
        started: new Date(),
        platforms: req.body.platforms || ['facebook', 'linkedin'],
        currentStep: 'init',
        results: {}
      };
    } else {
      // Reset an existing wizard
      sessions[req.authToken].wizard = {
        started: new Date(),
        platforms: req.body.platforms || ['facebook', 'linkedin'],
        currentStep: 'init',
        results: {}
      };
    }
    
    res.status(200).json({
      success: true,
      data: {
        wizardId: req.authToken,
        platforms: sessions[req.authToken].wizard.platforms
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get connection URLs for all platforms
 * @route GET /api/wizard/connect-urls
 * @access Private
 */
exports.getConnectionUrls = async (req, res, next) => {
  try {
    const { platforms } = req.query;
    const platformsArray = platforms ? platforms.split(',') : ['facebook', 'linkedin'];
    
    const urls = {};
    const baseUrl = process.env.BASE_URL || `https://${process.env.REPLIT_DOMAINS}`;
    
    // Generate URLs for each platform
    for (const platform of platformsArray) {
      if (platform === 'facebook') {
        // Create a session token
        const state = req.authToken;
        
        // Use existing FB auth URL logic
        const FB_APP_ID = process.env.FACEBOOK_APP_ID || '1222790436230433';
        const cleanRedirectUri = `${baseUrl}/api/auth/facebook/callback`;
        
        // Build Facebook OAuth URL
        urls.facebook = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(cleanRedirectUri)}&state=${state}&scope=public_profile,email,user_friends`;
      } else if (platform === 'linkedin') {
        // Create a session token
        const state = req.authToken;
        
        // Use existing LinkedIn auth URL logic
        const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || '867adep5adc22g';
        const cleanRedirectUri = `${baseUrl}/api/auth/linkedin/callback`;
        
        // Build LinkedIn OAuth URL
        urls.linkedin = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(cleanRedirectUri)}&state=${state}&scope=r_liteprofile%20r_emailaddress`;
      }
    }
    
    // Store this in the wizard state
    if (sessions[req.authToken]?.wizard) {
      sessions[req.authToken].wizard.currentStep = 'connecting';
      sessions[req.authToken].wizard.urls = urls;
    }
    
    res.status(200).json({
      success: true,
      data: urls
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Import contacts from multiple platforms
 * @route POST /api/wizard/import
 * @access Private
 */
exports.importAllContacts = async (req, res, next) => {
  try {
    const { platforms } = req.body;
    const platformsArray = platforms || ['facebook', 'linkedin'];
    
    // Filter only connected platforms
    const connectedPlatforms = [];
    
    // Check which platforms are connected
    for (const platform of platformsArray) {
      if (platform === 'facebook' && (req.user.facebookToken || sessions[req.authToken]?.facebook?.access_token)) {
        connectedPlatforms.push('facebook');
      } else if (platform === 'linkedin' && (req.user.linkedinToken || sessions[req.authToken]?.linkedin?.access_token)) {
        connectedPlatforms.push('linkedin');
      }
    }
    
    if (connectedPlatforms.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No connected platforms to import from'
      });
    }
    
    // Store import intentions in wizard session
    if (sessions[req.authToken]?.wizard) {
      sessions[req.authToken].wizard.currentStep = 'importing';
      sessions[req.authToken].wizard.importPlatforms = connectedPlatforms;
    }
    
    // This endpoint just initiates the import process
    // The actual imports will be handled by separate API calls to not block this response
    res.status(200).json({
      success: true,
      data: {
        platforms: connectedPlatforms,
        message: 'Import process started'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get wizard status
 * @route GET /api/wizard/status/:wizardId
 * @access Private
 */
exports.getWizardStatus = async (req, res, next) => {
  try {
    const wizardId = req.params.wizardId || req.authToken;
    
    if (!sessions[wizardId] || !sessions[wizardId].wizard) {
      return res.status(404).json({
        success: false,
        message: 'Wizard session not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: sessions[wizardId].wizard
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Complete wizard
 * @route POST /api/wizard/complete
 * @access Private
 */
exports.completeWizard = async (req, res, next) => {
  try {
    if (!sessions[req.authToken] || !sessions[req.authToken].wizard) {
      return res.status(404).json({
        success: false,
        message: 'Wizard session not found'
      });
    }
    
    // Mark wizard as completed
    sessions[req.authToken].wizard.currentStep = 'completed';
    sessions[req.authToken].wizard.completedAt = new Date();
    
    // Return wizard summary
    res.status(200).json({
      success: true,
      data: {
        status: 'completed',
        summary: sessions[req.authToken].wizard
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update wizard results
 * @route POST /api/wizard/update-results
 * @access Private
 */
exports.updateWizardResults = async (req, res, next) => {
  try {
    const { platform, results } = req.body;
    
    if (!platform || !results) {
      return res.status(400).json({
        success: false,
        message: 'Platform and results are required'
      });
    }
    
    if (!sessions[req.authToken] || !sessions[req.authToken].wizard) {
      return res.status(404).json({
        success: false,
        message: 'Wizard session not found'
      });
    }
    
    // Make sure results object exists
    if (!sessions[req.authToken].wizard.results) {
      sessions[req.authToken].wizard.results = {};
    }
    
    // Update wizard results
    sessions[req.authToken].wizard.results[platform] = results;
    
    res.status(200).json({
      success: true,
      data: {
        platform,
        results
      }
    });
  } catch (error) {
    next(error);
  }
};