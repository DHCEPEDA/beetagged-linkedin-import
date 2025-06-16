/**
 * Updated Facebook Graph API integration using latest OAuth 2.0 and API v19.0
 * Replaces deprecated Facebook SDK methods
 */

class FacebookAPI {
  constructor() {
    this.apiVersion = 'v19.0';
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
    this.appId = process.env.REACT_APP_FACEBOOK_APP_ID;
    this.redirectUri = `${window.location.origin}/auth/facebook/callback`;
    this.accessToken = null;
  }

  /**
   * Initialize Facebook Login with latest OAuth 2.0 flow
   */
  async initializeAuth() {
    return new Promise((resolve, reject) => {
      window.fbAsyncInit = () => {
        window.FB.init({
          appId: this.appId,
          cookie: true,
          xfbml: true,
          version: this.apiVersion
        });

        window.FB.AppEvents.logPageView();
        resolve();
      };

      // Load Facebook SDK
      if (!document.getElementById('facebook-jssdk')) {
        const js = document.createElement('script');
        js.id = 'facebook-jssdk';
        js.src = 'https://connect.facebook.net/en_US/sdk.js';
        document.head.appendChild(js);
      }
    });
  }

  /**
   * Updated login method using current Facebook Login API
   */
  async login() {
    try {
      await this.initializeAuth();
      
      return new Promise((resolve, reject) => {
        window.FB.login((response) => {
          if (response.authResponse) {
            this.accessToken = response.authResponse.accessToken;
            resolve({
              success: true,
              accessToken: this.accessToken,
              userID: response.authResponse.userID,
              expiresIn: response.authResponse.expiresIn
            });
          } else {
            reject(new Error('Facebook login cancelled or failed'));
          }
        }, {
          scope: 'email,public_profile,user_friends',
          return_scopes: true,
          enable_profile_selector: true
        });
      });
    } catch (error) {
      throw new Error(`Facebook login error: ${error.message}`);
    }
  }

  /**
   * Get user profile using Graph API v19.0
   */
  async getUserProfile() {
    if (!this.accessToken) {
      throw new Error('No access token available. Please login first.');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/me?fields=id,name,email,picture.type(large),location,work,education&access_token=${this.accessToken}`
      );

      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.status}`);
      }

      const userData = await response.json();
      
      return {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        picture: userData.picture?.data?.url,
        location: userData.location?.name,
        work: userData.work || [],
        education: userData.education || []
      };
    } catch (error) {
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }
  }

  /**
   * Get user's friends list (limited to app users due to API changes)
   */
  async getFriends() {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/me/friends?fields=id,name,picture&access_token=${this.accessToken}`
      );

      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      throw new Error(`Failed to fetch friends: ${error.message}`);
    }
  }

  /**
   * Convert Facebook profile to BeeTagged User format
   */
  profileToUser(profile) {
    const tags = [];
    
    if (profile.location) {
      tags.push(profile.location);
    }
    
    if (profile.work && profile.work.length > 0) {
      profile.work.forEach(job => {
        if (job.employer?.name) tags.push(job.employer.name);
        if (job.position?.name) tags.push(job.position.name);
      });
    }
    
    if (profile.education && profile.education.length > 0) {
      profile.education.forEach(edu => {
        if (edu.school?.name) tags.push(edu.school.name);
        if (edu.type) tags.push(edu.type);
      });
    }

    return {
      id: `facebook_${profile.id}`,
      name: profile.name,
      email: profile.email,
      profileImage: profile.picture,
      location: profile.location,
      company: profile.work?.[0]?.employer?.name || '',
      title: profile.work?.[0]?.position?.name || '',
      source: 'facebook',
      tags: tags
    };
  }

  /**
   * Logout and clear tokens
   */
  async logout() {
    return new Promise((resolve) => {
      if (window.FB) {
        window.FB.logout(() => {
          this.accessToken = null;
          resolve();
        });
      } else {
        this.accessToken = null;
        resolve();
      }
    });
  }

  /**
   * Check login status
   */
  async getLoginStatus() {
    return new Promise((resolve) => {
      window.FB.getLoginStatus((response) => {
        if (response.status === 'connected') {
          this.accessToken = response.authResponse.accessToken;
          resolve({
            connected: true,
            accessToken: this.accessToken,
            userID: response.authResponse.userID
          });
        } else {
          resolve({ connected: false });
        }
      });
    });
  }

  /**
   * Validate current access token
   */
  async validateToken() {
    if (!this.accessToken) {
      return false;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/me?access_token=${this.accessToken}`
      );
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export default FacebookAPI;