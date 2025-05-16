/**
 * Contact API Routes
 * 
 * Handles routes for managing contacts, including synchronization with
 * Facebook and LinkedIn, searching, and tagging.
 */
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Contact = require('../models/Contact');
const contactSyncService = require('../services/contact-sync-service');
const logger = require('../../utils/logger');

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
};

/**
 * GET /api/contacts
 * Get all contacts for the authenticated user
 */
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const contacts = await Contact.find({ user: req.user._id })
      .sort({ name: 1 });
    
    res.json(contacts);
  } catch (error) {
    logger.error('Error fetching contacts', { 
      userId: req.user._id, 
      error: error.message 
    });
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

/**
 * GET /api/contacts/:id
 * Get a specific contact by ID
 */
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const contactId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(contactId)) {
      return res.status(400).json({ error: 'Invalid contact ID' });
    }
    
    const contact = await Contact.findOne({
      _id: contactId,
      user: req.user._id
    });
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json(contact);
  } catch (error) {
    logger.error('Error fetching contact', {
      userId: req.user._id,
      contactId: req.params.id,
      error: error.message
    });
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
});

/**
 * POST /api/contacts
 * Create a new contact manually
 */
router.post('/', isAuthenticated, async (req, res) => {
  try {
    // Required fields
    if (!req.body.name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    // Create the contact
    const contact = new Contact({
      user: req.user._id,
      name: req.body.name,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      photoUrl: req.body.photoUrl,
      metadata: req.body.metadata || {},
      tags: req.body.tags || [],
      notes: req.body.notes,
      isFavorite: req.body.isFavorite || false,
      sources: [{
        type: 'manual',
        lastSynced: new Date()
      }]
    });
    
    await contact.save();
    
    res.status(201).json(contact);
  } catch (error) {
    logger.error('Error creating contact', {
      userId: req.user._id,
      error: error.message
    });
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

/**
 * PUT /api/contacts/:id
 * Update an existing contact
 */
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const contactId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(contactId)) {
      return res.status(400).json({ error: 'Invalid contact ID' });
    }
    
    const contact = await Contact.findOne({
      _id: contactId,
      user: req.user._id
    });
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    // Update contact fields
    if (req.body.name) contact.name = req.body.name;
    if (req.body.email) contact.email = req.body.email;
    if (req.body.phoneNumber) contact.phoneNumber = req.body.phoneNumber;
    if (req.body.photoUrl) contact.photoUrl = req.body.photoUrl;
    if (req.body.metadata) Object.assign(contact.metadata, req.body.metadata);
    if (req.body.notes) contact.notes = req.body.notes;
    if (req.body.hasOwnProperty('isFavorite')) contact.isFavorite = req.body.isFavorite;
    
    // Handle tags update
    if (req.body.tags) {
      // Add new tags
      for (const newTag of req.body.tags) {
        // Check if the tag already exists
        const tagExists = contact.tags.some(existingTag => 
          existingTag.name === newTag.name && existingTag.source === newTag.source
        );
        
        if (!tagExists) {
          contact.tags.push({
            name: newTag.name,
            type: newTag.type || 'custom',
            source: newTag.source || 'manual'
          });
        }
      }
    }
    
    // Handle tag removal
    if (req.body.removeTags && Array.isArray(req.body.removeTags)) {
      req.body.removeTags.forEach(tagName => {
        contact.tags = contact.tags.filter(tag => tag.name !== tagName);
      });
    }
    
    await contact.save();
    
    res.json(contact);
  } catch (error) {
    logger.error('Error updating contact', {
      userId: req.user._id,
      contactId: req.params.id,
      error: error.message
    });
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

/**
 * DELETE /api/contacts/:id
 * Delete a contact
 */
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const contactId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(contactId)) {
      return res.status(400).json({ error: 'Invalid contact ID' });
    }
    
    const contact = await Contact.findOneAndDelete({
      _id: contactId,
      user: req.user._id
    });
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    logger.error('Error deleting contact', {
      userId: req.user._id,
      contactId: req.params.id,
      error: error.message
    });
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

/**
 * POST /api/contacts/sync/facebook
 * Synchronize contacts from Facebook
 */
router.post('/sync/facebook', isAuthenticated, async (req, res) => {
  try {
    const { accessToken } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({ error: 'Facebook access token is required' });
    }
    
    const result = await contactSyncService.syncFacebookContacts(req.user, accessToken);
    
    res.json(result);
  } catch (error) {
    logger.error('Error synchronizing Facebook contacts', {
      userId: req.user._id,
      error: error.message
    });
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/contacts/sync/linkedin
 * Synchronize contacts from LinkedIn
 */
router.post('/sync/linkedin', isAuthenticated, async (req, res) => {
  try {
    const { accessToken } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({ error: 'LinkedIn access token is required' });
    }
    
    const result = await contactSyncService.syncLinkedInContacts(req.user, accessToken);
    
    res.json(result);
  } catch (error) {
    logger.error('Error synchronizing LinkedIn contacts', {
      userId: req.user._id,
      error: error.message
    });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/contacts/search
 * Search contacts with complex query
 */
router.get('/search', isAuthenticated, async (req, res) => {
  try {
    const searchParams = req.query;
    
    const contacts = await contactSyncService.searchContacts(req.user, searchParams);
    
    res.json(contacts);
  } catch (error) {
    logger.error('Error searching contacts', {
      userId: req.user._id,
      query: req.query,
      error: error.message
    });
    res.status(500).json({ error: 'Failed to search contacts' });
  }
});

/**
 * GET /api/contacts/tags/popular
 * Get popular tags for the user
 */
router.get('/tags/popular', isAuthenticated, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    const tags = await contactSyncService.getPopularTags(req.user, limit);
    
    res.json(tags);
  } catch (error) {
    logger.error('Error fetching popular tags', {
      userId: req.user._id,
      error: error.message
    });
    res.status(500).json({ error: 'Failed to fetch popular tags' });
  }
});

/**
 * GET /api/contacts/by-tag/:tagName
 * Get contacts by tag
 */
router.get('/by-tag/:tagName', isAuthenticated, async (req, res) => {
  try {
    const tagName = req.params.tagName;
    
    const contacts = await Contact.findByTags(req.user._id, tagName);
    
    res.json(contacts);
  } catch (error) {
    logger.error('Error fetching contacts by tag', {
      userId: req.user._id,
      tag: req.params.tagName,
      error: error.message
    });
    res.status(500).json({ error: 'Failed to fetch contacts by tag' });
  }
});

module.exports = router;