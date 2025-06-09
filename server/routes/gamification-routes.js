/**
 * Gamification Routes
 * API endpoints for tag validation game and ranking system
 */

const express = require('express');
const router = express.Router();
const tagGamificationService = require('../services/tag-gamification-service');
const Contact = require('../models/Contact');
const logger = require('../../utils/logger');

/**
 * Get a comparative question for tag validation
 * GET /api/gamification/question
 */
router.get('/question', async (req, res) => {
  try {
    const { userId, category } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const questionResult = await tagGamificationService.generateComparativeQuestion(
      userId,
      { category: category || null }
    );

    if (!questionResult.success) {
      return res.status(404).json(questionResult);
    }

    res.json({
      success: true,
      data: questionResult.question
    });

  } catch (error) {
    logger.error('Failed to generate comparative question', {
      userId: req.query.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to generate question',
      error: error.message
    });
  }
});

/**
 * Submit answer to comparative question
 * POST /api/gamification/answer
 */
router.post('/answer', async (req, res) => {
  try {
    const { userId, questionId, selectedContactId, category, reasoning } = req.body;

    if (!userId || !questionId || !selectedContactId || !category) {
      return res.status(400).json({
        success: false,
        message: 'userId, questionId, selectedContactId, and category are required'
      });
    }

    // Process the answer and update rankings
    const result = await tagGamificationService.processComparativeAnswer(
      userId,
      questionId,
      selectedContactId,
      category
    );

    // Store user's reasoning for future ML training
    if (reasoning) {
      logger.info('User reasoning captured', {
        userId,
        questionId,
        selectedContactId,
        category,
        reasoning
      });
    }

    res.json({
      success: true,
      message: 'Answer processed successfully',
      data: {
        userScore: result.userScore,
        pointsEarned: 10 // Base points for answering
      }
    });

  } catch (error) {
    logger.error('Failed to process comparative answer', {
      userId: req.body.userId,
      questionId: req.body.questionId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to process answer',
      error: error.message
    });
  }
});

/**
 * Get user's gamification stats
 * GET /api/gamification/stats/:userId
 */
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user's gamification score
    const userScore = await tagGamificationService.calculateUserGamificationScore(userId);

    // Get validation statistics
    const validationStats = await Contact.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalContacts: { $sum: 1 },
          contactsWithValidatedTags: {
            $sum: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ["$tagRankings", {}] } }, 0] },
                1,
                0
              ]
            }
          },
          totalTagValidations: {
            $sum: { $size: { $objectToArray: { $ifNull: ["$tagRankings", {}] } } }
          }
        }
      }
    ]);

    const stats = validationStats.length > 0 ? validationStats[0] : {
      totalContacts: 0,
      contactsWithValidatedTags: 0,
      totalTagValidations: 0
    };

    // Calculate level based on score
    const level = Math.floor(userScore / 100) + 1;
    const nextLevelPoints = (level * 100) - userScore;

    res.json({
      success: true,
      data: {
        score: userScore,
        level: level,
        pointsToNextLevel: nextLevelPoints,
        totalContacts: stats.totalContacts,
        contactsWithValidatedTags: stats.contactsWithValidatedTags,
        totalTagValidations: stats.totalTagValidations,
        completionRate: stats.totalContacts > 0 
          ? (stats.contactsWithValidatedTags / stats.totalContacts * 100).toFixed(1)
          : 0
      }
    });

  } catch (error) {
    logger.error('Failed to get gamification stats', {
      userId: req.params.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get stats',
      error: error.message
    });
  }
});

/**
 * Get personalized contact rankings for search
 * POST /api/gamification/rankings
 */
router.post('/rankings', async (req, res) => {
  try {
    const { userId, category, contactIds } = req.body;

    if (!userId || !category || !contactIds || !Array.isArray(contactIds)) {
      return res.status(400).json({
        success: false,
        message: 'userId, category, and contactIds array are required'
      });
    }

    // Get contacts with their tag rankings
    const contacts = await Contact.find({
      userId: userId,
      _id: { $in: contactIds }
    });

    // Apply personalized rankings based on validated tags
    const rankedContacts = await tagGamificationService.getPersonalizedRankings(
      userId,
      category,
      contacts
    );

    res.json({
      success: true,
      data: {
        category: category,
        rankedContacts: rankedContacts.map(contact => ({
          id: contact._id,
          name: contact.name,
          ranking: contact.tagRankings?.[category] || 0,
          profilePictureUrl: contact.profilePictureUrl,
          company: contact.company,
          jobTitle: contact.jobTitle,
          location: contact.location
        }))
      }
    });

  } catch (error) {
    logger.error('Failed to get personalized rankings', {
      userId: req.body.userId,
      category: req.body.category,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get personalized rankings',
      error: error.message
    });
  }
});

/**
 * Get leaderboard for gamification
 * GET /api/gamification/leaderboard
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const { timeframe = 'all' } = req.query;

    // For MVP, we'll show top users by total tag validations
    const topUsers = await Contact.aggregate([
      {
        $group: {
          _id: "$userId",
          totalValidations: {
            $sum: { $size: { $objectToArray: { $ifNull: ["$tagRankings", {}] } } }
          },
          contactCount: { $sum: 1 }
        }
      },
      {
        $match: {
          totalValidations: { $gt: 0 }
        }
      },
      {
        $addFields: {
          score: { $multiply: ["$totalValidations", 10] }
        }
      },
      { $sort: { score: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        timeframe: timeframe,
        leaderboard: topUsers.map((user, index) => ({
          rank: index + 1,
          userId: user._id,
          score: user.score,
          totalValidations: user.totalValidations,
          contactCount: user.contactCount
        }))
      }
    });

  } catch (error) {
    logger.error('Failed to get leaderboard', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get leaderboard',
      error: error.message
    });
  }
});

/**
 * Skip a question (for questions that are too difficult or unclear)
 * POST /api/gamification/skip
 */
router.post('/skip', async (req, res) => {
  try {
    const { userId, questionId, reason } = req.body;

    if (!userId || !questionId) {
      return res.status(400).json({
        success: false,
        message: 'userId and questionId are required'
      });
    }

    // Log the skip for analytics
    logger.info('Question skipped', {
      userId,
      questionId,
      reason: reason || 'no_reason_provided'
    });

    // Generate a new question
    const newQuestionResult = await tagGamificationService.generateComparativeQuestion(userId);

    if (!newQuestionResult.success) {
      return res.status(404).json({
        success: false,
        message: 'No more questions available'
      });
    }

    res.json({
      success: true,
      message: 'Question skipped, new question generated',
      data: newQuestionResult.question
    });

  } catch (error) {
    logger.error('Failed to skip question', {
      userId: req.body.userId,
      questionId: req.body.questionId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to skip question',
      error: error.message
    });
  }
});

/**
 * Get available categories for tag validation
 * GET /api/gamification/categories/:userId
 */
router.get('/categories/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user's contacts to determine available categories
    const contacts = await Contact.find({ userId: userId });

    if (contacts.length === 0) {
      return res.json({
        success: true,
        data: {
          categories: [],
          message: 'No contacts available for gamification'
        }
      });
    }

    // Extract available categories from contacts
    const categories = tagGamificationService.extractTagCategories(contacts);

    // Add category metadata
    const categoryData = categories.map(category => ({
      id: category,
      name: this.formatCategoryName(category),
      description: this.getCategoryDescription(category),
      eligibleContacts: tagGamificationService.findContactsWithCategoryData(contacts, category).length
    }));

    res.json({
      success: true,
      data: {
        categories: categoryData,
        totalContacts: contacts.length
      }
    });

  } catch (error) {
    logger.error('Failed to get categories', {
      userId: req.params.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get categories',
      error: error.message
    });
  }
});

/**
 * Format category name for display
 * @param {string} category - Category ID
 * @returns {string} Formatted name
 */
function formatCategoryName(category) {
  const nameMap = {
    'poker_skill': 'Poker Skills',
    'programming_experience': 'Programming Experience',
    'location_knowledge': 'Local Knowledge',
    'professional_experience': 'Professional Experience',
    'industry_expertise': 'Industry Expertise',
    'education_background': 'Education Background'
  };

  return nameMap[category] || category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Get category description
 * @param {string} category - Category ID
 * @returns {string} Description
 */
function getCategoryDescription(category) {
  const descriptionMap = {
    'poker_skill': 'Compare poker playing abilities',
    'programming_experience': 'Compare programming and technical skills',
    'location_knowledge': 'Compare familiarity with specific locations',
    'professional_experience': 'Compare work experience and expertise',
    'industry_expertise': 'Compare knowledge within specific industries',
    'education_background': 'Compare educational achievements'
  };

  return descriptionMap[category] || `Compare ${category.replace(/_/g, ' ')} between contacts`;
}

module.exports = router;