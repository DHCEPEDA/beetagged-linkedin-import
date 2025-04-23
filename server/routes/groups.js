const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// @route   GET /api/groups
// @desc    Get all groups for current user
// @access  Private
router.get('/', groupController.getGroups);

// @route   GET /api/groups/:id
// @desc    Get group by ID
// @access  Private
router.get('/:id', groupController.getGroupById);

// @route   POST /api/groups
// @desc    Create a new group
// @access  Private
router.post('/', groupController.createGroup);

// @route   PUT /api/groups/:id
// @desc    Update a group
// @access  Private
router.put('/:id', groupController.updateGroup);

// @route   DELETE /api/groups/:id
// @desc    Delete a group
// @access  Private
router.delete('/:id', groupController.deleteGroup);

// @route   GET /api/groups/:id/members
// @desc    Get members of a group
// @access  Private
router.get('/:id/members', groupController.getGroupMembers);

// @route   POST /api/groups/:groupId/members/:contactId
// @desc    Add a contact to a group
// @access  Private
router.post('/:groupId/members/:contactId', groupController.addContactToGroup);

// @route   DELETE /api/groups/:groupId/members/:contactId
// @desc    Remove a contact from a group
// @access  Private
router.delete('/:groupId/members/:contactId', groupController.removeContactFromGroup);

module.exports = router;
