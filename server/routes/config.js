/**
 * BeeTagged Configuration Routes
 * Provides endpoints for client to access public configuration
 */

const express = require('express');
const router = express.Router();
const config = require('../config/config');

// Public config endpoint - only exposes values safe for client-side
router.get('/', (req, res) => {
  const publicConfig = {
    socialNetworks: {
      facebook: {
        enabled: !!config.socialNetworks.facebook.appId,
        appId: config.socialNetworks.facebook.appId
      },
      linkedin: {
        enabled: !!config.socialNetworks.linkedin.clientId
      }
    },
    features: {
      tagging: true,
      affinityGroups: true,
      contactSearch: true
    },
    environment: process.env.NODE_ENV || 'development'
  };
  
  res.json(publicConfig);
});

module.exports = router;