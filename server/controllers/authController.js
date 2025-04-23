const User = require('../models/User');
const LinkedinService = require('../services/linkedinService');
const FacebookService = require('../services/facebookService');

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    user = await User.create({
      name,
      email,
      password
    });

    // Generate JWT
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate JWT
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * LinkedIn OAuth
 * @route POST /api/auth/linkedin
 * @access Public
 */
exports.linkedinAuth = async (req, res, next) => {
  try {
    const { code, redirectUri } = req.body;

    // For direct login with access token
    if (req.body.accessToken) {
      const profileData = await LinkedinService.getProfileWithToken(req.body.accessToken);
      
      if (!profileData || !profileData.id) {
        return res.status(400).json({
          success: false,
          message: 'Invalid LinkedIn data'
        });
      }

      // Check if user exists with LinkedIn ID
      let user = await User.findOne({ linkedinId: profileData.id });

      // If user exists, update their data
      if (user) {
        user.linkedinToken = req.body.accessToken;
        user.linkedinConnected = true;
        user.lastLogin = Date.now();
        
        // Update name and profile picture if not set
        if (!user.profilePicture && profileData.pictureUrl) {
          user.profilePicture = profileData.pictureUrl;
        }
        
        await user.save();
      } else {
        // Check if user exists with same email
        if (profileData.email) {
          user = await User.findOne({ email: profileData.email });
          
          if (user) {
            // Update user with LinkedIn info
            user.linkedinId = profileData.id;
            user.linkedinToken = req.body.accessToken;
            user.linkedinConnected = true;
            user.lastLogin = Date.now();
            
            await user.save();
          }
        }
        
        // Create new user if not found
        if (!user) {
          user = await User.create({
            name: `${profileData.firstName} ${profileData.lastName}`,
            email: profileData.email || `linkedin_${profileData.id}@example.com`,
            linkedinId: profileData.id,
            linkedinToken: req.body.accessToken,
            linkedinConnected: true,
            profilePicture: profileData.pictureUrl
          });
        }
      }

      // Generate JWT
      const token = user.getSignedJwtToken();

      return res.status(200).json({
        success: true,
        token,
        user
      });
    }

    // Code flow
    const tokenData = await LinkedinService.getAccessToken(code, redirectUri);
    
    if (!tokenData || !tokenData.access_token) {
      return res.status(400).json({
        success: false,
        message: 'Failed to authenticate with LinkedIn'
      });
    }
    
    const profileData = await LinkedinService.getProfile(tokenData.access_token);
    
    if (!profileData || !profileData.id) {
      return res.status(400).json({
        success: false,
        message: 'Failed to get LinkedIn profile'
      });
    }

    // Check if user exists with LinkedIn ID
    let user = await User.findOne({ linkedinId: profileData.id });

    // Same logic as above for existing/new users
    if (user) {
      user.linkedinToken = tokenData.access_token;
      user.linkedinConnected = true;
      user.lastLogin = Date.now();
      
      if (!user.profilePicture && profileData.pictureUrl) {
        user.profilePicture = profileData.pictureUrl;
      }
      
      await user.save();
    } else {
      if (profileData.email) {
        user = await User.findOne({ email: profileData.email });
        
        if (user) {
          user.linkedinId = profileData.id;
          user.linkedinToken = tokenData.access_token;
          user.linkedinConnected = true;
          user.lastLogin = Date.now();
          
          await user.save();
        }
      }
      
      if (!user) {
        user = await User.create({
          name: `${profileData.firstName} ${profileData.lastName}`,
          email: profileData.email || `linkedin_${profileData.id}@example.com`,
          linkedinId: profileData.id,
          linkedinToken: tokenData.access_token,
          linkedinConnected: true,
          profilePicture: profileData.pictureUrl
        });
      }
    }

    // Generate JWT
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Facebook OAuth
 * @route POST /api/auth/facebook
 * @access Public
 */
exports.facebookAuth = async (req, res, next) => {
  try {
    // For direct login with access token
    if (req.body.accessToken) {
      const profileData = await FacebookService.getProfileWithToken(req.body.accessToken);
      
      if (!profileData || !profileData.id) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Facebook data'
        });
      }

      // Check if user exists with Facebook ID
      let user = await User.findOne({ facebookId: profileData.id });

      // If user exists, update their data
      if (user) {
        user.facebookToken = req.body.accessToken;
        user.facebookConnected = true;
        user.lastLogin = Date.now();
        
        // Update profile picture if not set
        if (!user.profilePicture && profileData.picture?.data?.url) {
          user.profilePicture = profileData.picture.data.url;
        }
        
        await user.save();
      } else {
        // Check if user exists with same email
        if (profileData.email) {
          user = await User.findOne({ email: profileData.email });
          
          if (user) {
            // Update user with Facebook info
            user.facebookId = profileData.id;
            user.facebookToken = req.body.accessToken;
            user.facebookConnected = true;
            user.lastLogin = Date.now();
            
            await user.save();
          }
        }
        
        // Create new user if not found
        if (!user) {
          user = await User.create({
            name: profileData.name,
            email: profileData.email || `facebook_${profileData.id}@example.com`,
            facebookId: profileData.id,
            facebookToken: req.body.accessToken,
            facebookConnected: true,
            profilePicture: profileData.picture?.data?.url
          });
        }
      }

      // Generate JWT
      const token = user.getSignedJwtToken();

      return res.status(200).json({
        success: true,
        token,
        user
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Facebook authentication requires an access token'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user
 * @route GET /api/auth/me
 * @access Private
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    // User already attached to req by the auth middleware
    res.status(200).json({
      success: true,
      data: req.user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user
 * @route PUT /api/auth/me
 * @access Private
 */
exports.updateCurrentUser = async (req, res, next) => {
  try {
    const { name, email, profilePicture } = req.body;
    
    // Allow updating only certain fields
    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name;
    if (email) fieldsToUpdate.email = email;
    if (profilePicture) fieldsToUpdate.profilePicture = profilePicture;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update password
 * @route PUT /api/auth/password
 * @access Private
 */
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id).select('+password');
    
    // Check if current password matches
    if (!currentPassword || !(await user.matchPassword(currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};
