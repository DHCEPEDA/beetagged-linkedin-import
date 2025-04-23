import { socialAuth } from './api';

/**
 * Initiates social login with LinkedIn
 * @returns {Promise<Object>} User data from LinkedIn
 */
export const loginWithLinkedIn = async () => {
  return new Promise((resolve, reject) => {
    try {
      // Verify that LinkedIn SDK is loaded
      if (!window.IN) {
        reject(new Error('LinkedIn SDK not loaded'));
        return;
      }

      // Initialize LinkedIn authorization
      window.IN.User.authorize(() => {
        // Get basic profile information
        window.IN.API.Profile("me").fields(
          ["id", "firstName", "lastName", "email-address", "picture-url"]
        ).result(profile => {
          if (profile && profile.values && profile.values.length > 0) {
            const userData = {
              id: profile.values[0].id,
              name: `${profile.values[0].firstName} ${profile.values[0].lastName}`,
              email: profile.values[0].emailAddress,
              profilePicture: profile.values[0].pictureUrl,
              accessToken: window.IN.ENV.auth.oauth_token
            };
            
            resolve(userData);
          } else {
            reject(new Error('Failed to get LinkedIn profile data'));
          }
        });
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Initiates social login with Facebook
 * @returns {Promise<Object>} User data from Facebook
 */
export const loginWithFacebook = async () => {
  return new Promise((resolve, reject) => {
    try {
      // Verify that Facebook SDK is loaded
      if (!window.FB) {
        reject(new Error('Facebook SDK not loaded'));
        return;
      }

      // Request login with permissions
      window.FB.login(response => {
        if (response.authResponse) {
          // Get user profile information
          window.FB.api('/me', { fields: 'id,name,email,picture' }, userData => {
            if (userData) {
              const userInfo = {
                id: userData.id,
                name: userData.name,
                email: userData.email,
                profilePicture: userData.picture?.data?.url,
                accessToken: response.authResponse.accessToken
              };
              
              resolve(userInfo);
            } else {
              reject(new Error('Failed to get Facebook profile data'));
            }
          });
        } else {
          reject(new Error('User cancelled login or did not fully authorize'));
        }
      }, { 
        scope: 'email,public_profile,user_friends' 
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generic function to login with a social network
 * @param {string} provider - 'linkedin' or 'facebook'
 * @returns {Promise<Object>} User data 
 */
export const loginWithSocial = async (provider) => {
  try {
    let userData;
    
    if (provider === 'linkedin') {
      userData = await loginWithLinkedIn();
    } else if (provider === 'facebook') {
      userData = await loginWithFacebook();
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }
    
    // Send the social auth data to backend
    const result = await socialAuth(provider, userData);
    
    // Store auth token and user data
    if (result.token) {
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
    }
    
    return result.user;
  } catch (error) {
    console.error(`${provider} login error:`, error);
    throw error;
  }
};
