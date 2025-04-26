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
    
    handleFacebookLogin(resolve, reject);
  });
};

/**
 * Helper function to handle Facebook login flow
 * @param {Function} resolve - Promise resolve function
 * @param {Function} reject - Promise reject function
 */
function handleFacebookLogin(resolve, reject) {
  window.FB.login((response) => {
    if (response.authResponse) {
      // Get user info
      window.FB.api('/me', { fields: 'id,name,email,picture.type(large)' }, (userInfo) => {
        if (userInfo) {
          // Combine auth data and user info
          const userData = {
            ...userInfo,
            accessToken: response.authResponse.accessToken,
            userID: response.authResponse.userID
          };
          resolve(userData);
        } else {
          reject(new Error('Failed to get user information from Facebook'));
        }
      });
    } else {
      // User cancelled login or did not fully authorize
      reject(new Error('Facebook authentication was cancelled'));
    }
  }, { scope: 'email,public_profile,user_friends' });
}

/**
 * Generic function to login with a social network
 * @param {string} provider - 'facebook' or 'linkedin'
 * @returns {Promise<Object>} User data 
 */
export const loginWithSocial = async (provider) => {
  switch (provider) {
    case 'facebook':
      return loginWithFacebook();
    case 'linkedin':
      // To be implemented
      throw new Error('LinkedIn login not implemented yet');
    default:
      throw new Error(`Unknown social provider: ${provider}`);
  }
};