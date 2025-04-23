const axios = require('axios');

/**
 * LinkedIn API Service
 */
class LinkedinService {
  /**
   * Get an access token from LinkedIn using authorization code
   * @param {string} code - Authorization code from LinkedIn
   * @param {string} redirectUri - The same redirect URI used in the authorization request
   * @returns {Promise<Object>} Token data
   */
  async getAccessToken(code, redirectUri) {
    try {
      const clientId = process.env.LINKEDIN_CLIENT_ID;
      const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        throw new Error('LinkedIn client ID or client secret not provided');
      }
      
      const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
        params: {
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('LinkedIn getAccessToken error:', error);
      throw error;
    }
  }
  
  /**
   * Get LinkedIn profile using access token
   * @param {string} accessToken - LinkedIn access token
   * @returns {Promise<Object>} User profile data
   */
  async getProfile(accessToken) {
    try {
      // Make API requests to get user profile
      const response = await axios.get('https://api.linkedin.com/v2/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      // Get email address
      const emailResponse = await axios.get('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      const profile = response.data;
      let email = null;
      
      if (emailResponse.data && 
          emailResponse.data.elements && 
          emailResponse.data.elements.length > 0) {
        email = emailResponse.data.elements[0]['handle~']?.emailAddress;
      }
      
      return {
        id: profile.id,
        firstName: profile.localizedFirstName,
        lastName: profile.localizedLastName,
        profilePicture: this._getProfilePicture(profile),
        email
      };
    } catch (error) {
      console.error('LinkedIn getProfile error:', error);
      throw error;
    }
  }
  
  /**
   * Get profile data directly with access token (client-side)
   * @param {string} accessToken - LinkedIn access token
   * @returns {Promise<Object>} User profile data
   */
  async getProfileWithToken(accessToken) {
    return this.getProfile(accessToken);
  }
  
  /**
   * Get LinkedIn connections
   * @param {string} accessToken - LinkedIn access token
   * @returns {Promise<Array>} List of connections
   */
  async getConnections(accessToken) {
    try {
      // In a real app, we would call the LinkedIn API to get real connections
      // LinkedIn requires partnership approval for accessing connections API
      // So for this demo, we'll return mock data
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulate connections data
      return [
        {
          id: 'linkedin_1',
          name: 'Alex Johnson',
          firstName: 'Alex',
          lastName: 'Johnson',
          email: 'alex.johnson@example.com',
          title: 'Software Engineer',
          company: 'Tech Innovations',
          profileUrl: 'https://www.linkedin.com/in/alexjohnson/',
          pictureUrl: null
        },
        {
          id: 'linkedin_2',
          name: 'Samantha Lee',
          firstName: 'Samantha',
          lastName: 'Lee',
          email: 'samantha.lee@example.com',
          title: 'Marketing Director',
          company: 'Global Brands Inc.',
          profileUrl: 'https://www.linkedin.com/in/samanthaleemarketig/',
          pictureUrl: null
        },
        {
          id: 'linkedin_3',
          name: 'Michael Chen',
          firstName: 'Michael',
          lastName: 'Chen',
          email: 'michael.chen@example.com',
          title: 'Product Manager',
          company: 'Innovative Solutions',
          profileUrl: 'https://www.linkedin.com/in/michaelchen/',
          pictureUrl: null
        },
        {
          id: 'linkedin_4',
          name: 'Emily Rodriguez',
          firstName: 'Emily',
          lastName: 'Rodriguez',
          email: 'emily.rodriguez@example.com',
          title: 'UX Designer',
          company: 'Creative Design Studio',
          profileUrl: 'https://www.linkedin.com/in/emilyrodriguez/',
          pictureUrl: null
        },
        {
          id: 'linkedin_5',
          name: 'David Kim',
          firstName: 'David',
          lastName: 'Kim',
          email: 'david.kim@example.com',
          title: 'Data Scientist',
          company: 'Analytics Pros',
          profileUrl: 'https://www.linkedin.com/in/davidkim/',
          pictureUrl: null
        }
      ];
    } catch (error) {
      console.error('LinkedIn getConnections error:', error);
      throw error;
    }
  }
  
  /**
   * Helper method to extract profile picture URL
   * @param {Object} profile - LinkedIn profile data
   * @returns {string|null} Profile picture URL or null
   * @private
   */
  _getProfilePicture(profile) {
    try {
      // Navigate through the LinkedIn response to get the profile picture
      // This may change based on LinkedIn API updates
      if (profile.profilePicture && 
          profile.profilePicture['displayImage~'] && 
          profile.profilePicture['displayImage~'].elements) {
        
        const elements = profile.profilePicture['displayImage~'].elements;
        // Get the highest resolution image
        for (let i = elements.length - 1; i >= 0; i--) {
          if (elements[i].identifiers && elements[i].identifiers.length > 0) {
            return elements[i].identifiers[0].identifier;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting LinkedIn profile picture:', error);
      return null;
    }
  }
}

module.exports = new LinkedinService();
