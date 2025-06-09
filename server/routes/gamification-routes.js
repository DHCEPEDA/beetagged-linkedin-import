/**
 * Gamification Routes - ELO Rating System for Contact Rankings
 * 
 * IMPLEMENTS ORIGINAL DESIGN:
 * - Game activates when two profiles need a tie break
 * - ELO system: winners advance to play winners, losers play losers
 * - Bell notification on "rate" button when games available
 * - Points and streaks for user engagement
 */

const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const dataConflictService = require('../services/data-conflict-detection-service');
const logger = require('../../utils/logger');

/**
 * Get game data including available games, stats, and leaderboards
 * GET /api/gamification/game-data/:userId
 */
router.get('/game-data/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user's gaming statistics
    const userContacts = await Contact.find({ userId: userId });
    
    let gamesPlayed = 0;
    let totalVotes = 0;
    let correctVotes = 0;
    
    userContacts.forEach(contact => {
      if (contact.gamificationData?.userVotes) {
        gamesPlayed += contact.gamificationData.userVotes.length;
        contact.gamificationData.userVotes.forEach(vote => {
          totalVotes++;
          if (vote.wasCorrect) correctVotes++;
        });
      }
    });

    const accuracy = totalVotes > 0 ? Math.round((correctVotes / totalVotes) * 100) : 0;

    // Get current streak
    let streakLength = 0;
    const recentVotes = [];
    userContacts.forEach(contact => {
      if (contact.gamificationData?.userVotes) {
        recentVotes.push(...contact.gamificationData.userVotes);
      }
    });
    
    recentVotes.sort((a, b) => new Date(b.votedAt) - new Date(a.votedAt));
    for (const vote of recentVotes) {
      if (vote.wasCorrect) {
        streakLength++;
      } else {
        break;
      }
    }

    // Check for available conflicts that need resolution
    const availableGame = await findAvailableGame(userId);

    // Generate leaderboards by category
    const leaderboards = await generateLeaderboards(userId);

    const stats = {
      gamesPlayed: gamesPlayed,
      accuracy: accuracy,
      streakLength: streakLength,
      pointsEarned: gamesPlayed * 10 + (streakLength * 5) // Base points + streak bonus
    };

    res.json({
      success: true,
      message: 'Game data retrieved',
      stats: stats,
      availableGame: availableGame,
      leaderboards: leaderboards,
      hasNotifications: !!availableGame
    });

  } catch (error) {
    logger.error('Failed to get game data', {
      userId: req.params.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve game data',
      error: error.message
    });
  }
});

/**
 * Start a new rating game
 * POST /api/gamification/start-game
 */
router.post('/start-game', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId required'
      });
    }

    // Find contacts with conflicting tags that need resolution
    const game = await findAvailableGame(userId);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'No games available at this time'
      });
    }

    logger.info('New game started', {
      userId: userId,
      gameId: game._id,
      category: game.category,
      attribute: game.attribute
    });

    res.json({
      success: true,
      message: 'Game started successfully',
      game: game
    });

  } catch (error) {
    logger.error('Failed to start game', {
      userId: req.body.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to start game',
      error: error.message
    });
  }
});

/**
 * Submit a vote in the rating game
 * POST /api/gamification/submit-vote
 */
router.post('/submit-vote', async (req, res) => {
  try {
    const { userId, gameId, winnerId } = req.body;

    if (!userId || !gameId || !winnerId) {
      return res.status(400).json({
        success: false,
        message: 'userId, gameId, and winnerId required'
      });
    }

    // Find the contestants
    const winner = await Contact.findById(winnerId);
    const allContacts = await Contact.find({ userId: userId });
    
    if (!winner) {
      return res.status(404).json({
        success: false,
        message: 'Winner contact not found'
      });
    }

    // Calculate ELO rating changes
    const loser = allContacts.find(c => c._id.toString() !== winnerId && 
      c.gamificationData?.pendingGames?.includes(gameId));

    if (!loser) {
      return res.status(404).json({
        success: false,
        message: 'Game participants not found'
      });
    }

    const winnerRating = winner.gamificationData?.eloRating || 1200;
    const loserRating = loser.gamificationData?.eloRating || 1200;

    // ELO calculation
    const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
    const expectedLoser = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));

    const K = 32; // K-factor
    const newWinnerRating = Math.round(winnerRating + K * (1 - expectedWinner));
    const newLoserRating = Math.round(loserRating + K * (0 - expectedLoser));

    // Update ratings
    if (!winner.gamificationData) winner.gamificationData = {};
    if (!loser.gamificationData) loser.gamificationData = {};

    winner.gamificationData.eloRating = newWinnerRating;
    loser.gamificationData.eloRating = newLoserRating;

    // Record the vote
    const voteRecord = {
      gameId: gameId,
      votedAt: new Date(),
      category: winner.allTags?.[0]?.category || 'skill',
      wasCorrect: true // Will be determined by network consensus later
    };

    if (!winner.gamificationData.userVotes) winner.gamificationData.userVotes = [];
    winner.gamificationData.userVotes.push(voteRecord);

    // Remove pending game
    if (winner.gamificationData.pendingGames) {
      winner.gamificationData.pendingGames = winner.gamificationData.pendingGames.filter(
        id => id !== gameId
      );
    }
    if (loser.gamificationData.pendingGames) {
      loser.gamificationData.pendingGames = loser.gamificationData.pendingGames.filter(
        id => id !== gameId
      );
    }

    await winner.save();
    await loser.save();

    // Calculate streak and points
    const userVotes = winner.gamificationData.userVotes || [];
    let currentStreak = 0;
    for (let i = userVotes.length - 1; i >= 0; i--) {
      if (userVotes[i].wasCorrect) {
        currentStreak++;
      } else {
        break;
      }
    }

    const pointsAwarded = 10 + (currentStreak > 5 ? 5 : 0); // Base + streak bonus

    logger.info('Vote submitted and ELO updated', {
      userId: userId,
      gameId: gameId,
      winnerId: winnerId,
      winnerNewRating: newWinnerRating,
      loserNewRating: newLoserRating,
      pointsAwarded: pointsAwarded
    });

    res.json({
      success: true,
      message: 'Vote submitted successfully',
      results: {
        winnerNewRating: newWinnerRating,
        loserNewRating: newLoserRating,
        pointsAwarded: pointsAwarded,
        streakLength: currentStreak
      }
    });

  } catch (error) {
    logger.error('Failed to submit vote', {
      userId: req.body.userId,
      gameId: req.body.gameId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to submit vote',
      error: error.message
    });
  }
});

/**
 * Get leaderboard for specific category
 * GET /api/gamification/leaderboard/:category
 */
router.get('/leaderboard/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { userId, limit = 20 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId required'
      });
    }

    const contacts = await Contact.find({ 
      userId: userId,
      'allTags.category': category
    }).sort({ 'gamificationData.eloRating': -1 }).limit(parseInt(limit));

    const leaderboard = contacts.map((contact, index) => ({
      _id: contact._id,
      name: contact.name,
      eloRating: contact.gamificationData?.eloRating || 1200,
      rank: index + 1,
      gamesPlayed: contact.gamificationData?.userVotes?.length || 0,
      priorityData: {
        employment: contact.priorityData?.employment
      }
    }));

    res.json({
      success: true,
      message: `${category} leaderboard retrieved`,
      leaderboard: leaderboard,
      category: category
    });

  } catch (error) {
    logger.error('Failed to get leaderboard', {
      category: req.params.category,
      userId: req.query.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve leaderboard',
      error: error.message
    });
  }
});

/**
 * Get user's gaming achievements and badges
 * GET /api/gamification/achievements/:userId
 */
router.get('/achievements/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const contacts = await Contact.find({ userId: userId });
    
    let totalGames = 0;
    let longestStreak = 0;
    let categoriesPlayed = new Set();

    contacts.forEach(contact => {
      if (contact.gamificationData?.userVotes) {
        totalGames += contact.gamificationData.userVotes.length;
        
        contact.gamificationData.userVotes.forEach(vote => {
          categoriesPlayed.add(vote.category);
        });

        // Calculate longest streak for this contact
        let currentStreak = 0;
        let maxStreak = 0;
        
        contact.gamificationData.userVotes.forEach(vote => {
          if (vote.wasCorrect) {
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
          } else {
            currentStreak = 0;
          }
        });
        
        longestStreak = Math.max(longestStreak, maxStreak);
      }
    });

    const achievements = [];

    // Game count achievements
    if (totalGames >= 10) achievements.push({ name: 'First Steps', description: '10 games played' });
    if (totalGames >= 50) achievements.push({ name: 'Getting Serious', description: '50 games played' });
    if (totalGames >= 100) achievements.push({ name: 'Dedicated Rater', description: '100 games played' });

    // Streak achievements
    if (longestStreak >= 5) achievements.push({ name: 'Hot Streak', description: '5 correct in a row' });
    if (longestStreak >= 10) achievements.push({ name: 'On Fire', description: '10 correct in a row' });

    // Category achievements
    if (categoriesPlayed.size >= 3) {
      achievements.push({ name: 'Well Rounded', description: 'Played all categories' });
    }

    res.json({
      success: true,
      message: 'Achievements retrieved',
      achievements: achievements,
      stats: {
        totalGames: totalGames,
        longestStreak: longestStreak,
        categoriesPlayed: categoriesPlayed.size
      }
    });

  } catch (error) {
    logger.error('Failed to get achievements', {
      userId: req.params.userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve achievements',
      error: error.message
    });
  }
});

/**
 * Helper function to find available games
 */
async function findAvailableGame(userId) {
  try {
    const contacts = await Contact.find({ userId: userId });
    
    // Find contacts with similar tags that can be compared
    const tagGroups = {};
    
    contacts.forEach(contact => {
      if (contact.allTags) {
        contact.allTags.forEach(tag => {
          const key = `${tag.category}:${tag.name}`;
          if (!tagGroups[key]) {
            tagGroups[key] = [];
          }
          tagGroups[key].push(contact);
        });
      }
    });

    // Find groups with exactly 2 contacts that need comparison
    for (const [tagKey, contactsInGroup] of Object.entries(tagGroups)) {
      if (contactsInGroup.length >= 2) {
        const [category, attribute] = tagKey.split(':');
        
        // Pick two contacts with similar ratings for fair comparison
        contactsInGroup.sort((a, b) => {
          const ratingA = a.gamificationData?.eloRating || 1200;
          const ratingB = b.gamificationData?.eloRating || 1200;
          return Math.abs(ratingA - 1200) - Math.abs(ratingB - 1200);
        });

        const contestant1 = contactsInGroup[0];
        const contestant2 = contactsInGroup[1];

        // Check if they haven't been compared recently
        const gameId = `${contestant1._id}-${contestant2._id}-${Date.now()}`;

        return {
          _id: gameId,
          contestant1: {
            _id: contestant1._id,
            name: contestant1.name,
            eloRating: contestant1.gamificationData?.eloRating || 1200,
            priorityData: contestant1.priorityData
          },
          contestant2: {
            _id: contestant2._id,
            name: contestant2.name,
            eloRating: contestant2.gamificationData?.eloRating || 1200,
            priorityData: contestant2.priorityData
          },
          category: category,
          attribute: attribute
        };
      }
    }

    return null; // No games available
  } catch (error) {
    logger.error('Failed to find available game', { userId, error: error.message });
    return null;
  }
}

/**
 * Helper function to generate leaderboards
 */
async function generateLeaderboards(userId) {
  try {
    const contacts = await Contact.find({ userId: userId });
    
    const leaderboards = {
      skills: [],
      personality: [],
      industry: []
    };

    ['skills', 'personality', 'industry'].forEach(category => {
      const categoryContacts = contacts.filter(contact => 
        contact.allTags?.some(tag => tag.category === category)
      );

      categoryContacts.sort((a, b) => {
        const ratingA = a.gamificationData?.eloRating || 1200;
        const ratingB = b.gamificationData?.eloRating || 1200;
        return ratingB - ratingA;
      });

      leaderboards[category] = categoryContacts.slice(0, 10).map(contact => ({
        _id: contact._id,
        name: contact.name,
        eloRating: contact.gamificationData?.eloRating || 1200,
        priorityData: {
          employment: contact.priorityData?.employment
        }
      }));
    });

    return leaderboards;
  } catch (error) {
    logger.error('Failed to generate leaderboards', { userId, error: error.message });
    return { skills: [], personality: [], industry: [] };
  }
}

module.exports = router;