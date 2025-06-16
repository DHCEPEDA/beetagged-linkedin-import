/**
 * Updated LinkedIn API integration using OAuth 2.0 and current API endpoints
 * Replaces deprecated LinkedIn SDK and API methods
 */

class LinkedInAPI {
  constructor() {
    this.apiVersion = 'v2';
    this.baseUrl = `https://api.linkedin.com/${this.apiVersion}`;
    this.authUrl = 'https://www.linkedin.com/oauth/v2/authorization';
    this.tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
    this.clientId = process.env.REACT_APP_LINKEDIN_CLIENT_ID;
    this.clientSecret = process.env.REACT_APP_LINKEDIN_CLIENT_SECRET;
    this.redirectUri = `${window.location.origin}/auth/linkedin/callback`;
    this.accessToken = null;
  }

  /**
   * Generate OAuth 2.0 authorization URL
   */
  getAuthorizationUrl() {
    const scope = 'r_liteprofile r_emailaddress r_1st_degree_connections_size';
    const state = this.generateRandomState();
    
    // Store state for validation
    sessionStorage.setItem('linkedin_oauth_state', state);
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state: state,
      scope: scope
    });

    return `${this.authUrl}?${params.toString()}`;
  }

  /**
   * Generate random state for OAuth security
   */
  generateRandomState() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code, state) {
    // Validate state parameter
    const storedState = sessionStorage.getItem('linkedin_oauth_state');
    if (state !== storedState) {
      throw new Error('Invalid state parameter');
    }

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.redirectUri,
      client_id: this.clientId,
      client_secret: this.clientSecret
    });

    try {
      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString()
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.status}`);
      }

      const tokenData = await response.json();
      this.accessToken = tokenData.access_token;
      
      // Store token securely
      sessionStorage.setItem('linkedin_access_token', this.accessToken);
      
      return {
        accessToken: tokenData.access_token,
        expiresIn: tokenData.expires_in,
        refreshToken: tokenData.refresh_token
      };
    } catch (error) {
      throw new Error(`Failed to exchange code for token: ${error.message}`);
    }
  }

  /**
   * Initiate LinkedIn OAuth flow
   */
  async login() {
    const authUrl = this.getAuthorizationUrl();
    
    // Open popup window for OAuth
    const popup = window.open(
      authUrl,
      'linkedin_oauth',
      'width=600,height=700,scrollbars=yes,resizable=yes'
    );

    return new Promise((resolve, reject) => {
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          
          // Check if token was stored
          const token = sessionStorage.getItem('linkedin_access_token');
          if (token) {
            this.accessToken = token;
            resolve({ success: true, accessToken: token });
          } else {
            reject(new Error('LinkedIn login cancelled or failed'));
          }
        }
      }, 1000);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(checkClosed);
        popup.close();
        reject(new Error('LinkedIn login timeout'));
      }, 300000);
    });
  }

  /**
   * Get user profile using current LinkedIn API
   */
  async getUserProfile() {
    if (!this.accessToken) {
      throw new Error('No access token available. Please login first.');
    }

    try {
      // Get basic profile
      const profileResponse = await fetch(
        `${this.baseUrl}/people/~:(id,firstName,lastName,profilePicture(displayImage~:playableStreams))`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!profileResponse.ok) {
        throw new Error(`LinkedIn API error: ${profileResponse.status}`);
      }

      const profileData = await profileResponse.json();

      // Get email address
      const emailResponse = await fetch(
        `${this.baseUrl}/emailAddress?q=members&projection=(elements*(handle~))`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      let email = null;
      if (emailResponse.ok) {
        const emailData = await emailResponse.json();
        email = emailData.elements?.[0]?.['handle~']?.emailAddress;
      }

      return {
        id: profileData.id,
        firstName: profileData.firstName?.localized?.en_US || '',
        lastName: profileData.lastName?.localized?.en_US || '',
        name: `${profileData.firstName?.localized?.en_US || ''} ${profileData.lastName?.localized?.en_US || ''}`.trim(),
        email: email,
        profilePicture: this.extractProfilePicture(profileData.profilePicture)
      };
    } catch (error) {
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }
  }

  /**
   * Extract profile picture URL from LinkedIn response
   */
  extractProfilePicture(profilePicture) {
    try {
      const elements = profilePicture?.['displayImage~']?.elements;
      if (elements && elements.length > 0) {
        // Get the largest available image
        const largestImage = elements.reduce((prev, current) => 
          (prev.data?.com?.linkedin?.digitalmedia?.mediaartifact?.StillImage?.storageSize?.width || 0) >
          (current.data?.com?.linkedin?.digitalmedia?.mediaartifact?.StillImage?.storageSize?.width || 0) 
            ? prev : current
        );
        
        return largestImage?.identifiers?.[0]?.identifier;
      }
    } catch (error) {
      console.error('Error extracting profile picture:', error);
    }
    return null;
  }

  /**
   * Get connection count (new API endpoint)
   */
  async getConnectionCount() {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/people/~:(id,numConnections)`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`LinkedIn API error: ${response.status}`);
      }

      const data = await response.json();
      return data.numConnections || 0;
    } catch (error) {
      throw new Error(`Failed to fetch connection count: ${error.message}`);
    }
  }

  /**
   * Convert LinkedIn profile to BeeTagged User format
   */
  profileToUser(profile, additionalData = {}) {
    const tags = [];
    
    if (additionalData.company) tags.push(additionalData.company);
    if (additionalData.title) tags.push(additionalData.title);
    if (additionalData.location) tags.push(additionalData.location);
    if (additionalData.industry) tags.push(additionalData.industry);

    return {
      id: `linkedin_${profile.id}`,
      name: profile.name,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      profileImage: profile.profilePicture,
      company: additionalData.company || '',
      title: additionalData.title || '',
      location: additionalData.location || '',
      industry: additionalData.industry || '',
      source: 'linkedin',
      tags: tags
    };
  }

  /**
   * Logout and clear tokens
   */
  async logout() {
    this.accessToken = null;
    sessionStorage.removeItem('linkedin_access_token');
    sessionStorage.removeItem('linkedin_oauth_state');
    return Promise.resolve();
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn() {
    if (!this.accessToken) {
      this.accessToken = sessionStorage.getItem('linkedin_access_token');
    }
    return !!this.accessToken;
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
        `${this.baseUrl}/people/~:(id)`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Refresh access token (if refresh token is available)
   */
  async refreshAccessToken(refreshToken) {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret
    });

    try {
      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString()
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const tokenData = await response.json();
      this.accessToken = tokenData.access_token;
      sessionStorage.setItem('linkedin_access_token', this.accessToken);
      
      return {
        accessToken: tokenData.access_token,
        expiresIn: tokenData.expires_in
      };
    } catch (error) {
      throw new Error(`Failed to refresh token: ${error.message}`);
    }
  }
}

export default LinkedInAPI;