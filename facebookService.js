const axios = require('axios');

/**
 * Facebook Graph API Service
 * Handles Facebook contact imports and profile data
 */

/**
 * Exchange Facebook code for access token
 */
async function exchangeCodeForToken(code, redirectUri) {
  try {
    const response = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: redirectUri,
        code: code
      }
    });
    
    return response.data.access_token;
  } catch (error) {
    console.error('Facebook token exchange error:', error);
    throw new Error('Failed to exchange Facebook code for token');
  }
}

/**
 * Get Facebook user profile
 */
async function getFacebookProfile(accessToken) {
  try {
    const response = await axios.get('https://graph.facebook.com/v18.0/me', {
      params: {
        access_token: accessToken,
        fields: 'id,name,email,picture,location'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Facebook profile fetch error:', error);
    throw new Error('Failed to fetch Facebook profile');
  }
}

/**
 * Fetch Facebook friends (limited by Facebook's privacy policies)
 */
async function fetchFacebookContacts(accessToken) {
  try {
    // Note: Facebook heavily restricts friend data access
    // This will only return friends who have also authorized your app
    const response = await axios.get('https://graph.facebook.com/v18.0/me/friends', {
      params: {
        access_token: accessToken,
        fields: 'id,name,email,picture'
      }
    });
    
    const friends = response.data.data || [];
    
    // Transform to contact format
    const contacts = friends.map(friend => ({
      name: friend.name,
      email: friend.email || '',
      profileImage: friend.picture?.data?.url || null,
      profileUrl: `https://facebook.com/${friend.id}`,
      source: 'facebook',
      facebookId: friend.id
    }));
    
    return contacts;
  } catch (error) {
    console.error('Facebook contacts fetch error:', error);
    throw new Error('Failed to fetch Facebook contacts');
  }
}

/**
 * Validate Facebook access token
 */
async function validateFacebookToken(accessToken) {
  try {
    const response = await axios.get('https://graph.facebook.com/v18.0/me', {
      params: {
        access_token: accessToken,
        fields: 'id'
      }
    });
    
    return !!response.data.id;
  } catch (error) {
    console.error('Facebook token validation error:', error);
    return false;
  }
}

/**
 * Get Facebook app permissions
 */
async function getFacebookPermissions(accessToken) {
  try {
    const response = await axios.get('https://graph.facebook.com/v18.0/me/permissions', {
      params: {
        access_token: accessToken
      }
    });
    
    return response.data.data || [];
  } catch (error) {
    console.error('Facebook permissions fetch error:', error);
    return [];
  }
}

/**
 * Generate Facebook OAuth URL
 */
function generateFacebookOAuthUrl(redirectUri, state = null) {
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID,
    redirect_uri: redirectUri,
    scope: 'email,user_friends',
    response_type: 'code',
    ...(state && { state })
  });
  
  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
}

module.exports = {
  exchangeCodeForToken,
  getFacebookProfile,
  fetchFacebookContacts,
  validateFacebookToken,
  getFacebookPermissions,
  generateFacebookOAuthUrl
};