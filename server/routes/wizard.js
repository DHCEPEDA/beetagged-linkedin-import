const express = require('express');
const router = express.Router();
const wizardController = require('../controllers/wizardController');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// @route   GET /api/wizard/status
// @desc    Get user's social connection status
// @access  Private
router.get('/status', wizardController.getConnectionStatus);

// @route   POST /api/wizard/start
// @desc    Start connection wizard
// @access  Private
router.post('/start', wizardController.startWizard);

// @route   GET /api/wizard/connect-urls
// @desc    Get connection URLs for all platforms
// @access  Private
router.get('/connect-urls', wizardController.getConnectionUrls);

// @route   POST /api/wizard/import
// @desc    Import contacts from multiple platforms
// @access  Private
router.post('/import', wizardController.importAllContacts);

// @route   GET /api/wizard/status/:wizardId
// @desc    Get wizard status
// @access  Private
router.get('/status/:wizardId', wizardController.getWizardStatus);

// @route   POST /api/wizard/complete
// @desc    Complete wizard
// @access  Private
router.post('/complete', wizardController.completeWizard);

// @route   POST /api/wizard/update-results
// @desc    Update wizard results
// @access  Private
router.post('/update-results', wizardController.updateWizardResults);

module.exports = router;