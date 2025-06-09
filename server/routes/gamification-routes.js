/**
 * Gamification Routes - Data Validation Game Engine
 * 
 * HIGH-LEVEL FUNCTION: Converts data conflicts between Facebook and LinkedIn
 * into engaging validation games that improve contact data accuracy
 * 
 * CORE ENDPOINTS:
 * 1. CONFLICT DISCOVERY: Find conflicts for a specific contact or user's contacts
 * 2. VALIDATION GAMES: Present conflicts as multiple choice questions
 * 3. ANSWER SUBMISSION: Process user validation choices and update contact data
 * 4. PROGRESS TRACKING: Track user validation scores and achievements
 * 5. LEADERBOARDS: Show top validators and accuracy improvements
 */

const express = require('express');
const router = express.Router();
const dataConflictDetectionService = require('../services/data-conflict-detection-service');
const Contact = require('../models/Contact');
const logger = require('../../utils/logger');

/**
 * Get validation conflicts for a contact
 * GET /api/gamification/conflicts/:contactId
 */
router.get('/conflicts/:contactId', async (req, res) => {
  try {
    const { contactId } = req.params;
    
    const contact = await Contact.findById(contactId);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Only detect conflicts if both Facebook and LinkedIn data exist
    if (!contact.facebookData || !contact.linkedinData) {
      return res.json({
        success: true,
        message: 'No conflicts to validate - requires both Facebook and LinkedIn data',
        data: {
          conflicts: [],
          hasConflicts: false,
          validationOpportunities: 0
        }
      });
    }

    // Detect conflicts between Facebook and LinkedIn data
    const conflicts = dataConflictDetectionService.detectAllConflicts(
      contact.facebookData,
      contact.linkedinData,
      contact.name
    );

    // Generate validation questions
    const validationQuestions = conflicts.map(conflict => 
      dataConflictDetectionService.generateValidationQuestion(conflict)
    );

    res.json({
      success: true,
      message: 'Validation conflicts identified',
      data: {
        contactId: contactId,
        contactName: contact.name,
        conflicts: validationQuestions,
        hasConflicts: conflicts.length > 0,
        validationOpportunities: conflicts.length,
        totalPossiblePoints: conflicts.reduce((sum, c) => sum + (c.validationReward || 0), 0)
      }
    });

  } catch (error) {
    logger.error('Failed to get validation conflicts', {
      contactId: req.params.contactId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve validation conflicts',
      error: error.message
    });
  }
});

/**
 * Get validation conflicts for all contacts of a user
 * GET /api/gamification/user-conflicts/:userId
 */
router.get('/user-conflicts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    // Find contacts with both Facebook and LinkedIn data
    const contacts = await Contact.find({
      userId: userId,
      facebookData: { $exists: true, $ne: null },
      linkedinData: { $exists: true, $ne: null }
    }).limit(parseInt(limit));

    const allConflicts = [];
    let totalPoints = 0;

    for (const contact of contacts) {
      const conflicts = dataConflictDetectionService.detectAllConflicts(
        contact.facebookData,
        contact.linkedinData,
        contact.name
      );

      if (conflicts.length > 0) {
        const validationQuestions = conflicts.map(conflict => 
          dataConflictDetectionService.generateValidationQuestion(conflict)
        );

        allConflicts.push({
          contactId: contact._id,
          contactName: contact.name,
          conflicts: validationQuestions,
          conflictCount: conflicts.length,
          possiblePoints: conflicts.reduce((sum, c) => sum + (c.validationReward || 0), 0)
        });

        totalPoints += conflicts.reduce((sum, c) => sum + (c.validationReward || 0), 0);
      }
    }

    // Sort by most validation opportunities first
    allConflicts.sort((a, b) => b.conflictCount - a.conflictCount);

    res.json({
      success: true,
      message: 'User validation opportunities identified',
      data: {
        userId: userId,
        contactsWithConflicts: allConflicts,
        summary: {
          totalContacts: contacts.length,
          contactsWithConflicts: allConflicts.length,
          totalValidationOpportunities: allConflicts.reduce((sum, c) => sum + c.conflictCount, 0),
          totalPossiblePoints: totalPoints
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get user validation conflicts', {
      userId: req.params.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user validation conflicts',
      error: error.message
    });
  }
});

/**
 * Submit validation answer for a conflict
 * POST /api/gamification/validate
 */
router.post('/validate', async (req, res) => {
  try {
    const { 
      contactId, 
      questionId, 
      selectedOptionId, 
      userFeedback,
      userId 
    } = req.body;

    if (!contactId || !questionId || selectedOptionId === undefined) {
      return res.status(400).json({
        success: false,
        message: 'contactId, questionId, and selectedOptionId required'
      });
    }

    const contact = await Contact.findById(contactId);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Re-detect conflicts to find the specific question
    const conflicts = dataConflictDetectionService.detectAllConflicts(
      contact.facebookData,
      contact.linkedinData,
      contact.name
    );

    const validationQuestions = conflicts.map(conflict => 
      dataConflictDetectionService.generateValidationQuestion(conflict)
    );

    const question = validationQuestions.find(q => q.id === questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Validation question not found'
      });
    }

    const selectedOption = question.options[selectedOptionId];
    if (!selectedOption) {
      return res.status(400).json({
        success: false,
        message: 'Invalid option selected'
      });
    }

    // Update contact data based on validation
    const validationResult = await this.applyValidationResult(
      contact, 
      question, 
      selectedOption, 
      userFeedback
    );

    // Track validation history
    if (!contact.validationHistory) {
      contact.validationHistory = [];
    }

    contact.validationHistory.push({
      questionId: questionId,
      questionType: question.category,
      selectedOption: selectedOption.text,
      selectedSource: selectedOption.source,
      confidence: selectedOption.confidence,
      pointsEarned: question.points,
      validatedBy: userId,
      validatedAt: new Date(),
      userFeedback: userFeedback
    });

    await contact.save();

    logger.info('Validation completed successfully', {
      contactId: contactId,
      questionId: questionId,
      selectedSource: selectedOption.source,
      pointsEarned: question.points
    });

    res.json({
      success: true,
      message: 'Validation completed successfully',
      data: {
        contactId: contactId,
        questionId: questionId,
        selectedOption: selectedOption,
        pointsEarned: question.points,
        validationResult: validationResult,
        updatedFields: validationResult.updatedFields
      }
    });

  } catch (error) {
    logger.error('Validation submission failed', {
      contactId: req.body.contactId,
      questionId: req.body.questionId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to process validation',
      error: error.message
    });
  }
});

/**
 * Apply validation result to contact data
 * @param {Object} contact - Contact document
 * @param {Object} question - Validation question
 * @param {Object} selectedOption - User's selected option
 * @param {string} userFeedback - Optional user feedback
 * @returns {Object} Validation result
 */
async function applyValidationResult(contact, question, selectedOption, userFeedback) {
  const updatedFields = [];
  
  // Update priority data based on validation
  if (!contact.priorityData) {
    contact.priorityData = {
      location: { current: '', hometown: '', workLocations: [] },
      employment: { current: {}, history: [] },
      education: { schools: [], degrees: [], certifications: [] },
      social: { hobbies: [], interests: [], topicsLiked: [], memberships: [], connectionCount: {} }
    };
  }

  // Apply updates based on question category
  switch (question.category) {
    case 'professional':
      if (question.type === 'employment_company') {
        contact.priorityData.employment.current.employer = selectedOption.value;
        contact.priorityData.employment.current.source = selectedOption.source;
        updatedFields.push('current_employer');
      } else if (question.type === 'employment_title') {
        contact.priorityData.employment.current.jobFunction = selectedOption.value;
        contact.priorityData.employment.current.titleSource = selectedOption.source;
        updatedFields.push('current_title');
      }
      break;

    case 'location':
      if (question.type === 'location_current') {
        contact.priorityData.location.current = selectedOption.value;
        contact.priorityData.location.currentSource = selectedOption.source;
        updatedFields.push('current_location');
      }
      break;

    case 'education':
      if (question.type === 'education_school') {
        // Update education schools list
        const schools = selectedOption.value.split(', ').map(school => ({
          name: school,
          source: selectedOption.source
        }));
        contact.priorityData.education.schools = schools;
        updatedFields.push('education_schools');
      }
      break;

    case 'personal':
      if (question.type === 'contact_info' && selectedOption.value) {
        contact.name = selectedOption.value;
        updatedFields.push('contact_name');
      }
      break;
  }

  // Add data source tracking
  if (!contact.dataSourceValidation) {
    contact.dataSourceValidation = {};
  }
  
  contact.dataSourceValidation[question.field] = {
    validatedValue: selectedOption.value,
    chosenSource: selectedOption.source,
    confidence: selectedOption.confidence,
    validatedAt: new Date(),
    userFeedback: userFeedback
  };

  return {
    success: true,
    updatedFields: updatedFields,
    chosenSource: selectedOption.source,
    confidence: selectedOption.confidence
  };
}

/**
 * Get user validation statistics
 * GET /api/gamification/stats/:userId
 */
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get all contacts for user with validation history
    const contacts = await Contact.find({
      userId: userId,
      validationHistory: { $exists: true, $ne: [] }
    });

    let totalValidations = 0;
    let totalPointsEarned = 0;
    let accuracyScore = 0;
    const validationsByCategory = {};

    contacts.forEach(contact => {
      if (contact.validationHistory) {
        contact.validationHistory.forEach(validation => {
          totalValidations++;
          totalPointsEarned += validation.pointsEarned || 0;
          
          const category = validation.questionType || 'general';
          if (!validationsByCategory[category]) {
            validationsByCategory[category] = 0;
          }
          validationsByCategory[category]++;
        });
      }
    });

    // Calculate accuracy based on high-confidence choices
    const highConfidenceValidations = contacts.reduce((count, contact) => {
      return count + (contact.validationHistory || []).filter(v => v.confidence > 0.8).length;
    }, 0);

    accuracyScore = totalValidations > 0 ? (highConfidenceValidations / totalValidations) * 100 : 0;

    res.json({
      success: true,
      message: 'User validation statistics retrieved',
      data: {
        userId: userId,
        stats: {
          totalValidations: totalValidations,
          totalPointsEarned: totalPointsEarned,
          accuracyScore: Math.round(accuracyScore),
          validationsByCategory: validationsByCategory,
          contactsImproved: contacts.length,
          averagePointsPerValidation: totalValidations > 0 ? Math.round(totalPointsEarned / totalValidations) : 0
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get validation statistics', {
      userId: req.params.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve validation statistics',
      error: error.message
    });
  }
});

/**
 * Test conflict detection with sample data
 * POST /api/gamification/test-conflicts
 */
router.post('/test-conflicts', async (req, res) => {
  try {
    const { sampleFacebookData, sampleLinkedinData } = req.body;

    // Use provided data or create sample conflicting data
    const fbData = sampleFacebookData || {
      name: "John Smith",
      location: { name: "Austin, TX" },
      work: { data: [{ employer: { name: "Google" }, position: { name: "Software Engineer" } }] }
    };

    const liData = sampleLinkedinData || {
      firstName: "John",
      lastName: "Smith", 
      location: { name: "San Francisco, CA" },
      positions: { values: [{ title: "Senior Developer", company: { name: "Meta" }, isCurrent: true }] }
    };

    // Detect conflicts
    const conflicts = dataConflictDetectionService.detectAllConflicts(fbData, liData, "John Smith");
    
    // Generate validation questions
    const validationQuestions = conflicts.map(conflict => 
      dataConflictDetectionService.generateValidationQuestion(conflict)
    );

    res.json({
      success: true,
      message: 'Conflict detection test completed',
      data: {
        sampleData: { facebook: fbData, linkedin: liData },
        conflicts: validationQuestions,
        conflictCount: conflicts.length,
        totalPossiblePoints: conflicts.reduce((sum, c) => sum + (c.validationReward || 0), 0)
      }
    });

  } catch (error) {
    logger.error('Conflict detection test failed', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Conflict detection test failed',
      error: error.message
    });
  }
});

module.exports = router;