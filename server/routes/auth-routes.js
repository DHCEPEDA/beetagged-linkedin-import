const express = require('express');
const router = express.Router();
const authController = require('../controllers/simple-auth');
const { logger } = require('../../utils/logger');

// ======== FACEBOOK AUTHENTICATION ROUTES ========
router.get('/facebook/url', authController.getFacebookAuthUrl);
router.get('/facebook/callback', authController.handleFacebookCallback);

// ======== LINKEDIN AUTHENTICATION ROUTES ========
router.get('/linkedin/url', authController.getLinkedInAuthUrl);
router.get('/linkedin/callback', authController.handleLinkedInCallback);

// Basic authentication configuration
router.get('/facebook/config', (req, res) => {
  res.json({
    appId: process.env.FACEBOOK_APP_ID,
    redirectUrl: `https://${req.get('host').split(':')[0]}/api/auth/facebook/callback`
  });
});

// Register routes with main app
module.exports = router;