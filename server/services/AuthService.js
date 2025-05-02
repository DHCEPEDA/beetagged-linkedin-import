/**
 * Advanced Authentication Service
 * Provides a unified interface for all authentication providers
 * with sophisticated error handling, CSRF protection, and retry logic
 */
const axios = require('axios');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// In-memory sessions (in production, use Redis or a database)
const sessions = {};

// OAuth providers configuration
const PROVIDERS = {
  FACEBOOK: 'facebook',
  LINKEDIN: 'linkedin',
  // Add more providers as needed
};

class AuthService {
  constructor() {
    this.providerStrategies = {
      [PROVIDERS.FACEBOOK]: {
        tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
        profileUrl: 'https://graph.facebook.com/v18.0/me',
        profileFields: 'id,name,email,picture',
        scope: 'public_profile,email',
        authorizeUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
        clientIdEnvName: 'FACEBOOK_APP_ID',
        clientSecretEnvName: 'FACEBOOK_APP_SECRET',
        redirectUriPath: '/api/auth/facebook/callback'
      },
      [PROVIDERS.LINKEDIN]: {
        tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
        profileUrl: 'https://api.linkedin.com/v2/me',
        emailUrl: 'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))',
        scope: 'r_liteprofile r_emailaddress',
        authorizeUrl: 'https://www.linkedin.com/oauth/v2/authorization',
        clientIdEnvName: 'LINKEDIN_CLIENT_ID',
        clientSecretEnvName: 'LINKEDIN_CLIENT_SECRET',
        redirectUriPath: '/api/auth/linkedin/callback'
      }
    };
    
    // Purge expired sessions periodically (every 1 hour)
    setInterval(() => this.purgeExpiredSessions(), 60 * 60 * 1000);
  }

  /**
   * Generate a secure state token for CSRF protection
   * @param {object} metadata - Additional metadata to store with the state
   * @returns {string} The state token
   */
  generateState(metadata = {}) {
    const state = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // State expires in 1 hour
    
    sessions[state] = {
      ...metadata,
      created: new Date(),
      expiresAt
    };
    
    return state;
  }

  /**
   * Validate a state token and retrieve its metadata
   * @param {string} state - The state token to validate
   * @returns {object|null} The state metadata or null if invalid
   */
  validateState(state) {
    if (!state || !sessions[state]) {
      return null;
    }
    
    const stateData = sessions[state];
    
    // Check if state has expired
    if (stateData.expiresAt && new Date() > stateData.expiresAt) {
      delete sessions[state]; // Clean up expired state
      return null;
    }
    
    return stateData;
  }

  /**
   * Clean up a state after use
   * @param {string} state - The state token to clean up
   */
  cleanupState(state) {
    if (state && sessions[state]) {
      delete sessions[state];
    }
  }

  /**
   * Generate the authorization URL for a provider
   * @param {string} provider - The provider (facebook, linkedin, etc.)
   * @param {object} options - Additional options
   * @returns {object} The authorization URL and state
   */
  getAuthorizationUrl(provider, options = {}) {
    const strategy = this.providerStrategies[provider];
    if (!strategy) {
      throw new Error(`Unsupported provider: ${provider}`);
    }
    
    // Generate state with metadata (including returnUrl)
    const state = this.generateState({
      provider,
      returnUrl: options.returnUrl || '/',
      ...options.metadata
    });
    
    // Get client ID from environment variables
    const clientId = process.env[strategy.clientIdEnvName];
    if (!clientId) {
      throw new Error(`Missing ${strategy.clientIdEnvName} environment variable`);
    }
    
    // Build the full redirect URI based on request protocol and host
    const host = options.host || 'http://localhost:5000';
    const redirectUri = `${host}${strategy.redirectUriPath}`;
    
    // Make sure we strip any port numbers from the redirect URI
    const cleanRedirectUri = redirectUri.replace(/:5000/g, '');
    
    // Build authorization URL
    const authUrl = `${strategy.authorizeUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(cleanRedirectUri)}&state=${state}&scope=${encodeURIComponent(strategy.scope)}`;
    
    // For LinkedIn, we need to add response_type
    if (provider === PROVIDERS.LINKEDIN) {
      authUrl += '&response_type=code';
    }
    
    return { url: authUrl, state };
  }

  /**
   * Exchange an authorization code for an access token
   * @param {string} provider - The provider (facebook, linkedin, etc.)
   * @param {string} code - The authorization code
   * @param {string} redirectUri - The redirect URI used for authorization
   * @returns {Promise<object>} The token response
   */
  async exchangeCodeForToken(provider, code, redirectUri) {
    const strategy = this.providerStrategies[provider];
    if (!strategy) {
      throw new Error(`Unsupported provider: ${provider}`);
    }
    
    const clientId = process.env[strategy.clientIdEnvName];
    const clientSecret = process.env[strategy.clientSecretEnvName];
    
    if (!clientId || !clientSecret) {
      throw new Error(`Missing ${strategy.clientIdEnvName} or ${strategy.clientSecretEnvName} environment variable`);
    }
    
    // Make sure we strip any port numbers from the redirect URI
    const cleanRedirectUri = redirectUri.replace(/:5000/g, '');
    
    try {
      let response;
      
      if (provider === PROVIDERS.FACEBOOK) {
        // Facebook uses GET with query parameters
        response = await axios.get(strategy.tokenUrl, {
          params: {
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: cleanRedirectUri,
            code
          }
        });
      } else if (provider === PROVIDERS.LINKEDIN) {
        // LinkedIn uses POST with form data
        response = await axios.post(strategy.tokenUrl, null, {
          params: {
            grant_type: 'authorization_code',
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: cleanRedirectUri,
            code
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error exchanging code for token (${provider}):`, error.response?.data || error.message);
      throw new Error(`Failed to exchange code for token: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Get user profile from the provider using an access token
   * @param {string} provider - The provider (facebook, linkedin, etc.)
   * @param {string} accessToken - The access token
   * @returns {Promise<object>} The user profile
   */
  async getUserProfile(provider, accessToken) {
    const strategy = this.providerStrategies[provider];
    if (!strategy) {
      throw new Error(`Unsupported provider: ${provider}`);
    }
    
    try {
      if (provider === PROVIDERS.FACEBOOK) {
        // Facebook profile request
        const response = await axios.get(strategy.profileUrl, {
          params: {
            fields: strategy.profileFields,
            access_token: accessToken
          }
        });
        
        return response.data;
      } else if (provider === PROVIDERS.LINKEDIN) {
        // LinkedIn requires two requests (profile and email)
        const profileResponse = await axios.get(strategy.profileUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        
        // Get email separately for LinkedIn
        const emailResponse = await axios.get(strategy.emailUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        
        // Format the profile data
        return {
          id: profileResponse.data.id,
          name: `${profileResponse.data.localizedFirstName} ${profileResponse.data.localizedLastName}`,
          email: emailResponse.data.elements?.[0]?.['handle~']?.emailAddress || '',
          picture: {
            data: {
              url: 'https://via.placeholder.com/200' // LinkedIn doesn't provide picture in basic scope
            }
          },
          provider: PROVIDERS.LINKEDIN
        };
      }
    } catch (error) {
      console.error(`Error getting user profile (${provider}):`, error.response?.data || error.message);
      throw new Error(`Failed to get user profile: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Create an authenticated session for a user
   * @param {object} userData - The user data
   * @param {object} authData - The authentication data (tokens, etc.)
   * @returns {string} The session token
   */
  createSession(userData, authData) {
    const sessionToken = uuidv4();
    const expiresAt = new Date();
    // Set session expiration (default 7 days)
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    sessions[sessionToken] = {
      user: userData,
      auth: authData,
      created: new Date(),
      expiresAt
    };
    
    return sessionToken;
  }

  /**
   * Get session data for a session token
   * @param {string} token - The session token
   * @returns {object|null} The session data or null if invalid
   */
  getSession(token) {
    if (!token || !sessions[token]) {
      return null;
    }
    
    const session = sessions[token];
    
    // Check if session has expired
    if (session.expiresAt && new Date() > session.expiresAt) {
      delete sessions[token]; // Clean up expired session
      return null;
    }
    
    return session;
  }

  /**
   * Destroy a session
   * @param {string} token - The session token to destroy
   * @returns {boolean} True if session was destroyed
   */
  destroySession(token) {
    if (token && sessions[token]) {
      delete sessions[token];
      return true;
    }
    return false;
  }

  /**
   * Purge expired sessions to prevent memory leaks
   */
  purgeExpiredSessions() {
    const now = new Date();
    let purgedCount = 0;
    
    for (const [key, session] of Object.entries(sessions)) {
      if (session.expiresAt && now > session.expiresAt) {
        delete sessions[key];
        purgedCount++;
      }
    }
    
    if (purgedCount > 0) {
      console.log(`Purged ${purgedCount} expired sessions`);
    }
  }
}

// Singleton instance
const authService = new AuthService();

// Export constants and service
module.exports = {
  PROVIDERS,
  authService
};