const User = require('../models/User');
const Contact = require('../models/Contact');
const LinkedinService = require('../services/linkedinService');
const FacebookService = require('../services/facebookService');

/**
 * Get LinkedIn connections
 * @route GET /api/social/linkedin/connections
 * @access Private
 */
exports.getLinkedInConnections = async (req, res, next) => {
  try {
    // Check if user has LinkedIn connected
    if (!req.user.linkedinConnected || !req.user.linkedinToken) {
      return res.status(400).json({
        success: false,
        message: 'LinkedIn account not connected'
      });
    }
    
    const connections = await LinkedinService.getConnections(req.user.linkedinToken);
    
    res.status(200).json({
      success: true,
      count: connections.length,
      data: connections
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Facebook friends
 * @route GET /api/social/facebook/friends
 * @access Private
 */
exports.getFacebookFriends = async (req, res, next) => {
  try {
    // Check if user has Facebook connected
    if (!req.user.facebookConnected || !req.user.facebookToken) {
      return res.status(400).json({
        success: false,
        message: 'Facebook account not connected'
      });
    }
    
    const friends = await FacebookService.getFriends(req.user.facebookToken);
    
    res.status(200).json({
      success: true,
      count: friends.length,
      data: friends
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get social account sync status
 * @route GET /api/social/sync/status
 * @access Private
 */
exports.getSyncStatus = async (req, res, next) => {
  try {
    const user = req.user;
    
    // Count contacts by source
    const phoneContactsCount = await Contact.countDocuments({
      user: user._id,
      source: 'phone'
    });
    
    const linkedinContactsCount = await Contact.countDocuments({
      user: user._id,
      linkedinConnected: true
    });
    
    const facebookContactsCount = await Contact.countDocuments({
      user: user._id,
      facebookConnected: true
    });
    
    // Get last sync time
    const lastLinkedInSync = await Contact.findOne({
      user: user._id,
      linkedinConnected: true
    }).sort({ lastSynced: -1 }).select('lastSynced');
    
    const lastFacebookSync = await Contact.findOne({
      user: user._id,
      facebookConnected: true
    }).sort({ lastSynced: -1 }).select('lastSynced');
    
    const lastPhoneSync = await Contact.findOne({
      user: user._id,
      source: 'phone'
    }).sort({ lastSynced: -1 }).select('lastSynced');
    
    res.status(200).json({
      success: true,
      data: {
        accounts: {
          linkedin: {
            connected: user.linkedinConnected,
            contactCount: linkedinContactsCount,
            lastSynced: lastLinkedInSync ? lastLinkedInSync.lastSynced : null
          },
          facebook: {
            connected: user.facebookConnected,
            contactCount: facebookContactsCount,
            lastSynced: lastFacebookSync ? lastFacebookSync.lastSynced : null
          },
          phone: {
            connected: true, // Phone is always considered connected
            contactCount: phoneContactsCount,
            lastSynced: lastPhoneSync ? lastPhoneSync.lastSynced : null
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Start social account sync
 * @route POST /api/social/sync/start
 * @access Private
 */
exports.startSync = async (req, res, next) => {
  try {
    const { providers } = req.body;
    
    if (!providers || !Array.isArray(providers) || providers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of providers to sync'
      });
    }
    
    const validProviders = ['linkedin', 'facebook', 'phone'];
    const invalidProviders = providers.filter(p => !validProviders.includes(p));
    
    if (invalidProviders.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid providers: ${invalidProviders.join(', ')}`
      });
    }
    
    // In a real app, we would start background sync jobs here
    // For this demo, we'll just return a success message
    
    res.status(200).json({
      success: true,
      message: 'Sync started successfully',
      data: {
        syncId: 'sync_' + Date.now(),
        providers,
        status: 'started'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Stop social account sync
 * @route POST /api/social/sync/stop
 * @access Private
 */
exports.stopSync = async (req, res, next) => {
  try {
    const { syncId } = req.body;
    
    if (!syncId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a syncId'
      });
    }
    
    // In a real app, we would stop the sync job here
    // For this demo, we'll just return a success message
    
    res.status(200).json({
      success: true,
      message: 'Sync stopped successfully',
      data: {
        syncId,
        status: 'stopped'
      }
    });
  } catch (error) {
    next(error);
  }
};
