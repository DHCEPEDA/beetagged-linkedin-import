/**
 * Facebook Data Deletion Callback Route
 * Handles requests from Facebook when users delete their data
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// In-memory store for tracking deletion requests (In production, use a database)
const deletionRequests = {};

/**
 * Verify the signed request from Facebook
 * @param {string} signedRequest - The signed request from Facebook
 * @param {string} appSecret - Your app secret
 * @returns {object|null} - The parsed data or null if verification fails
 */
function parseSignedRequest(signedRequest, appSecret) {
  if (!signedRequest) {
    return null;
  }

  const parts = signedRequest.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const [encodedSig, encodedPayload] = parts;

  // Decode the payload
  const payload = Buffer.from(encodedPayload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
  const data = JSON.parse(payload);

  // Calculate the expected signature
  const expectedSig = crypto
    .createHmac('sha256', appSecret)
    .update(encodedPayload)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  // Verify the signature
  const sig = encodedSig.replace(/-/g, '+').replace(/_/g, '/');
  if (sig !== expectedSig) {
    console.error('Bad signed request signature!');
    return null;
  }

  return data;
}

/**
 * Process a data deletion request
 * @param {string} userId - The app-scoped user ID from Facebook
 * @returns {object} - Object containing the status URL and confirmation code
 */
function processDeletionRequest(userId) {
  // Generate a unique confirmation code
  const confirmationCode = uuidv4();
  
  // Store the deletion request status
  deletionRequests[confirmationCode] = {
    userId,
    requestDate: new Date().toISOString(),
    status: 'processing',
    lastUpdated: new Date().toISOString()
  };
  
  // In a real implementation, this is where you'd:
  // 1. Begin process of deleting user data from your databases
  // 2. Log the deletion request
  // 3. Schedule follow-up deletion tasks if needed
  console.log(`Received data deletion request for user ID: ${userId}`);
  
  // Get the current domain for the status URL
  const domain = process.env.APP_DOMAIN || 'https://d49cd8c1-1139-4a7e-96a2-5d125f417ecd-00-3ftoc46fv9y6p.riker.replit.dev';
  
  // Return status URL and confirmation code
  return {
    url: `${domain}/deletion-status.html?id=${userId}&code=${confirmationCode}`,
    confirmation_code: confirmationCode
  };
}

/**
 * Handle Facebook data deletion callback
 * @route POST /api/deletion-callback
 * @access Public
 */
router.post('/deletion-callback', (req, res) => {
  try {
    const { signed_request } = req.body;
    
    if (!signed_request) {
      return res.status(400).json({ error: 'No signed_request parameter provided' });
    }
    
    // Get Facebook app secret from environment variables
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    
    if (!appSecret) {
      console.error('FACEBOOK_APP_SECRET environment variable is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    // Parse and verify the signed request
    const data = parseSignedRequest(signed_request, appSecret);
    
    if (!data) {
      return res.status(400).json({ error: 'Invalid signed request' });
    }
    
    if (!data.user_id) {
      return res.status(400).json({ error: 'No user_id in signed request' });
    }
    
    // Process the deletion request
    const result = processDeletionRequest(data.user_id);
    
    // Return the confirmation to Facebook
    return res.json(result);
  } catch (error) {
    console.error('Error processing deletion request:', error);
    return res.status(500).json({ error: 'Server error processing deletion request' });
  }
});

/**
 * Get status of a deletion request
 * @route GET /api/deletion-status/:confirmationCode
 * @access Public
 */
router.get('/deletion-status/:confirmationCode', (req, res) => {
  const { confirmationCode } = req.params;
  
  if (!confirmationCode || !deletionRequests[confirmationCode]) {
    return res.status(404).json({ error: 'Deletion request not found' });
  }
  
  return res.json(deletionRequests[confirmationCode]);
});

module.exports = router;