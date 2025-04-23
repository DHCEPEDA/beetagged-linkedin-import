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
      const response = await axios.get('https://graph.facebook.com/v17.0/me', {
        params: {
          fields: 'id,name,email,picture',
          access_token: accessToken
        }
      });
      
      const profile = response.data;
      
      return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        picture: profile.picture?.data?.url
      };
    } catch (error) {
      console.error('Facebook getProfileWithToken error:', error);
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
      // In a real app, we would call the Facebook Graph API to get real friends
      // https://graph.facebook.com/v17.0/me/friends
      // Note: Facebook's API now only returns friends who also use your app
      
      // For this demo, we'll return mock data
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulate friends data
      return [
        {
          id: 'facebook_1',
          name: 'John Williams',
          email: null, // Facebook doesn't provide friend emails via API
          profileUrl: 'https://www.facebook.com/johnwilliams',
          picture: null
        },
        {
          id: 'facebook_2',
          name: 'Sarah Thompson',
          email: null,
          profileUrl: 'https://www.facebook.com/sarahthompson',
          picture: null
        },
        {
          id: 'facebook_3',
          name: 'Robert Garcia',
          email: null,
          profileUrl: 'https://www.facebook.com/robertgarcia',
          picture: null
        },
        {
          id: 'facebook_4',
          name: 'Jennifer Lee',
          email: null,
          profileUrl: 'https://www.facebook.com/jenniferlee',
          picture: null
        },
        {
          id: 'facebook_5',
          name: 'Christopher Wilson',
          email: null,
          profileUrl: 'https://www.facebook.com/christopherwilson',
          picture: null
        }
      ];
    } catch (error) {
      console.error('Facebook getFriends error:', error);
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
        throw new Error('Facebook app ID or app secret not provided');
      }
      
      const response = await axios.get('https://graph.facebook.com/debug_token', {
        params: {
          input_token: accessToken,
          access_token: `${appId}|${appSecret}`
        }
      });
      
      return response.data.data.is_valid === true;
    } catch (error) {
      console.error('Facebook verifyAccessToken error:', error);
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
        throw new Error('Facebook app ID or app secret not provided');
      }
      
      const response = await axios.get('https://graph.facebook.com/v17.0/oauth/access_token', {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: appId,
          client_secret: appSecret,
          fb_exchange_token: accessToken
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Facebook getExtendedAccessToken error:', error);
      throw error;
    }
  }
}

module.exports = new FacebookService();
