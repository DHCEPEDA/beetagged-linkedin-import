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

module.exports = router;