const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// @route   GET /api/contacts
// @desc    Get all contacts for current user
// @access  Private
router.get('/', contactController.getContacts);

// @route   GET /api/contacts/search
// @desc    Search contacts by tags, metadata, or text
// @access  Private
router.get('/search', contactController.searchContacts);

// @route   GET /api/contacts/:id
// @desc    Get contact by ID
// @access  Private
router.get('/:id', contactController.getContactById);

// @route   POST /api/contacts
// @desc    Create a new contact
// @access  Private
router.post('/', contactController.createContact);

// @route   PUT /api/contacts/:id
// @desc    Update a contact
// @access  Private
router.put('/:id', contactController.updateContact);

// @route   DELETE /api/contacts/:id
// @desc    Delete a contact
// @access  Private
router.delete('/:id', contactController.deleteContact);

// @route   POST /api/contacts/import/phone
// @desc    Import contacts from phone
// @access  Private
router.post('/import/phone', contactController.importPhoneContacts);

// @route   POST /api/contacts/import/:provider
// @desc    Import contacts from social network
// @access  Private
router.post('/import/:provider', contactController.importSocialContacts);

// @route   POST /api/contacts/:contactId/tags/:tagId
// @desc    Add a tag to a contact
// @access  Private
router.post('/:contactId/tags/:tagId', contactController.addTagToContact);

// @route   DELETE /api/contacts/:contactId/tags/:tagId
// @desc    Remove a tag from a contact
// @access  Private
router.delete('/:contactId/tags/:tagId', contactController.removeTagFromContact);

module.exports = router;
