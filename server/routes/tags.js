const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// @route   GET /api/tags
// @desc    Get all tags for current user
// @access  Private
router.get('/', tagController.getTags);

// @route   GET /api/tags/:id
// @desc    Get tag by ID
// @access  Private
router.get('/:id', tagController.getTagById);

// @route   POST /api/tags
// @desc    Create a new tag
// @access  Private
router.post('/', tagController.createTag);

// @route   PUT /api/tags/:id
// @desc    Update a tag
// @access  Private
router.put('/:id', tagController.updateTag);

// @route   DELETE /api/tags/:id
// @desc    Delete a tag
// @access  Private
router.delete('/:id', tagController.deleteTag);

// @route   GET /api/tags/:tagId/contacts
// @desc    Get contacts with specific tag
// @access  Private
router.get('/:tagId/contacts', tagController.getContactsByTag);

module.exports = router;
