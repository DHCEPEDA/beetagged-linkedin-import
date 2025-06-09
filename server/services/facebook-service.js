/**
 * Facebook API Service - Social Network Data Integration Engine
 * 
 * HIGH-LEVEL FUNCTION: Connects to Facebook's social graph to extract
 * personal and professional data that enriches contact profiles
 * 
 * OAUTH INTEGRATION STRATEGY:
 * - Uses Facebook OAuth 2.0 with Graph API permissions
 * - Handles app access tokens and user access tokens
 * - Manages permission scopes for friends, work, education data
 * 
 * DATA EXTRACTION CAPABILITIES:
 * 1. PROFILE DATA: Name, email, location, hometown, relationship status
 * 2. WORK HISTORY: Current employer, job titles, work locations, start dates
 * 3. EDUCATION: Schools attended, graduation years, degree information
 * 4. INTERESTS: Pages liked, groups joined, hobbies and activities
 * 5. SOCIAL NETWORK: Friends list (mutual friends who use the app)
 * 
 * GRAPH API ENDPOINTS UTILIZED:
 * - /me : Basic profile information
 * - /me/friends : Friend connections (limited to app users)
 * - /me/work : Employment history and current job
 * - /me/education : Educational background
 * - /me/likes : Interests and page likes
 * 
 * PRIVACY CONSIDERATIONS:
 * - Respects user privacy settings
 * - Only accesses data with explicit user permission
 * - Follows Facebook's data use policies
 * 
 * SEARCH ENABLEMENT:
 * Powers social queries like:
 * - "Who works at Meta?" (work.employer.name)
 * - "Who's from Houston?" (hometown.name)
 * - "Who likes photography?" (likes.data.name)
 * 
 * Handles Facebook OAuth authentication and Graph API data retrieval
 */

const axios = require('axios');
const logger = require('../../utils/logger');

class FacebookService {
  constructor() {
    this.appId = process.env.FACEBOOK_APP_ID;
    this.appSecret = process.env.FACEBOOK_APP_SECRET;
    this.baseURL = 'https://graph.facebook.com/v18.0';
    
    if (!this.appId || !this.appSecret) {
      logger.warn('Facebook credentials not configured');
    }
  }

  /**
   * Generate Facebook OAuth authorization URL
   * @param {string} redirectUri - Redirect URI after authorization
   * @param {string} state - CSRF protection state parameter
   * @returns {string} Authorization URL
   */
  getAuthorizationUrl(redirectUri, state) {
    const scopes = [
      'email',
      'public_profile',
      'user_friends',
      'user_hometown',
      'user_location',
      'user_work_history',
      'user_education_history',
      'user_likes'
    ].join(',');

    return `https://www.facebook.com/v18.0/dialog/oauth?` +
           `client_id=${this.appId}&` +
           `redirect_uri=${encodeURIComponent(redirectUri)}&` +
           `state=${state}&` +
           `scope=${scopes}&` +
           `response_type=code`;
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code from Facebook
   * @param {string} redirectUri - Same redirect URI used in authorization
   * @returns {Object} Token response
   */
  async exchangeCodeForToken(code, redirectUri) {
    try {
      const tokenResponse = await axios.get(`${this.baseURL}/oauth/access_token`, {
        params: {
          client_id: this.appId,
          client_secret: this.appSecret,
          redirect_uri: redirectUri,
          code: code
        }
      });

      logger.info('Facebook token exchange successful');
      return tokenResponse.data;
    } catch (error) {
      logger.error('Facebook token exchange failed', {
        error: error.response?.data || error.message
      });
      throw new Error('Failed to exchange Facebook authorization code');
    }
  }

  /**
   * Get comprehensive Facebook profile information
   * @param {string} accessToken - Facebook access token
   * @returns {Object} Complete profile data
   */
  async getProfile(accessToken) {
    try {
      const profileResponse = await axios.get(`${this.baseURL}/me`, {
        params: {
          access_token: accessToken,
          fields: [
            // Basic Profile Data
            'id', 'name', 'email', 'first_name', 'last_name',
            'picture.width(200).height(200)', // Standard profile photo size
            'cover', 'about', 'birthday', 'age_range',
            'gender', 'relationship_status', 'website', 'link',
            
            // Location Data
            'location', 'hometown',
            
            // Social & Interest Data
            'interested_in', 'meeting_for', 'religion', 'political'
          ].join(',')
        }
      });

      logger.info('Facebook comprehensive profile retrieved successfully');
      return profileResponse.data;
    } catch (error) {
      logger.error('Failed to get Facebook profile', {
        error: error.response?.data || error.message
      });
      throw new Error('Failed to retrieve Facebook profile');
    }
  }

  /**
   * Get Facebook work history
   * @param {string} accessToken - Facebook access token
   * @returns {Object} Work data
   */
  async getWork(accessToken) {
    try {
      const workResponse = await axios.get(`${this.baseURL}/me/work`, {
        params: {
          access_token: accessToken,
          fields: 'id,employer,position,start_date,end_date,description,location'
        }
      });

      logger.info('Facebook work history retrieved successfully');
      return workResponse.data;
    } catch (error) {
      logger.error('Failed to get Facebook work history', {
        error: error.response?.data || error.message
      });
      return { data: [] };
    }
  }

  /**
   * Get Facebook education information
   * @param {string} accessToken - Facebook access token
   * @returns {Object} Education data
   */
  async getEducation(accessToken) {
    try {
      const educationResponse = await axios.get(`${this.baseURL}/me/education`, {
        params: {
          access_token: accessToken,
          fields: 'id,school,degree,year,type,concentration'
        }
      });

      logger.info('Facebook education retrieved successfully');
      return educationResponse.data;
    } catch (error) {
      logger.error('Failed to get Facebook education', {
        error: error.response?.data || error.message
      });
      return { data: [] };
    }
  }

  /**
   * Get Facebook friends and mutual friends (limited to app users)
   * @param {string} accessToken - Facebook access token
   * @returns {Object} Friends and mutual friends data
   */
  async getFriends(accessToken) {
    try {
      const [friendsResponse, mutualFriendsResponse] = await Promise.all([
        // Get friends list (limited to mutual friends who use the app)
        axios.get(`${this.baseURL}/me/friends`, {
          params: {
            access_token: accessToken,
            fields: 'id,name,picture.width(50).height(50)'
          }
        }),
        // Get mutual friends count (available for most profiles)
        axios.get(`${this.baseURL}/me`, {
          params: {
            access_token: accessToken,
            fields: 'mutual_friends'
          }
        }).catch(() => ({ data: { mutual_friends: null } }))
      ]);

      const friendsData = {
        friends: friendsResponse.data,
        mutual_friends: mutualFriendsResponse.data.mutual_friends
      };

      logger.info('Facebook friends and mutual friends retrieved successfully');
      return friendsData;
    } catch (error) {
      logger.error('Failed to get Facebook friends', {
        error: error.response?.data || error.message
      });
      return { friends: { data: [] }, mutual_friends: null };
    }
  }

  /**
   * Get Facebook likes/interests
   * @param {string} accessToken - Facebook access token
   * @returns {Object} Likes data
   */
  async getLikes(accessToken) {
    try {
      const likesResponse = await axios.get(`${this.baseURL}/me/likes`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,category,created_time',
          limit: 100
        }
      });

      logger.info('Facebook likes retrieved successfully');
      return likesResponse.data;
    } catch (error) {
      logger.error('Failed to get Facebook likes', {
        error: error.response?.data || error.message
      });
      return { data: [] };
    }
  }



  /**
   * Get Facebook events
   * @param {string} accessToken - Facebook access token
   * @returns {Object} Events data
   */
  async getEvents(accessToken) {
    try {
      const eventsResponse = await axios.get(`${this.baseURL}/me/events`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,description,start_time,end_time,place,rsvp_status',
          limit: 50
        }
      });

      logger.info('Facebook events retrieved successfully');
      return eventsResponse.data;
    } catch (error) {
      logger.error('Failed to get Facebook events', {
        error: error.response?.data || error.message
      });
      return { data: [] };
    }
  }

  /**
   * Get Facebook groups
   * @param {string} accessToken - Facebook access token
   * @returns {Object} Groups data
   */
  async getGroups(accessToken) {
    try {
      const groupsResponse = await axios.get(`${this.baseURL}/me/groups`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,description,privacy,member_count',
          limit: 50
        }
      });

      logger.info('Facebook groups retrieved successfully');
      return groupsResponse.data;
    } catch (error) {
      logger.error('Failed to get Facebook groups', {
        error: error.response?.data || error.message
      });
      return { data: [] };
    }
  }

  /**
   * Get comprehensive Facebook profile data
   * @param {string} accessToken - Facebook access token
   * @returns {Object} Complete profile data
   */
  async getCompleteProfile(accessToken) {
    try {
      // Get all profile sections in parallel (excluding posts/feeds)
      const [profile, work, education, friends, likes, events, groups] = await Promise.all([
        this.getProfile(accessToken),
        this.getWork(accessToken),
        this.getEducation(accessToken),
        this.getFriends(accessToken),
        this.getLikes(accessToken),
        this.getEvents(accessToken),
        this.getGroups(accessToken)
      ]);

      const completeProfile = {
        ...profile,
        work: work,
        education: education,
        friends: friends,
        likes: likes,
        events: events,
        groups: groups,
        retrievedAt: new Date().toISOString()
      };

      logger.info('Complete Facebook profile assembled', {
        profileId: profile.id,
        sectionsRetrieved: {
          hasWork: work.data?.length > 0,
          hasEducation: education.data?.length > 0,
          hasFriends: friends.friends?.data?.length > 0,
          hasLikes: likes.data?.length > 0,
          hasEvents: events.data?.length > 0,
          hasGroups: groups.data?.length > 0
        }
      });

      return completeProfile;
    } catch (error) {
      logger.error('Failed to assemble complete Facebook profile', {
        error: error.message
      });
      throw new Error('Failed to retrieve complete Facebook profile');
    }
  }

  /**
   * Search Facebook users by email
   * @param {string} accessToken - Facebook access token
   * @param {string} email - Email to search for
   * @returns {Object} Search results
   */
  async searchByEmail(accessToken, email) {
    try {
      // Note: This functionality may be limited by Facebook's privacy policies
      const searchResponse = await axios.get(`${this.baseURL}/search`, {
        params: {
          access_token: accessToken,
          q: email,
          type: 'user',
          fields: 'id,name,email'
        }
      });

      return searchResponse.data;
    } catch (error) {
      logger.error('Facebook email search failed', {
        error: error.response?.data || error.message
      });
      return { data: [] };
    }
  }

  /**
   * Validate Facebook access token
   * @param {string} accessToken - Facebook access token
   * @returns {boolean} Token validity
   */
  async validateToken(accessToken) {
    try {
      await axios.get(`${this.baseURL}/me`, {
        params: {
          access_token: accessToken,
          fields: 'id'
        }
      });
      return true;
    } catch (error) {
      logger.warn('Facebook token validation failed', {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Get app access token for server-side operations
   * @returns {string} App access token
   */
  getAppAccessToken() {
    return `${this.appId}|${this.appSecret}`;
  }
}

module.exports = new FacebookService();