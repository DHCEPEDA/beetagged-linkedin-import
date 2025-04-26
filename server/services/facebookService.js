const axios = require('axios');

/**
 * Facebook API Service
 */
class FacebookService {
  /**
   * Get profile data with access token
   * @param {string} accessToken - Facebook access token
   * @returns {Promise<Object>} User profile data
   */
  async getProfileWithToken(accessToken) {
    try {
      // Verify the token first
      const isValid = await this.verifyAccessToken(accessToken);
      if (!isValid) {
        throw new Error('Invalid Facebook access token');
      }
      
      // Get user data
      const response = await axios.get('https://graph.facebook.com/v18.0/me', {
        params: {
          fields: 'id,name,email,picture.type(large)',
          access_token: accessToken
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting Facebook profile:', error);
      throw error;
    }
  }

  /**
   * Get Facebook friends list
   * @param {string} accessToken - Facebook access token
   * @returns {Promise<Array>} List of friends
   */
  async getFriends(accessToken) {
    try {
      const response = await axios.get('https://graph.facebook.com/v18.0/me/friends', {
        params: {
          access_token: accessToken
        }
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Error getting Facebook friends:', error);
      throw error;
    }
  }

  /**
   * Verify a Facebook access token
   * @param {string} accessToken - Facebook access token to verify
   * @returns {Promise<boolean>} Token validity
   */
  async verifyAccessToken(accessToken) {
    try {
      const appId = process.env.FACEBOOK_APP_ID;
      const appSecret = process.env.FACEBOOK_APP_SECRET;
      
      if (!appId || !appSecret) {
        console.error('Facebook App ID or App Secret not set in environment variables');
        return false;
      }
      
      const response = await axios.get('https://graph.facebook.com/debug_token', {
        params: {
          input_token: accessToken,
          access_token: `${appId}|${appSecret}`
        }
      });
      
      return response.data.data && 
             response.data.data.app_id === appId && 
             response.data.data.is_valid === true;
    } catch (error) {
      console.error('Error verifying Facebook token:', error);
      return false;
    }
  }

  /**
   * Get extended Facebook access token
   * @param {string} accessToken - Short-lived access token
   * @returns {Promise<Object>} Extended token data
   */
  async getExtendedAccessToken(accessToken) {
    try {
      const appId = process.env.FACEBOOK_APP_ID;
      const appSecret = process.env.FACEBOOK_APP_SECRET;
      
      if (!appId || !appSecret) {
        throw new Error('Facebook App ID or App Secret not set in environment variables');
      }
      
      const response = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: appId,
          client_secret: appSecret,
          fb_exchange_token: accessToken
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error extending Facebook token:', error);
      throw error;
    }
  }
}

module.exports = new FacebookService();