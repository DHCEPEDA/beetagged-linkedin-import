import axios from 'axios';

/**
 * Initiates social login with Facebook
 * @returns {Promise<Object>} User data from Facebook
 */
export const loginWithFacebook = async () => {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error('Facebook SDK not loaded'));
      return;
    }

    window.FB.login(response => {
      if (response.authResponse) {
        // User authorized the app
        handleFacebookLogin(resolve, reject);
      } else {
        reject(new Error('Facebook login cancelled or failed'));
      }
    }, { scope: 'public_profile,email,user_friends' });
  });
};

/**
 * Helper function to handle Facebook login flow
 * @param {Function} resolve - Promise resolve function
 * @param {Function} reject - Promise reject function
 */
function handleFacebookLogin(resolve, reject) {
  window.FB.api('/me', { fields: 'id,name,email,picture' }, async (userData) => {
    try {
      // Get access token from Facebook response
      const authResponse = window.FB.getAuthResponse();
      
      // Call our backend with the Facebook data
      const serverResponse = await socialAuth('facebook', {
        accessToken: authResponse.accessToken,
        userID: authResponse.userID,
        userData: {
          name: userData.name,
          email: userData.email,
          picture: userData.picture?.data?.url
        }
      });
      
      resolve(serverResponse);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generic function to login with a social network
 * @param {string} provider - 'facebook' or 'linkedin'
 * @returns {Promise<Object>} User data 
 */
export const socialAuth = async (provider, data) => {
  try {
    const response = await axios.post(`/api/auth/${provider}`, data);
    return response.data;
  } catch (error) {
    console.error(`${provider} auth error:`, error);
    throw new Error(error.response?.data?.message || `${provider} authentication failed`);
  }
};

/**
 * Generic function to login with a social network
 * @param {string} provider - 'facebook' or 'linkedin'
 * @returns {Promise<Object>} User data 
 */
export const loginWithSocial = async (provider) => {
  if (provider === 'facebook') {
    return loginWithFacebook();
  } else if (provider === 'linkedin') {
    // LinkedIn requires a different flow with a redirect
    // This is handled by the LinkedInLoginButton component
    throw new Error('LinkedIn authentication must be initiated through the LinkedIn button');
  } else {
    throw new Error(`Unsupported social provider: ${provider}`);
  }
};