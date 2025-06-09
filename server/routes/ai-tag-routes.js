/**
 * AI Tag Suggestion Routes - Intelligent Contact Tagging API
 * 
 * HIGH-LEVEL FUNCTION: Provides API endpoints for AI-powered tag generation
 * that analyzes contact profiles and suggests contextual tags for networking
 * 
 * CORE ENDPOINTS:
 * 1. INDIVIDUAL ANALYSIS: Generate tags for a single contact profile
 * 2. BATCH PROCESSING: Analyze multiple contacts efficiently
 * 3. TAG VALIDATION: Validate and refine existing tags
 * 4. SUGGESTION FEEDBACK: Learn from user acceptance/rejection of suggestions
 * 
 * AI INTEGRATION:
 * - Uses OpenAI GPT-4o for deep profile analysis
 * - Generates tags based on professional networking value
 * - Learns from user behavior to improve suggestions
 * - Handles rate limiting and error recovery
 */

const express = require('express');
const router = express.Router();
const aiTagSuggestionService = require('../services/ai-tag-suggestion-service');
const Contact = require('../models/Contact');
const logger = require('../../utils/logger');

/**
 * Generate AI tag suggestions for a contact
 * POST /api/ai-tags/suggest
 */
router.post('/suggest', async (req, res) => {
  try {
    const { contactId, contactData } = req.body;

    let contact;
    if (contactId) {
      // Get contact from database
      contact = await Contact.findById(contactId);
      if (!contact) {
        return res.status(404).json({
          success: false,
          message: 'Contact not found'
        });
      }
    } else if (contactData) {
      // Use provided contact data
      contact = contactData;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either contactId or contactData required'
      });
    }

    // Generate AI tag suggestions
    const suggestions = await aiTagSuggestionService.generateTagSuggestions(contact);

    // Log successful generation
    logger.info('AI tag suggestions generated', {
      contactId: contactId || 'provided_data',
      contactName: contact.name,
      suggestionCount: suggestions.suggestedTags.length,
      confidence: suggestions.confidence
    });

    res.json({
      success: true,
      message: 'AI tag suggestions generated successfully',
      data: {
        contactId: contactId,
        contactName: contact.name,
        suggestions: suggestions,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('AI tag suggestion failed', {
      contactId: req.body.contactId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to generate AI tag suggestions',
      error: error.message
    });
  }
});

/**
 * Batch generate AI tag suggestions for multiple contacts
 * POST /api/ai-tags/batch-suggest
 */
router.post('/batch-suggest', async (req, res) => {
  try {
    const { contactIds, userId, limit = 10 } = req.body;

    if (!contactIds || !Array.isArray(contactIds)) {
      return res.status(400).json({
        success: false,
        message: 'contactIds array required'
      });
    }

    if (contactIds.length > limit) {
      return res.status(400).json({
        success: false,
        message: `Batch size limited to ${limit} contacts`
      });
    }

    // Get contacts from database
    const contacts = await Contact.find({
      _id: { $in: contactIds },
      ...(userId && { userId: userId })
    });

    if (contacts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No contacts found'
      });
    }

    // Generate batch suggestions
    const batchResults = await aiTagSuggestionService.batchGenerateTagSuggestions(contacts);

    // Process results
    const successfulResults = batchResults.filter(result => !result.error);
    const failedResults = batchResults.filter(result => result.error);

    logger.info('Batch AI tag suggestions completed', {
      totalRequested: contactIds.length,
      successful: successfulResults.length,
      failed: failedResults.length
    });

    res.json({
      success: true,
      message: 'Batch AI tag suggestions completed',
      data: {
        successful: successfulResults,
        failed: failedResults,
        summary: {
          totalRequested: contactIds.length,
          successfulCount: successfulResults.length,
          failedCount: failedResults.length
        }
      }
    });

  } catch (error) {
    logger.error('Batch AI tag suggestion failed', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to generate batch AI tag suggestions',
      error: error.message
    });
  }
});

/**
 * Apply AI suggested tags to a contact
 * POST /api/ai-tags/apply
 */
router.post('/apply', async (req, res) => {
  try {
    const { contactId, selectedTags, userId } = req.body;

    if (!contactId || !selectedTags || !Array.isArray(selectedTags)) {
      return res.status(400).json({
        success: false,
        message: 'contactId and selectedTags array required'
      });
    }

    // Get contact from database
    const contact = await Contact.findById(contactId);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Validate user ownership if userId provided
    if (userId && contact.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to modify this contact'
      });
    }

    // Process selected tags
    const tagsToAdd = selectedTags.map(tag => ({
      name: tag.name,
      category: tag.category || 'ai_suggested',
      confidence: tag.confidence || 0.8,
      source: 'ai_suggestion',
      appliedAt: new Date(),
      appliedBy: userId || 'system'
    }));

    // Add tags to contact
    const existingTagNames = (contact.allTags || []).map(tag => tag.name);
    const newTags = tagsToAdd.filter(tag => !existingTagNames.includes(tag.name));

    if (newTags.length > 0) {
      contact.allTags = [...(contact.allTags || []), ...newTags];
      contact.lastAITagged = new Date();
      await contact.save();
    }

    logger.info('AI suggested tags applied to contact', {
      contactId: contactId,
      contactName: contact.name,
      tagsApplied: newTags.length,
      totalTags: contact.allTags.length
    });

    res.json({
      success: true,
      message: 'AI suggested tags applied successfully',
      data: {
        contactId: contactId,
        tagsApplied: newTags.length,
        totalTags: contact.allTags.length,
        newTags: newTags
      }
    });

  } catch (error) {
    logger.error('Failed to apply AI suggested tags', {
      contactId: req.body.contactId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to apply AI suggested tags',
      error: error.message
    });
  }
});

/**
 * Get AI tag suggestion history for a contact
 * GET /api/ai-tags/history/:contactId
 */
router.get('/history/:contactId', async (req, res) => {
  try {
    const { contactId } = req.params;

    const contact = await Contact.findById(contactId);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Extract AI-generated tags from contact
    const aiTags = (contact.allTags || []).filter(tag => 
      tag.source === 'ai_suggestion' || tag.source === 'ai_analysis'
    );

    res.json({
      success: true,
      message: 'AI tag history retrieved successfully',
      data: {
        contactId: contactId,
        contactName: contact.name,
        aiTags: aiTags,
        lastAITagged: contact.lastAITagged,
        totalAITags: aiTags.length
      }
    });

  } catch (error) {
    logger.error('Failed to get AI tag history', {
      contactId: req.params.contactId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve AI tag history',
      error: error.message
    });
  }
});

/**
 * Validate and improve existing tags using AI
 * POST /api/ai-tags/validate
 */
router.post('/validate', async (req, res) => {
  try {
    const { contactId, existingTags } = req.body;

    if (!contactId) {
      return res.status(400).json({
        success: false,
        message: 'contactId required'
      });
    }

    const contact = await Contact.findById(contactId);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Generate fresh AI suggestions
    const suggestions = await aiTagSuggestionService.generateTagSuggestions(contact);

    // Compare with existing tags
    const currentTags = existingTags || contact.allTags || [];
    const currentTagNames = currentTags.map(tag => tag.name || tag).map(name => name.toLowerCase());
    
    const validation = {
      confirmedTags: [],
      improvedTags: [],
      newSuggestions: [],
      removeSuggestions: []
    };

    // Analyze suggestions against current tags
    for (const suggestion of suggestions.suggestedTags) {
      const suggestedName = suggestion.name.toLowerCase();
      
      if (currentTagNames.includes(suggestedName)) {
        validation.confirmedTags.push({
          ...suggestion,
          status: 'confirmed',
          reasoning: 'AI confirms this tag is valuable'
        });
      } else {
        validation.newSuggestions.push({
          ...suggestion,
          status: 'new_suggestion'
        });
      }
    }

    // Identify potentially outdated tags
    for (const currentTag of currentTags) {
      const currentName = (currentTag.name || currentTag).toLowerCase();
      const isConfirmed = suggestions.suggestedTags.some(s => 
        s.name.toLowerCase() === currentName
      );
      
      if (!isConfirmed && currentTag.source !== 'manual') {
        validation.removeSuggestions.push({
          name: currentTag.name || currentTag,
          status: 'consider_removal',
          reasoning: 'AI suggests this tag may be outdated or less relevant'
        });
      }
    }

    res.json({
      success: true,
      message: 'Tag validation completed',
      data: {
        contactId: contactId,
        validation: validation,
        summary: {
          confirmedTags: validation.confirmedTags.length,
          newSuggestions: validation.newSuggestions.length,
          removeSuggestions: validation.removeSuggestions.length
        }
      }
    });

  } catch (error) {
    logger.error('Tag validation failed', {
      contactId: req.body.contactId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to validate tags',
      error: error.message
    });
  }
});

/**
 * Test AI tag suggestion service
 * POST /api/ai-tags/test
 */
router.post('/test', async (req, res) => {
  try {
    const { testProfile } = req.body;

    // Use provided test profile or create a sample one
    const sampleProfile = testProfile || {
      name: "Test Professional",
      priorityData: {
        location: {
          current: "San Francisco, CA"
        },
        employment: {
          current: {
            employer: "Tech Corp",
            jobFunction: "Software Engineer"
          },
          history: [
            {
              employer: "Startup Inc",
              jobFunction: "Junior Developer",
              startYear: 2020,
              endYear: 2022
            }
          ]
        },
        education: {
          schools: [
            {
              name: "UC Berkeley",
              type: "University"
            }
          ]
        }
      },
      linkedinData: {
        headline: "Senior Software Engineer at Tech Corp",
        skills: {
          values: [
            { skill: { name: "JavaScript" }, endorsements: { total: 25 } },
            { skill: { name: "React" }, endorsements: { total: 18 } }
          ]
        }
      }
    };

    // Generate test suggestions
    const suggestions = await aiTagSuggestionService.generateTagSuggestions(sampleProfile);

    res.json({
      success: true,
      message: 'AI tag suggestion test completed',
      data: {
        testProfile: sampleProfile,
        suggestions: suggestions,
        serviceStatus: {
          openaiConfigured: !!process.env.OPENAI_API_KEY,
          suggestionsGenerated: suggestions.suggestedTags.length > 0,
          confidence: suggestions.confidence
        }
      }
    });

  } catch (error) {
    logger.error('AI tag suggestion test failed', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'AI tag suggestion test failed',
      error: error.message,
      troubleshooting: {
        checkOpenAI: 'Verify OPENAI_API_KEY is configured',
        checkConnection: 'Ensure internet connectivity to OpenAI API',
        checkQuota: 'Verify OpenAI API usage limits'
      }
    });
  }
});

module.exports = router;