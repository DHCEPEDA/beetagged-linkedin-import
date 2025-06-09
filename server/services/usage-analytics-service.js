/**
 * Usage Analytics Service
 * Tracks user behavior patterns to understand social vs professional search preferences
 */

const mongoose = require('mongoose');
const logger = require('../../utils/logger');

// Analytics event schema
const analyticsEventSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  eventType: { 
    type: String, 
    required: true,
    enum: ['search', 'contact_view', 'interaction', 'enrichment', 'gamification']
  },
  searchCategory: {
    type: String,
    enum: ['professional', 'social', 'location', 'interest', 'company', 'school', 'skill']
  },
  searchIntent: {
    type: String,
    enum: ['job_search', 'travel', 'networking', 'skill_help', 'social_meetup', 'alumni', 'dating']
  },
  query: String,
  resultsCount: Number,
  selectedContactId: String,
  userRole: {
    type: String,
    enum: ['student', 'professional', 'entrepreneur', 'job_seeker', 'executive', 'freelancer', 'other']
  },
  sessionId: String,
  deviceType: String,
  location: String,
  timestamp: { type: Date, default: Date.now },
  metadata: mongoose.Schema.Types.Mixed
});

analyticsEventSchema.index({ userId: 1, timestamp: -1 });
analyticsEventSchema.index({ searchCategory: 1, timestamp: -1 });
analyticsEventSchema.index({ userRole: 1, searchCategory: 1 });

const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);

// User behavior profile schema
const userBehaviorProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  detectedRole: {
    type: String,
    enum: ['student', 'professional', 'entrepreneur', 'job_seeker', 'executive', 'freelancer', 'other']
  },
  searchPatterns: {
    professionalSearches: { type: Number, default: 0 },
    socialSearches: { type: Number, default: 0 },
    locationSearches: { type: Number, default: 0 },
    totalSearches: { type: Number, default: 0 }
  },
  preferredSearchTypes: [String],
  peakUsageHours: [Number],
  averageSessionDuration: Number,
  contactInteractionRate: Number,
  lastAnalyzed: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

const UserBehaviorProfile = mongoose.model('UserBehaviorProfile', userBehaviorProfileSchema);

class UsageAnalyticsService {
  
  /**
   * Track search event
   * @param {Object} eventData - Search event data
   */
  async trackSearchEvent(eventData) {
    try {
      const {
        userId,
        query,
        searchCategory,
        searchIntent,
        resultsCount,
        userRole,
        sessionId,
        deviceType,
        location
      } = eventData;

      const event = new AnalyticsEvent({
        userId,
        eventType: 'search',
        query,
        searchCategory,
        searchIntent,
        resultsCount,
        userRole,
        sessionId,
        deviceType,
        location,
        metadata: {
          queryLength: query?.length || 0,
          hasResults: resultsCount > 0
        }
      });

      await event.save();

      // Update user behavior profile
      await this.updateUserBehaviorProfile(userId, 'search', { searchCategory });

      logger.info('Search event tracked', {
        userId,
        searchCategory,
        searchIntent,
        resultsCount
      });

    } catch (error) {
      logger.error('Failed to track search event', {
        userId: eventData.userId,
        error: error.message
      });
    }
  }

  /**
   * Track contact interaction
   * @param {Object} eventData - Contact interaction data
   */
  async trackContactInteraction(eventData) {
    try {
      const {
        userId,
        contactId,
        interactionType,
        searchCategory,
        sessionId
      } = eventData;

      const event = new AnalyticsEvent({
        userId,
        eventType: 'interaction',
        selectedContactId: contactId,
        searchCategory,
        sessionId,
        metadata: {
          interactionType,
          timestamp: new Date()
        }
      });

      await event.save();

      // Update user behavior profile
      await this.updateUserBehaviorProfile(userId, 'interaction', { contactId });

    } catch (error) {
      logger.error('Failed to track contact interaction', {
        userId: eventData.userId,
        error: error.message
      });
    }
  }

  /**
   * Update user behavior profile
   * @param {string} userId - User ID
   * @param {string} eventType - Type of event
   * @param {Object} eventData - Additional event data
   */
  async updateUserBehaviorProfile(userId, eventType, eventData) {
    try {
      let updateData = {};

      if (eventType === 'search') {
        const { searchCategory } = eventData;
        
        updateData = {
          $inc: {
            'searchPatterns.totalSearches': 1,
            [`searchPatterns.${this.mapSearchCategoryToPattern(searchCategory)}`]: 1
          },
          $set: {
            lastAnalyzed: new Date()
          }
        };
      }

      await UserBehaviorProfile.findOneAndUpdate(
        { userId },
        updateData,
        { upsert: true, new: true }
      );

      // Periodically analyze and update user role
      if (Math.random() < 0.1) { // 10% chance to trigger analysis
        await this.analyzeUserRole(userId);
      }

    } catch (error) {
      logger.error('Failed to update user behavior profile', {
        userId,
        error: error.message
      });
    }
  }

  /**
   * Analyze user role based on behavior patterns
   * @param {string} userId - User ID
   */
  async analyzeUserRole(userId) {
    try {
      const profile = await UserBehaviorProfile.findOne({ userId });
      if (!profile) return;

      const patterns = profile.searchPatterns;
      let detectedRole = 'other';

      // Role detection logic based on search patterns
      const professionalRatio = patterns.professionalSearches / patterns.totalSearches;
      const socialRatio = patterns.socialSearches / patterns.totalSearches;
      const locationRatio = patterns.locationSearches / patterns.totalSearches;

      if (professionalRatio > 0.7) {
        detectedRole = patterns.totalSearches > 20 ? 'professional' : 'job_seeker';
      } else if (socialRatio > 0.6) {
        detectedRole = locationRatio > 0.3 ? 'student' : 'entrepreneur';
      } else if (professionalRatio > 0.4 && socialRatio > 0.3) {
        detectedRole = 'executive';
      }

      await UserBehaviorProfile.findOneAndUpdate(
        { userId },
        { detectedRole },
        { new: true }
      );

      logger.info('User role analyzed', {
        userId,
        detectedRole,
        professionalRatio,
        socialRatio
      });

    } catch (error) {
      logger.error('Failed to analyze user role', {
        userId,
        error: error.message
      });
    }
  }

  /**
   * Get usage analytics for specific time period
   * @param {Object} params - Analytics parameters
   * @returns {Object} Analytics data
   */
  async getUsageAnalytics(params) {
    try {
      const {
        timeframe = '30d',
        userRole = null,
        userId = null
      } = params;

      const startDate = this.getStartDate(timeframe);
      const matchConditions = {
        timestamp: { $gte: startDate },
        eventType: 'search'
      };

      if (userRole) matchConditions.userRole = userRole;
      if (userId) matchConditions.userId = userId;

      const analytics = await AnalyticsEvent.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: {
              searchCategory: '$searchCategory',
              date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
            },
            searches: { $sum: 1 },
            avgResults: { $avg: '$resultsCount' },
            uniqueUsers: { $addToSet: '$userId' }
          }
        },
        {
          $group: {
            _id: '$_id.searchCategory',
            totalSearches: { $sum: '$searches' },
            avgResults: { $avg: '$avgResults' },
            uniqueUsers: { $sum: { $size: '$uniqueUsers' } },
            dailyData: {
              $push: {
                date: '$_id.date',
                searches: '$searches'
              }
            }
          }
        },
        { $sort: { totalSearches: -1 } }
      ]);

      // Calculate category percentages
      const totalSearches = analytics.reduce((sum, cat) => sum + cat.totalSearches, 0);
      const categoryBreakdown = analytics.map(cat => ({
        category: cat._id,
        searches: cat.totalSearches,
        percentage: ((cat.totalSearches / totalSearches) * 100).toFixed(1),
        avgResults: Math.round(cat.avgResults * 100) / 100,
        uniqueUsers: cat.uniqueUsers,
        trend: cat.dailyData
      }));

      return {
        timeframe,
        totalSearches,
        categoryBreakdown,
        insights: this.generateInsights(categoryBreakdown, userRole)
      };

    } catch (error) {
      logger.error('Failed to get usage analytics', {
        params,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get user role distribution analytics
   * @param {string} timeframe - Time period
   * @returns {Object} Role distribution data
   */
  async getUserRoleAnalytics(timeframe = '30d') {
    try {
      const startDate = this.getStartDate(timeframe);

      const roleAnalytics = await AnalyticsEvent.aggregate([
        { 
          $match: { 
            timestamp: { $gte: startDate },
            eventType: 'search',
            userRole: { $ne: null }
          }
        },
        {
          $group: {
            _id: {
              userRole: '$userRole',
              searchCategory: '$searchCategory'
            },
            searches: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.userRole',
            totalSearches: { $sum: '$searches' },
            searchBreakdown: {
              $push: {
                category: '$_id.searchCategory',
                searches: '$searches'
              }
            }
          }
        },
        { $sort: { totalSearches: -1 } }
      ]);

      return {
        timeframe,
        roleDistribution: roleAnalytics.map(role => ({
          role: role._id,
          totalSearches: role.totalSearches,
          categoryPreferences: role.searchBreakdown.sort((a, b) => b.searches - a.searches)
        }))
      };

    } catch (error) {
      logger.error('Failed to get user role analytics', {
        timeframe,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get search intent analytics
   * @param {string} timeframe - Time period
   * @returns {Object} Intent analytics data
   */
  async getSearchIntentAnalytics(timeframe = '30d') {
    try {
      const startDate = this.getStartDate(timeframe);

      const intentAnalytics = await AnalyticsEvent.aggregate([
        { 
          $match: { 
            timestamp: { $gte: startDate },
            eventType: 'search',
            searchIntent: { $ne: null }
          }
        },
        {
          $group: {
            _id: '$searchIntent',
            searches: { $sum: 1 },
            avgResults: { $avg: '$resultsCount' },
            successRate: {
              $avg: { $cond: [{ $gt: ['$resultsCount', 0] }, 1, 0] }
            }
          }
        },
        { $sort: { searches: -1 } }
      ]);

      return {
        timeframe,
        intentBreakdown: intentAnalytics.map(intent => ({
          intent: intent._id,
          searches: intent.searches,
          avgResults: Math.round(intent.avgResults * 100) / 100,
          successRate: Math.round(intent.successRate * 100)
        }))
      };

    } catch (error) {
      logger.error('Failed to get search intent analytics', {
        timeframe,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get real-time usage metrics
   * @returns {Object} Real-time metrics
   */
  async getRealTimeMetrics() {
    try {
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const metrics = await AnalyticsEvent.aggregate([
        { $match: { timestamp: { $gte: last24Hours } } },
        {
          $group: {
            _id: '$eventType',
            count: { $sum: 1 },
            uniqueUsers: { $addToSet: '$userId' }
          }
        }
      ]);

      const searchMetrics = await AnalyticsEvent.aggregate([
        { 
          $match: { 
            timestamp: { $gte: last24Hours },
            eventType: 'search'
          }
        },
        {
          $group: {
            _id: null,
            totalSearches: { $sum: 1 },
            professionalSearches: {
              $sum: { $cond: [{ $eq: ['$searchCategory', 'professional'] }, 1, 0] }
            },
            socialSearches: {
              $sum: { $cond: [{ $eq: ['$searchCategory', 'social'] }, 1, 0] }
            },
            avgResultsPerSearch: { $avg: '$resultsCount' }
          }
        }
      ]);

      const searchData = searchMetrics[0] || {
        totalSearches: 0,
        professionalSearches: 0,
        socialSearches: 0,
        avgResultsPerSearch: 0
      };

      return {
        last24Hours: {
          totalEvents: metrics.reduce((sum, m) => sum + m.count, 0),
          uniqueUsers: new Set(metrics.flatMap(m => m.uniqueUsers)).size,
          searches: searchData.totalSearches,
          professionalVsSocial: {
            professional: searchData.professionalSearches,
            social: searchData.socialSearches,
            ratio: searchData.totalSearches > 0 ? 
              (searchData.professionalSearches / searchData.totalSearches * 100).toFixed(1) : 0
          },
          avgResultsPerSearch: Math.round(searchData.avgResultsPerSearch * 100) / 100
        }
      };

    } catch (error) {
      logger.error('Failed to get real-time metrics', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Map search category to behavior pattern field
   * @param {string} searchCategory - Search category
   * @returns {string} Pattern field name
   */
  mapSearchCategoryToPattern(searchCategory) {
    const mapping = {
      'professional': 'professionalSearches',
      'company': 'professionalSearches',
      'skill': 'professionalSearches',
      'social': 'socialSearches',
      'interest': 'socialSearches',
      'school': 'socialSearches',
      'location': 'locationSearches'
    };

    return mapping[searchCategory] || 'socialSearches';
  }

  /**
   * Get start date for timeframe
   * @param {string} timeframe - Timeframe string
   * @returns {Date} Start date
   */
  getStartDate(timeframe) {
    const now = new Date();
    
    switch (timeframe) {
      case '1d':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Generate insights from analytics data
   * @param {Array} categoryBreakdown - Category breakdown data
   * @param {string} userRole - User role filter
   * @returns {Array} Insights array
   */
  generateInsights(categoryBreakdown, userRole) {
    const insights = [];

    if (categoryBreakdown.length === 0) {
      return ['No search data available for analysis'];
    }

    const topCategory = categoryBreakdown[0];
    insights.push(`${topCategory.category} searches dominate with ${topCategory.percentage}% of total queries`);

    const professionalData = categoryBreakdown.find(c => c.category === 'professional');
    const socialData = categoryBreakdown.find(c => c.category === 'social');

    if (professionalData && socialData) {
      const ratio = professionalData.searches / socialData.searches;
      if (ratio > 2) {
        insights.push('Users show strong preference for professional networking over social connections');
      } else if (ratio < 0.5) {
        insights.push('Social connections are prioritized over professional networking');
      } else {
        insights.push('Balanced usage between professional and social networking features');
      }
    }

    if (userRole) {
      insights.push(`Analysis filtered for ${userRole} users only`);
    }

    return insights;
  }
}

module.exports = new UsageAnalyticsService();