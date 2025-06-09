/**
 * Privacy Control Routes - User Data Sovereignty API
 * 
 * CORE PRINCIPLE: "Users' exclusive right to share information or tags to public"
 * 
 * ADDRESSES RESEARCH INSIGHTS:
 * - Privacy is important component of app usage
 * - Some prefer 'social' BeeTagged, others prefer 'professional'
 * - Clear separation between contexts while maintaining user control
 */

const express = require('express');
const router = express.Router();
const privacyControlService = require('../services/privacy-control-service');
const Contact = require('../models/Contact');
const logger = require('../../utils/logger');

/**
 * Set contact privacy level and context
 * POST /api/privacy/contact/:contactId
 */
router.post('/contact/:contactId', async (req, res) => {
  try {
    const { contactId } = req.params;
    const { userId, privacyLevel, context } = req.body;

    if (!userId || !privacyLevel) {
      return res.status(400).json({
        success: false,
        message: 'userId and privacyLevel required'
      });
    }

    const result = await privacyControlService.setContactPrivacy(
      contactId, 
      userId, 
      privacyLevel, 
      context
    );

    res.json(result);

  } catch (error) {
    logger.error('Failed to set contact privacy', {
      contactId: req.params.contactId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to update contact privacy',
      error: error.message
    });
  }
});

/**
 * Set tag-level privacy controls
 * POST /api/privacy/tags/:contactId
 */
router.post('/tags/:contactId', async (req, res) => {
  try {
    const { contactId } = req.params;
    const { userId, tagPrivacySettings } = req.body;

    if (!userId || !Array.isArray(tagPrivacySettings)) {
      return res.status(400).json({
        success: false,
        message: 'userId and tagPrivacySettings array required'
      });
    }

    const result = await privacyControlService.setTagPrivacy(
      contactId,
      userId,
      tagPrivacySettings
    );

    res.json(result);

  } catch (error) {
    logger.error('Failed to set tag privacy', {
      contactId: req.params.contactId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to update tag privacy',
      error: error.message
    });
  }
});

/**
 * Get contact with privacy filtering
 * GET /api/privacy/contact/:contactId
 */
router.get('/contact/:contactId', async (req, res) => {
  try {
    const { contactId } = req.params;
    const { userId, context = 'mixed' } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId required'
      });
    }

    const result = await privacyControlService.getFilteredContact(
      contactId,
      userId,
      context
    );

    res.json(result);

  } catch (error) {
    logger.error('Failed to get filtered contact', {
      contactId: req.params.contactId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve contact',
      error: error.message
    });
  }
});

/**
 * Get user's privacy dashboard
 * GET /api/privacy/dashboard/:userId
 */
router.get('/dashboard/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const dashboard = await privacyControlService.getPrivacyDashboard(userId);

    res.json(dashboard);

  } catch (error) {
    logger.error('Failed to get privacy dashboard', {
      userId: req.params.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve privacy dashboard',
      error: error.message
    });
  }
});

/**
 * Bulk update privacy settings
 * POST /api/privacy/bulk-update
 */
router.post('/bulk-update', async (req, res) => {
  try {
    const { userId, updates } = req.body;

    if (!userId || !Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        message: 'userId and updates array required'
      });
    }

    const result = await privacyControlService.bulkUpdatePrivacy(userId, updates);

    res.json(result);

  } catch (error) {
    logger.error('Bulk privacy update failed', {
      userId: req.body.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to bulk update privacy settings',
      error: error.message
    });
  }
});

/**
 * Get privacy-aware contact list for search
 * GET /api/privacy/contacts/:userId/searchable
 */
router.get('/contacts/:userId/searchable', async (req, res) => {
  try {
    const { userId } = req.params;
    const { context = 'mixed', limit = 50 } = req.query;

    // Get contacts based on privacy context
    let query = { userId: userId };

    // Filter by privacy context if specified
    if (context !== 'mixed') {
      query.$or = [
        { 'privacySettings.context': context },
        { 'privacySettings.context': 'mixed' },
        { privacySettings: { $exists: false } } // Default to mixed
      ];
    }

    const contacts = await Contact.find(query)
      .sort({ lastEnriched: -1 })
      .limit(parseInt(limit));

    // Filter each contact based on privacy settings
    const filteredContacts = [];

    for (const contact of contacts) {
      try {
        const filtered = await privacyControlService.getFilteredContact(
          contact._id,
          userId,
          context
        );
        
        if (filtered.success) {
          filteredContacts.push({
            id: contact._id,
            name: filtered.contact.name,
            tags: filtered.contact.tags,
            currentJob: filtered.contact.priorityData?.employment?.current?.jobFunction,
            currentEmployer: filtered.contact.priorityData?.employment?.current?.employer,
            currentLocation: filtered.contact.priorityData?.location?.current,
            privacyLevel: filtered.privacyLevel,
            context: filtered.context
          });
        }
      } catch (filterError) {
        logger.warn('Failed to filter contact', {
          contactId: contact._id,
          error: filterError.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Privacy-filtered contacts retrieved',
      data: {
        contacts: filteredContacts,
        totalFound: filteredContacts.length,
        context: context,
        searchableFields: this.getSearchableFields(context)
      }
    });

  } catch (error) {
    logger.error('Failed to get searchable contacts', {
      userId: req.params.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve searchable contacts',
      error: error.message
    });
  }
});

/**
 * Get searchable fields for context
 * @param {string} context - Privacy context
 * @returns {Object} Available search fields
 */
function getSearchableFields(context) {
  const baseFields = ['name', 'tags', 'location'];
  
  switch (context) {
    case 'social':
      return {
        available: [...baseFields, 'interests', 'hobbies', 'hometown'],
        hidden: ['employment', 'professional_skills', 'linkedin_data']
      };
    
    case 'professional':
      return {
        available: [...baseFields, 'employment', 'skills', 'education', 'company'],
        hidden: ['personal_interests', 'relationship_status', 'hometown']
      };
    
    default: // mixed
      return {
        available: [...baseFields, 'employment', 'interests', 'education', 'company', 'skills'],
        hidden: []
      };
  }
}

/**
 * Export/download user's privacy settings
 * GET /api/privacy/export/:userId
 */
router.get('/export/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const contacts = await Contact.find({ userId: userId });
    
    const privacyExport = {
      exportDate: new Date().toISOString(),
      userId: userId,
      totalContacts: contacts.length,
      privacySettings: contacts.map(contact => ({
        contactId: contact._id,
        contactName: contact.name,
        privacyLevel: contact.privacySettings?.level || 'private',
        context: contact.privacySettings?.context || 'mixed',
        hiddenFields: contact.privacySettings?.hiddenFields || [],
        tagPrivacy: contact.tagPrivacy ? Object.fromEntries(contact.tagPrivacy) : {},
        lastUpdated: contact.privacySettings?.lastUpdated
      }))
    };

    res.json({
      success: true,
      message: 'Privacy settings exported',
      data: privacyExport
    });

  } catch (error) {
    logger.error('Failed to export privacy settings', {
      userId: req.params.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to export privacy settings',
      error: error.message
    });
  }
});

/**
 * Privacy recommendations based on user behavior
 * GET /api/privacy/recommendations/:userId
 */
router.get('/recommendations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const contacts = await Contact.find({ userId: userId });
    
    const recommendations = [];
    let socialContacts = 0;
    let professionalContacts = 0;
    let unsetPrivacy = 0;

    // Analyze current privacy settings
    contacts.forEach(contact => {
      const privacy = contact.privacySettings;
      
      if (!privacy) {
        unsetPrivacy++;
        return;
      }

      if (privacy.context === 'social') socialContacts++;
      if (privacy.context === 'professional') professionalContacts++;
    });

    // Generate recommendations
    if (unsetPrivacy > contacts.length * 0.5) {
      recommendations.push({
        type: 'setup_privacy',
        priority: 'high',
        message: `${unsetPrivacy} contacts need privacy settings`,
        action: 'Set privacy levels for better control'
      });
    }

    if (socialContacts === 0 && professionalContacts > 0) {
      recommendations.push({
        type: 'social_context',
        priority: 'medium',
        message: 'Consider adding social context contacts',
        action: 'Separate personal and professional networks'
      });
    }

    if (professionalContacts === 0 && socialContacts > 0) {
      recommendations.push({
        type: 'professional_context',
        priority: 'medium',
        message: 'Consider adding professional context contacts',
        action: 'Enhance networking capabilities'
      });
    }

    recommendations.push({
      type: 'review_settings',
      priority: 'low',
      message: 'Regular privacy review recommended',
      action: 'Review privacy settings quarterly'
    });

    res.json({
      success: true,
      message: 'Privacy recommendations generated',
      data: {
        recommendations: recommendations,
        stats: {
          totalContacts: contacts.length,
          socialContacts: socialContacts,
          professionalContacts: professionalContacts,
          unsetPrivacy: unsetPrivacy
        }
      }
    });

  } catch (error) {
    logger.error('Failed to generate privacy recommendations', {
      userId: req.params.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to generate recommendations',
      error: error.message
    });
  }
});

module.exports = router;