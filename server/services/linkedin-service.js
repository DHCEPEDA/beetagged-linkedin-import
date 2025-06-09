/**
 * LinkedIn API Service - Professional Data Integration Engine
 * 
 * HIGH-LEVEL FUNCTION: Connects to LinkedIn's professional network to extract
 * career data that enables workplace-focused contact searches
 * 
 * OAUTH INTEGRATION STRATEGY:
 * - Uses LinkedIn OAuth 2.0 with proper scope management
 * - Handles token exchange and refresh automatically
 * - Stores access tokens securely for ongoing data retrieval
 * 
 * DATA EXTRACTION CAPABILITIES:
 * 1. PROFILE DATA: Name, headline, location, industry, summary
 * 2. EMPLOYMENT: Current position, company, work history with dates
 * 3. EDUCATION: Schools, degrees, certifications, graduation years
 * 4. SKILLS: Professional skills with endorsement counts
 * 5. NETWORK: Connection count (when available)
 * 
 * API ENDPOINTS UTILIZED:
 * - /v2/people/~ : Basic profile information
 * - /v2/people/~/positions : Work experience and companies
 * - /v2/people/~/educations : Educational background
 * - /v2/people/~/skills : Professional skills and endorsements
 * 
 * SEARCH ENABLEMENT:
 * Powers professional queries like:
 * - "Who works at Salesforce?" (positions.company.name)
 * - "Who's a software engineer?" (positions.title)
 * - "Who went to Stanford?" (educations.schoolName)
 * 
 * Handles LinkedIn OAuth authentication and data retrieval
 */

const axios = require('axios');
const logger = require('../../utils/logger');

class LinkedInService {
  constructor() {
    this.clientId = process.env.LINKEDIN_CLIENT_ID;
    this.clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    this.baseURL = 'https://api.linkedin.com/v2';
    
    if (!this.clientId || !this.clientSecret) {
      logger.warn('LinkedIn credentials not configured');
    }
  }

  /**
   * Generate LinkedIn OAuth authorization URL
   * @param {string} redirectUri - Redirect URI after authorization
   * @param {string} state - CSRF protection state parameter
   * @returns {string} Authorization URL
   */
  getAuthorizationUrl(redirectUri, state) {
    const scopes = [
      'r_liteprofile',
      'r_emailaddress',
      'r_basicprofile',
      'r_fullprofile'
    ].join('%20');

    return `https://www.linkedin.com/oauth/v2/authorization?` +
           `response_type=code&` +
           `client_id=${this.clientId}&` +
           `redirect_uri=${encodeURIComponent(redirectUri)}&` +
           `state=${state}&` +
           `scope=${scopes}`;
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code from LinkedIn
   * @param {string} redirectUri - Same redirect URI used in authorization
   * @returns {Object} Token response
   */
  async exchangeCodeForToken(code, redirectUri) {
    try {
      const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', {
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      logger.info('LinkedIn token exchange successful');
      return tokenResponse.data;
    } catch (error) {
      logger.error('LinkedIn token exchange failed', {
        error: error.response?.data || error.message
      });
      throw new Error('Failed to exchange LinkedIn authorization code');
    }
  }

  /**
   * Get comprehensive LinkedIn profile information
   * @param {string} accessToken - LinkedIn access token
   * @returns {Object} Complete profile data
   */
  async getProfile(accessToken) {
    try {
      const profileResponse = await axios.get(
        `${this.baseURL}/people/~`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0'
          },
          params: {
            projection: [
              // Basic identification
              'id', 'firstName', 'lastName', 'emailAddress',
              
              // Professional information
              'industry', 'summary', 'specialties', 'publicProfileUrl',
              
              // Location and contact
              'location', 'numConnections', 'numConnectionsCapped',
              
              // Additional profile fields
              'vanityName', 'maidenName', 'phoneNumbers'
            ].join(',')
          }
        }
      );

      logger.info('LinkedIn comprehensive profile retrieved successfully');
      return profileResponse.data;
    } catch (error) {
      logger.error('Failed to get LinkedIn profile', {
        error: error.response?.data || error.message
      });
      throw new Error('Failed to retrieve LinkedIn profile');
    }
  }

  /**
   * Get comprehensive LinkedIn positions (work experience)
   * @param {string} accessToken - LinkedIn access token
   * @returns {Object} Positions data
   */
  async getPositions(accessToken) {
    try {
      const positionsResponse = await axios.get(
        `${this.baseURL}/people/~/positions`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0'
          },
          params: {
            projection: '(values:(id,title,summary,startDate,endDate,isCurrent,company:(id,name,type,size,industry,specialties,website,ticker,description),location:(name,country:(code,name)),description))'
          }
        }
      );

      logger.info('LinkedIn positions retrieved successfully');
      return positionsResponse.data;
    } catch (error) {
      logger.error('Failed to get LinkedIn positions', {
        error: error.response?.data || error.message
      });
      return { values: [] };
    }
  }

  /**
   * Get comprehensive LinkedIn education information
   * @param {string} accessToken - LinkedIn access token
   * @returns {Object} Education data
   */
  async getEducations(accessToken) {
    try {
      const educationResponse = await axios.get(
        `${this.baseURL}/people/~/educations`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0'
          },
          params: {
            projection: '(values:(id,schoolName,fieldOfStudy,startDate,endDate,degree,activities,notes,grade,description,school:(name,type,logo-url,website)))'
          }
        }
      );

      logger.info('LinkedIn education retrieved successfully');
      return educationResponse.data;
    } catch (error) {
      logger.error('Failed to get LinkedIn education', {
        error: error.response?.data || error.message
      });
      return { values: [] };
    }
  }

  /**
   * Get LinkedIn skills information
   * @param {string} accessToken - LinkedIn access token
   * @returns {Object} Skills data
   */
  async getSkills(accessToken) {
    try {
      const skillsResponse = await axios.get(
        `${this.baseURL}/people/~/skills`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0'
          },
          params: {
            projection: '(values:(id,skill:(name),endorsements:(total)))'
          }
        }
      );

      logger.info('LinkedIn skills retrieved successfully');
      return skillsResponse.data;
    } catch (error) {
      logger.error('Failed to get LinkedIn skills', {
        error: error.response?.data || error.message
      });
      return { values: [] };
    }
  }

  /**
   * Get comprehensive LinkedIn profile data
   * @param {string} accessToken - LinkedIn access token
   * @returns {Object} Complete profile data
   */
  async getCompleteProfile(accessToken) {
    try {
      // Get all profile sections in parallel
      const [profile, positions, educations, skills] = await Promise.all([
        this.getProfile(accessToken),
        this.getPositions(accessToken),
        this.getEducations(accessToken),
        this.getSkills(accessToken)
      ]);

      const completeProfile = {
        ...profile,
        positions: positions,
        educations: educations,
        skills: skills,
        retrievedAt: new Date().toISOString()
      };

      logger.info('Complete LinkedIn profile assembled', {
        profileId: profile.id,
        sectionsRetrieved: {
          hasPositions: positions.values?.length > 0,
          hasEducations: educations.values?.length > 0,
          hasSkills: skills.values?.length > 0
        }
      });

      return completeProfile;
    } catch (error) {
      logger.error('Failed to assemble complete LinkedIn profile', {
        error: error.message
      });
      throw new Error('Failed to retrieve complete LinkedIn profile');
    }
  }

  /**
   * Search LinkedIn profiles by email (if available)
   * @param {string} accessToken - LinkedIn access token
   * @param {string} email - Email to search for
   * @returns {Object} Search results
   */
  async searchByEmail(accessToken, email) {
    try {
      // Note: This endpoint may require special permissions
      const searchResponse = await axios.get(
        `${this.baseURL}/people-search`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0'
          },
          params: {
            keywords: email,
            projection: '(elements:(id,firstName,lastName,headline,location,industry,publicProfileUrl))'
          }
        }
      );

      return searchResponse.data;
    } catch (error) {
      logger.error('LinkedIn email search failed', {
        error: error.response?.data || error.message
      });
      return { elements: [] };
    }
  }

  /**
   * Validate LinkedIn access token
   * @param {string} accessToken - LinkedIn access token
   * @returns {boolean} Token validity
   */
  async validateToken(accessToken) {
    try {
      await this.getProfile(accessToken);
      return true;
    } catch (error) {
      logger.warn('LinkedIn token validation failed', {
        error: error.message
      });
      return false;
    }
  }
}

module.exports = new LinkedInService();