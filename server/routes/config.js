/**
 * BeeTagged Configuration Routes
 * Provides endpoints for client to access public configuration
 */
const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');

// Load environment variables if not already loaded
dotenv.config();

// @route   GET /api/config/fb-app-id
// @desc    Get Facebook App ID (public)
// @access  Public
router.get('/fb-app-id', (req, res) => {
  // Return the Facebook App ID (this is safe to expose)
  const appId = process.env.FACEBOOK_APP_ID || '1222790436230433';
  res.json({ appId });
});

// @route   GET /api/config/app-info
// @desc    Get app configuration info (public)
// @access  Public
router.get('/app-info', (req, res) => {
  // Return basic app configuration (safe to expose)
  const config = {
    appName: 'BeeTagged',
    version: '1.0.0',
    apiVersion: 'v1',
    fbAppId: process.env.FACEBOOK_APP_ID || '1222790436230433',
    linkedInClientId: process.env.LINKEDIN_CLIENT_ID || '867adep5adc22g',
    baseUrl: req.protocol + '://' + req.get('host')
  };
  
  res.json(config);
});

// @route   GET /api/config/verify
// @desc    Verify API configurations
// @access  Public
router.get('/verify', (req, res) => {
  const config = {
    facebook: {
      appId: process.env.FACEBOOK_APP_ID || '1222790436230433',
      configured: !!process.env.FACEBOOK_APP_ID,
      secret: process.env.FACEBOOK_APP_SECRET ? 'configured' : 'missing'
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID || '867adep5adc22g',
      configured: !!process.env.LINKEDIN_CLIENT_ID,
      secret: process.env.LINKEDIN_CLIENT_SECRET ? 'configured' : 'missing'
    },
    domain: process.env.REPLIT_DOMAINS || 'd49cd8c1-1139-4a7e-96a2-5d125f417ecd-00-3ftoc46fv9y6p.riker.replit.dev',
    mongodb: {
      connected: global.mongoConnected || false,
      uri: process.env.MONGODB_URI ? 'configured' : 'missing'
    }
  };
  
  res.json(config);
});

module.exports = router;