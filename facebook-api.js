const axios = require('axios');

class FacebookAPI {
  constructor() {
    this.appId = process.env.FACEBOOK_APP_ID;
    this.appSecret = process.env.FACEBOOK_APP_SECRET;
    this.baseURL = 'https://graph.facebook.com/v18.0';
  }

  async exchangeCodeForToken(code, redirectUri) {
    try {
      const response = await axios.get(`${this.baseURL}/oauth/access_token`, {
        params: {
          client_id: this.appId,
          client_secret: this.appSecret,
          redirect_uri: redirectUri,
          code: code
        }
      });
      
      return response.data.access_token;
    } catch (error) {
      console.error('Facebook token exchange error:', error.response?.data || error.message);
      throw new Error('Failed to exchange Facebook authorization code');
    }
  }

  async getUserProfile(accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/me`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,email,picture,work,education,location'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Facebook profile fetch error:', error.response?.data || error.message);
      throw new Error('Failed to fetch Facebook profile');
    }
  }

  async getFriends(accessToken) {
    try {
      // Note: Facebook heavily restricts friends data since API v2.0
      // Only friends who have also authorized your app are returned
      const response = await axios.get(`${this.baseURL}/me/friends`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,picture,work,education,location'
        }
      });
      
      return response.data.data || [];
    } catch (error) {
      console.error('Facebook friends fetch error:', error.response?.data || error.message);
      return [];
    }
  }

  async getTaggableFriends(accessToken) {
    try {
      // Alternative endpoint that may provide more friend data for tagging
      const response = await axios.get(`${this.baseURL}/me/taggable_friends`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,picture'
        }
      });
      
      return response.data.data || [];
    } catch (error) {
      console.error('Facebook taggable friends error:', error.response?.data || error.message);
      return [];
    }
  }

  async getPages(accessToken) {
    try {
      // Get pages the user manages - useful for business connections
      const response = await axios.get(`${this.baseURL}/me/accounts`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,category,about,location,website'
        }
      });
      
      return response.data.data || [];
    } catch (error) {
      console.error('Facebook pages fetch error:', error.response?.data || error.message);
      return [];
    }
  }

  async getLikedPages(accessToken) {
    try {
      // Get pages the user likes - can indicate professional interests
      const response = await axios.get(`${this.baseURL}/me/likes`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,category,about'
        }
      });
      
      return response.data.data || [];
    } catch (error) {
      console.error('Facebook liked pages error:', error.response?.data || error.message);
      return [];
    }
  }

  formatContactFromProfile(profile, source = 'facebook_profile') {
    const contact = {
      id: `fb_${profile.id}`,
      name: profile.name,
      email: profile.email || '',
      source: source,
      facebookId: profile.id,
      picture: profile.picture?.data?.url || '',
      tags: [],
      createdAt: new Date().toISOString(),
      priorityData: {
        employment: {},
        location: {},
        education: {}
      }
    };

    // Extract work information
    if (profile.work && profile.work.length > 0) {
      const currentWork = profile.work[0];
      contact.company = currentWork.employer?.name || '';
      contact.title = currentWork.position?.name || '';
      contact.priorityData.employment.current = {
        employer: contact.company,
        jobFunction: contact.title
      };
      
      if (contact.company) {
        contact.tags.push({ name: contact.company, category: 'company' });
      }
    }

    // Extract location
    if (profile.location) {
      contact.location = profile.location.name;
      contact.priorityData.location.current = contact.location;
      contact.tags.push({ name: contact.location, category: 'location' });
    }

    // Extract education
    if (profile.education && profile.education.length > 0) {
      const education = profile.education[0];
      if (education.school) {
        contact.tags.push({ name: education.school.name, category: 'education' });
        contact.priorityData.education.school = education.school.name;
      }
    }

    // Add Facebook as source tag
    contact.tags.push({ name: 'Facebook', category: 'source' });

    return contact;
  }

  generateAuthURL(redirectUri, state = '') {
    const scopes = [
      'email',
      'public_profile',
      'user_friends',
      'user_work_history',
      'user_education_history',
      'user_location',
      'user_likes'
    ].join(',');

    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: redirectUri,
      scope: scopes,
      response_type: 'code',
      state: state
    });

    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  }
}

module.exports = FacebookAPI;