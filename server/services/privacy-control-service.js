/**
 * Privacy Control Service - User Data Sovereignty Engine
 * 
 * ADDRESSES RESEARCH FINDINGS:
 * - "Users' exclusive right to share information or tags to public"
 * - "Privacy is an important component of app usage"
 * - "Juggling social media and address books is confusing"
 * - Focus group: Some prefer 'social', others prefer 'professional'
 * 
 * CORE PRINCIPLES:
 * - User owns all data and controls visibility
 * - Clear separation between social and professional contexts
 * - Granular privacy controls for each contact and tag
 * - Never share user data without explicit permission
 */

const Contact = require('../models/Contact');
const logger = require('../../utils/logger');

class PrivacyControlService {
  constructor() {
    this.privacyLevels = {
      PRIVATE: 'private',           // Only user can see
      SOCIAL: 'social',             // Share with social network
      PROFESSIONAL: 'professional', // Share with work network
      PUBLIC: 'public'              // Publicly shareable
    };

    this.contextTypes = {
      SOCIAL: 'social',
      PROFESSIONAL: 'professional',
      MIXED: 'mixed'
    };
  }

  /**
   * Set privacy level for a contact
   * @param {string} contactId - Contact ID
   * @param {string} userId - User ID
   * @param {string} privacyLevel - Privacy level
   * @param {string} context - Social or professional context
   * @returns {Object} Updated privacy settings
   */
  async setContactPrivacy(contactId, userId, privacyLevel, context = 'mixed') {
    try {
      const contact = await Contact.findOne({ _id: contactId, userId: userId });
      
      if (!contact) {
        throw new Error('Contact not found or unauthorized');
      }

      // Initialize privacy settings if not exists
      if (!contact.privacySettings) {
        contact.privacySettings = {
          level: this.privacyLevels.PRIVATE,
          context: this.contextTypes.MIXED,
          sharedTags: [],
          hiddenFields: [],
          lastUpdated: new Date()
        };
      }

      // Update privacy settings
      contact.privacySettings.level = privacyLevel;
      contact.privacySettings.context = context;
      contact.privacySettings.lastUpdated = new Date();

      // Auto-hide sensitive fields based on context
      this.applyContextBasedPrivacy(contact, context);

      await contact.save();

      logger.info('Contact privacy updated', {
        contactId: contactId,
        userId: userId,
        privacyLevel: privacyLevel,
        context: context
      });

      return {
        success: true,
        contactId: contactId,
        privacySettings: contact.privacySettings
      };

    } catch (error) {
      logger.error('Failed to set contact privacy', {
        contactId: contactId,
        userId: userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Apply context-based privacy rules
   * @param {Object} contact - Contact document
   * @param {string} context - Privacy context
   */
  applyContextBasedPrivacy(contact, context) {
    const hiddenFields = [];

    switch (context) {
      case this.contextTypes.SOCIAL:
        // Hide professional information in social context
        hiddenFields.push(
          'linkedinData',
          'priorityData.employment',
          'professionalTags'
        );
        break;

      case this.contextTypes.PROFESSIONAL:
        // Hide personal information in professional context
        hiddenFields.push(
          'facebookData.relationship_status',
          'facebookData.hometown',
          'priorityData.social.hobbies',
          'personalTags'
        );
        break;

      case this.contextTypes.MIXED:
        // Allow both but user controls individual fields
        break;
    }

    contact.privacySettings.hiddenFields = hiddenFields;
  }

  /**
   * Set tag privacy levels
   * @param {string} contactId - Contact ID
   * @param {string} userId - User ID
   * @param {Array} tagPrivacySettings - Array of {tagName, privacyLevel}
   * @returns {Object} Updated tag privacy settings
   */
  async setTagPrivacy(contactId, userId, tagPrivacySettings) {
    try {
      const contact = await Contact.findOne({ _id: contactId, userId: userId });
      
      if (!contact) {
        throw new Error('Contact not found or unauthorized');
      }

      // Initialize tag privacy if not exists
      if (!contact.tagPrivacy) {
        contact.tagPrivacy = new Map();
      }

      // Update privacy for each tag
      tagPrivacySettings.forEach(({ tagName, privacyLevel }) => {
        contact.tagPrivacy.set(tagName, {
          level: privacyLevel,
          updatedAt: new Date()
        });
      });

      await contact.save();

      logger.info('Tag privacy updated', {
        contactId: contactId,
        userId: userId,
        tagsUpdated: tagPrivacySettings.length
      });

      return {
        success: true,
        contactId: contactId,
        tagPrivacy: Object.fromEntries(contact.tagPrivacy)
      };

    } catch (error) {
      logger.error('Failed to set tag privacy', {
        contactId: contactId,
        userId: userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get filtered contact based on privacy settings and context
   * @param {string} contactId - Contact ID
   * @param {string} userId - User ID
   * @param {string} viewerContext - Viewer's context (social/professional)
   * @returns {Object} Filtered contact data
   */
  async getFilteredContact(contactId, userId, viewerContext = 'mixed') {
    try {
      const contact = await Contact.findOne({ _id: contactId, userId: userId });
      
      if (!contact) {
        throw new Error('Contact not found or unauthorized');
      }

      // Create filtered copy
      const filteredContact = {
        _id: contact._id,
        name: contact.name,
        phoneNumber: contact.phoneNumber,
        email: contact.email,
        tags: [],
        priorityData: {},
        lastEnriched: contact.lastEnriched
      };

      // Apply privacy filtering
      const privacySettings = contact.privacySettings || { level: this.privacyLevels.PRIVATE };
      const hiddenFields = privacySettings.hiddenFields || [];

      // Filter tags based on privacy settings
      if (contact.allTags) {
        filteredContact.tags = contact.allTags.filter(tag => {
          const tagPrivacy = contact.tagPrivacy?.get(tag.name);
          const tagLevel = tagPrivacy?.level || this.privacyLevels.PRIVATE;
          
          return this.isVisible(tagLevel, viewerContext, privacySettings.context);
        });
      }

      // Filter priority data based on context
      if (contact.priorityData && !hiddenFields.includes('priorityData')) {
        filteredContact.priorityData = this.filterPriorityData(
          contact.priorityData, 
          viewerContext, 
          hiddenFields
        );
      }

      // Add social media data based on context and privacy
      if (viewerContext === 'social' && !hiddenFields.includes('facebookData')) {
        filteredContact.facebookData = this.filterSocialData(contact.facebookData, 'social');
      }

      if (viewerContext === 'professional' && !hiddenFields.includes('linkedinData')) {
        filteredContact.linkedinData = this.filterSocialData(contact.linkedinData, 'professional');
      }

      return {
        success: true,
        contact: filteredContact,
        privacyLevel: privacySettings.level,
        context: privacySettings.context
      };

    } catch (error) {
      logger.error('Failed to get filtered contact', {
        contactId: contactId,
        userId: userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Check if data is visible based on privacy settings
   * @param {string} dataPrivacyLevel - Privacy level of the data
   * @param {string} viewerContext - Viewer's context
   * @param {string} contactContext - Contact's context setting
   * @returns {boolean} Whether data is visible
   */
  isVisible(dataPrivacyLevel, viewerContext, contactContext) {
    // Always show private data to owner
    if (dataPrivacyLevel === this.privacyLevels.PRIVATE) {
      return true;
    }

    // Public data is always visible
    if (dataPrivacyLevel === this.privacyLevels.PUBLIC) {
      return true;
    }

    // Context-based visibility
    if (dataPrivacyLevel === this.privacyLevels.SOCIAL) {
      return viewerContext === 'social' || contactContext === 'mixed';
    }

    if (dataPrivacyLevel === this.privacyLevels.PROFESSIONAL) {
      return viewerContext === 'professional' || contactContext === 'mixed';
    }

    return false;
  }

  /**
   * Filter priority data based on context
   * @param {Object} priorityData - Contact's priority data
   * @param {string} context - Viewing context
   * @param {Array} hiddenFields - Fields to hide
   * @returns {Object} Filtered priority data
   */
  filterPriorityData(priorityData, context, hiddenFields) {
    const filtered = JSON.parse(JSON.stringify(priorityData)); // Deep copy

    // Remove hidden fields
    hiddenFields.forEach(field => {
      if (field.startsWith('priorityData.')) {
        const fieldPath = field.replace('priorityData.', '');
        this.deleteNestedField(filtered, fieldPath);
      }
    });

    // Context-specific filtering
    if (context === 'social') {
      // Hide detailed employment info in social context
      if (filtered.employment) {
        delete filtered.employment.history;
      }
    } else if (context === 'professional') {
      // Hide personal interests in professional context
      if (filtered.social) {
        delete filtered.social.hobbies;
        filtered.social.interests = filtered.social.interests?.filter(
          interest => interest.category !== 'personal'
        );
      }
    }

    return filtered;
  }

  /**
   * Filter social media data for privacy
   * @param {Object} socialData - Facebook or LinkedIn data
   * @param {string} platform - Platform type
   * @returns {Object} Filtered social data
   */
  filterSocialData(socialData, platform) {
    if (!socialData) return null;

    const filtered = JSON.parse(JSON.stringify(socialData)); // Deep copy

    if (platform === 'social' && filtered.work) {
      // Keep only current job in social context
      filtered.work.data = filtered.work.data?.slice(0, 1);
    }

    if (platform === 'professional' && filtered.relationship_status) {
      // Remove personal relationship info in professional context
      delete filtered.relationship_status;
      delete filtered.hometown;
    }

    return filtered;
  }

  /**
   * Delete nested field from object
   * @param {Object} obj - Object to modify
   * @param {string} path - Dot-notation path
   */
  deleteNestedField(obj, path) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => current?.[key], obj);
    
    if (target && lastKey) {
      delete target[lastKey];
    }
  }

  /**
   * Get user's privacy dashboard
   * @param {string} userId - User ID
   * @returns {Object} Privacy overview and controls
   */
  async getPrivacyDashboard(userId) {
    try {
      const contacts = await Contact.find({ userId: userId });
      
      const privacyStats = {
        totalContacts: contacts.length,
        privateContacts: 0,
        socialContacts: 0,
        professionalContacts: 0,
        publicContacts: 0,
        mixedContextContacts: 0
      };

      const tagPrivacyStats = {
        privateTags: 0,
        sharedTags: 0,
        publicTags: 0
      };

      // Analyze current privacy settings
      contacts.forEach(contact => {
        const privacy = contact.privacySettings;
        if (privacy) {
          switch (privacy.level) {
            case this.privacyLevels.PRIVATE:
              privacyStats.privateContacts++;
              break;
            case this.privacyLevels.SOCIAL:
              privacyStats.socialContacts++;
              break;
            case this.privacyLevels.PROFESSIONAL:
              privacyStats.professionalContacts++;
              break;
            case this.privacyLevels.PUBLIC:
              privacyStats.publicContacts++;
              break;
          }

          if (privacy.context === this.contextTypes.MIXED) {
            privacyStats.mixedContextContacts++;
          }
        } else {
          privacyStats.privateContacts++; // Default to private
        }

        // Count tag privacy settings
        if (contact.tagPrivacy) {
          for (const [tagName, tagPrivacy] of contact.tagPrivacy) {
            switch (tagPrivacy.level) {
              case this.privacyLevels.PRIVATE:
                tagPrivacyStats.privateTags++;
                break;
              case this.privacyLevels.PUBLIC:
                tagPrivacyStats.publicTags++;
                break;
              default:
                tagPrivacyStats.sharedTags++;
            }
          }
        }
      });

      return {
        success: true,
        privacyStats: privacyStats,
        tagPrivacyStats: tagPrivacyStats,
        recommendations: [
          'Keep sensitive personal info private',
          'Use professional context for work contacts',
          'Review tag privacy settings regularly',
          'Consider mixed context for versatile contacts'
        ]
      };

    } catch (error) {
      logger.error('Failed to get privacy dashboard', {
        userId: userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Bulk update privacy settings for multiple contacts
   * @param {string} userId - User ID
   * @param {Array} updates - Array of {contactId, privacyLevel, context}
   * @returns {Object} Bulk update results
   */
  async bulkUpdatePrivacy(userId, updates) {
    try {
      const results = {
        successful: 0,
        failed: 0,
        errors: []
      };

      for (const update of updates) {
        try {
          await this.setContactPrivacy(
            update.contactId, 
            userId, 
            update.privacyLevel, 
            update.context
          );
          results.successful++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            contactId: update.contactId,
            error: error.message
          });
        }
      }

      logger.info('Bulk privacy update completed', {
        userId: userId,
        successful: results.successful,
        failed: results.failed
      });

      return {
        success: true,
        results: results
      };

    } catch (error) {
      logger.error('Bulk privacy update failed', {
        userId: userId,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new PrivacyControlService();