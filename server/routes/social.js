const express = require('express');
const router = express.Router();
const socialController = require('../controllers/socialController');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// @route   GET /api/social/linkedin/connections
// @desc    Get LinkedIn connections
// @access  Private
router.get('/linkedin/connections', socialController.getLinkedInConnections);

// @route   GET /api/social/facebook/friends
// @desc    Get Facebook friends
// @access  Private
router.get('/facebook/friends', socialController.getFacebookFriends);

// @route   GET /api/social/sync/status
// @desc    Get social account sync status
// @access  Private
router.get('/sync/status', socialController.getSyncStatus);

// @route   POST /api/social/sync/start
// @desc    Start social account sync
// @access  Private
router.post('/sync/start', socialController.startSync);

// @route   POST /api/social/sync/stop
// @desc    Stop social account sync
// @access  Private
router.post('/sync/stop', socialController.stopSync);

module.exports = router;
