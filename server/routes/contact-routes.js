/**
 * Contact Management Routes - Core CRUD operations for BeeTagged contacts
 * 
 * Implements the original app design:
 * - Auto-save contact edits
 * - LinkedIn-first data priority
 * - Phone contact integration
 * - Resume/profile viewing
 */

const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const aiTagService = require('../services/ai-tag-suggestion-service');
const dataConflictService = require('../services/data-conflict-detection-service');
const privacyControlService = require('../services/privacy-control-service');
const logger = require('../../utils/logger');

/**
 * Get contacts list with search modes (ABC, YOU, NET)
 * GET /api/contacts
 */
router.get('/', async (req, res) => {
  try {
    const { userId, mode = 'abc', search = '', limit = 50 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId required'
      });
    }

    let query = { userId: userId };
    let sortOptions = {};

    // Apply search mode logic
    switch (mode) {
      case 'abc':
        // Alphabetical + LinkedIn (default phone app behavior)
        sortOptions = { name: 1 };
        break;
        
      case 'you':
        // Ordered by user's tags and ratings, then recent calls
        sortOptions = { 
          'gamificationData.userRating': -1,
          'allTags.0': -1, // Sort by tag count
          lastEnriched: -1 
        };
        break;
        
      case 'net':
        // Network view - how others rate these contacts
        sortOptions = { 
          'gamificationData.networkRating': -1,
          'gamificationData.validationCount': -1 
        };
        break;
    }

    // Apply search filter if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'priorityData.employment.current.employer': { $regex: search, $options: 'i' } },
        { 'priorityData.employment.current.jobFunction': { $regex: search, $options: 'i' } },
        { 'priorityData.location.current': { $regex: search, $options: 'i' } },
        { 'allTags.name': { $regex: search, $options: 'i' } }
      ];
    }

    const contacts = await Contact.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit));

    // Apply privacy filtering for each contact
    const filteredContacts = [];
    for (const contact of contacts) {
      try {
        const filtered = await privacyControlService.getFilteredContact(
          contact._id,
          userId,
          'mixed'
        );
        
        if (filtered.success) {
          filteredContacts.push({
            _id: contact._id,
            name: filtered.contact.name,
            phoneNumber: filtered.contact.phoneNumber,
            email: filtered.contact.email,
            priorityData: filtered.contact.priorityData,
            allTags: filtered.contact.tags,
            linkedinData: contact.linkedinData ? { id: contact.linkedinData.id } : null,
            lastEnriched: contact.lastEnriched
          });
        }
      } catch (filterError) {
        logger.warn('Failed to filter contact in list', {
          contactId: contact._id,
          error: filterError.message
        });
      }
    }

    res.json({
      success: true,
      message: `Contacts retrieved in ${mode} mode`,
      data: {
        contacts: filteredContacts,
        mode: mode,
        searchQuery: search,
        totalFound: filteredContacts.length
      }
    });

  } catch (error) {
    logger.error('Failed to get contacts list', {
      userId: req.query.userId,
      mode: req.query.mode,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve contacts',
      error: error.message
    });
  }
});

/**
 * Get single contact details
 * GET /api/contacts/:contactId
 */
router.get('/:contactId', async (req, res) => {
  try {
    const { contactId } = req.params;
    const { userId, context = 'mixed' } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId required'
      });
    }

    const contact = await Contact.findOne({ _id: contactId, userId: userId });
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Apply privacy filtering
    const filtered = await privacyControlService.getFilteredContact(
      contactId,
      userId,
      context
    );

    if (!filtered.success) {
      throw new Error('Failed to apply privacy filtering');
    }

    res.json({
      success: true,
      message: 'Contact details retrieved',
      contact: filtered.contact,
      privacyLevel: filtered.privacyLevel,
      context: filtered.context
    });

  } catch (error) {
    logger.error('Failed to get contact details', {
      contactId: req.params.contactId,
      userId: req.query.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve contact details',
      error: error.message
    });
  }
});

/**
 * Update contact field (auto-save functionality)
 * PUT /api/contacts/:contactId
 */
router.put('/:contactId', async (req, res) => {
  try {
    const { contactId } = req.params;
    const { userId, ...updateFields } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId required'
      });
    }

    const contact = await Contact.findOne({ _id: contactId, userId: userId });
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Update fields
    Object.keys(updateFields).forEach(key => {
      if (key.includes('.')) {
        // Handle nested field updates
        const keys = key.split('.');
        let current = contact;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = updateFields[key];
      } else {
        contact[key] = updateFields[key];
      }
    });

    // Update lastEnriched timestamp for user edits
    contact.lastEnriched = new Date();

    await contact.save();

    logger.info('Contact updated via auto-save', {
      contactId: contactId,
      userId: userId,
      fieldsUpdated: Object.keys(updateFields)
    });

    res.json({
      success: true,
      message: 'Contact updated successfully',
      contact: {
        _id: contact._id,
        name: contact.name,
        lastEnriched: contact.lastEnriched
      }
    });

  } catch (error) {
    logger.error('Failed to update contact', {
      contactId: req.params.contactId,
      userId: req.body.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to update contact',
      error: error.message
    });
  }
});

/**
 * Add tag to contact
 * POST /api/contacts/:contactId/tags
 */
router.post('/:contactId/tags', async (req, res) => {
  try {
    const { contactId } = req.params;
    const { userId, tag } = req.body;

    if (!userId || !tag || !tag.name || !tag.category) {
      return res.status(400).json({
        success: false,
        message: 'userId, tag.name, and tag.category required'
      });
    }

    const contact = await Contact.findOne({ _id: contactId, userId: userId });
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Check if tag already exists
    const existingTag = contact.allTags?.find(t => t.name === tag.name);
    if (existingTag) {
      return res.status(400).json({
        success: false,
        message: 'Tag already exists'
      });
    }

    // Add tag
    if (!contact.allTags) {
      contact.allTags = [];
    }
    
    contact.allTags.push({
      name: tag.name,
      category: tag.category,
      source: 'user',
      confidence: 1.0,
      addedAt: new Date()
    });

    // Update lastEnriched
    contact.lastEnriched = new Date();

    await contact.save();

    logger.info('Tag added to contact', {
      contactId: contactId,
      userId: userId,
      tagName: tag.name,
      category: tag.category
    });

    res.json({
      success: true,
      message: 'Tag added successfully',
      tag: tag
    });

  } catch (error) {
    logger.error('Failed to add tag', {
      contactId: req.params.contactId,
      userId: req.body.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to add tag',
      error: error.message
    });
  }
});

/**
 * Remove tag from contact
 * DELETE /api/contacts/:contactId/tags
 */
router.delete('/:contactId/tags', async (req, res) => {
  try {
    const { contactId } = req.params;
    const { userId, tagName } = req.body;

    if (!userId || !tagName) {
      return res.status(400).json({
        success: false,
        message: 'userId and tagName required'
      });
    }

    const contact = await Contact.findOne({ _id: contactId, userId: userId });
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Remove tag
    if (contact.allTags) {
      contact.allTags = contact.allTags.filter(tag => tag.name !== tagName);
      contact.lastEnriched = new Date();
      await contact.save();
    }

    logger.info('Tag removed from contact', {
      contactId: contactId,
      userId: userId,
      tagName: tagName
    });

    res.json({
      success: true,
      message: 'Tag removed successfully'
    });

  } catch (error) {
    logger.error('Failed to remove tag', {
      contactId: req.params.contactId,
      userId: req.body.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to remove tag',
      error: error.message
    });
  }
});

/**
 * Suggest AI tags for contact
 * POST /api/contacts/:contactId/suggest-tags
 */
router.post('/:contactId/suggest-tags', async (req, res) => {
  try {
    const { contactId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId required'
      });
    }

    const contact = await Contact.findOne({ _id: contactId, userId: userId });
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Generate AI tag suggestions
    const suggestions = await aiTagService.generateTagSuggestions(contact);

    res.json({
      success: true,
      message: 'AI tag suggestions generated',
      suggestions: suggestions
    });

  } catch (error) {
    logger.error('Failed to generate tag suggestions', {
      contactId: req.params.contactId,
      userId: req.body.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to generate tag suggestions',
      error: error.message
    });
  }
});

/**
 * Enrich contact with LinkedIn/Facebook data
 * POST /api/contacts/:contactId/enrich
 */
router.post('/:contactId/enrich', async (req, res) => {
  try {
    const { contactId } = req.params;
    const { userId, source = 'linkedin' } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId required'
      });
    }

    const contact = await Contact.findOne({ _id: contactId, userId: userId });
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // This would trigger LinkedIn/Facebook data enrichment
    // For now, return success message
    logger.info('Contact enrichment requested', {
      contactId: contactId,
      userId: userId,
      source: source
    });

    res.json({
      success: true,
      message: `Contact enrichment with ${source} data initiated`,
      contact: {
        _id: contact._id,
        name: contact.name,
        enrichmentStatus: 'processing'
      }
    });

  } catch (error) {
    logger.error('Failed to enrich contact', {
      contactId: req.params.contactId,
      userId: req.body.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to enrich contact',
      error: error.message
    });
  }
});

/**
 * Create new contact
 * POST /api/contacts
 */
router.post('/', async (req, res) => {
  try {
    const { userId, name, phoneNumber, email } = req.body;

    if (!userId || !name) {
      return res.status(400).json({
        success: false,
        message: 'userId and name required'
      });
    }

    const newContact = new Contact({
      userId: userId,
      name: name,
      phoneNumber: phoneNumber,
      email: email,
      source: 'manual',
      lastEnriched: new Date(),
      privacySettings: {
        level: 'private',
        context: 'mixed',
        lastUpdated: new Date()
      }
    });

    await newContact.save();

    logger.info('New contact created', {
      contactId: newContact._id,
      userId: userId,
      name: name
    });

    res.status(201).json({
      success: true,
      message: 'Contact created successfully',
      contact: {
        _id: newContact._id,
        name: newContact.name,
        phoneNumber: newContact.phoneNumber,
        email: newContact.email
      }
    });

  } catch (error) {
    logger.error('Failed to create contact', {
      userId: req.body.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to create contact',
      error: error.message
    });
  }
});

module.exports = router;