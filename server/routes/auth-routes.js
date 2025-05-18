const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { logger } = require('../../utils/logger');

// ======== FACEBOOK AUTHENTICATION ROUTES ========
router.get('/facebook/url', authController.getFacebookAuthUrl);
router.get('/facebook/callback', authController.handleFacebookCallback);
router.get('/facebook/config', authController.getFacebookConfig);

// ======== LINKEDIN AUTHENTICATION ROUTES ========
router.get('/linkedin/url', authController.getLinkedInAuthUrl);
router.get('/linkedin/callback', authController.handleLinkedInCallback);

// Register routes with main app
module.exports = router;