const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', authController.register);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', authController.login);

// @route   POST /api/auth/linkedin
// @desc    Authenticate with LinkedIn
// @access  Public
router.post('/linkedin', authController.linkedinAuth);

// @route   POST /api/auth/facebook
// @desc    Authenticate with Facebook
// @access  Public
router.post('/facebook', authController.facebookAuth);

// @route   GET /api/auth/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', auth, authController.getCurrentUser);

// @route   PUT /api/auth/me
// @desc    Update current user's profile
// @access  Private
router.put('/me', auth, authController.updateCurrentUser);

// @route   PUT /api/auth/password
// @desc    Update password
// @access  Private
router.put('/password', auth, authController.updatePassword);

module.exports = router;
