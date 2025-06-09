/**
 * Analytics Routes
 * Track and analyze usage patterns between social and professional search features
 */

const express = require('express');
const router = express.Router();
const usageAnalyticsService = require('../services/usage-analytics-service');
const logger = require('../../utils/logger');

/**
 * Track search event
 * POST /api/analytics/track/search
 */
router.post('/track/search', async (req, res) => {
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
    } = req.body;

    if (!userId || !searchCategory) {
      return res.status(400).json({
        success: false,
        message: 'userId and searchCategory are required'
      });
    }

    await usageAnalyticsService.trackSearchEvent({
      userId,
      query,
      searchCategory,
      searchIntent,
      resultsCount,
      userRole,
      sessionId,
      deviceType,
      location
    });

    res.json({
      success: true,
      message: 'Search event tracked successfully'
    });

  } catch (error) {
    logger.error('Failed to track search event', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to track search event',
      error: error.message
    });
  }
});

/**
 * Track contact interaction
 * POST /api/analytics/track/interaction
 */
router.post('/track/interaction', async (req, res) => {
  try {
    const {
      userId,
      contactId,
      interactionType,
      searchCategory,
      sessionId
    } = req.body;

    if (!userId || !contactId || !interactionType) {
      return res.status(400).json({
        success: false,
        message: 'userId, contactId, and interactionType are required'
      });
    }

    await usageAnalyticsService.trackContactInteraction({
      userId,
      contactId,
      interactionType,
      searchCategory,
      sessionId
    });

    res.json({
      success: true,
      message: 'Interaction tracked successfully'
    });

  } catch (error) {
    logger.error('Failed to track interaction', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to track interaction',
      error: error.message
    });
  }
});

/**
 * Get usage analytics
 * GET /api/analytics/usage
 */
router.get('/usage', async (req, res) => {
  try {
    const { timeframe, userRole, userId } = req.query;

    const analytics = await usageAnalyticsService.getUsageAnalytics({
      timeframe,
      userRole,
      userId
    });

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    logger.error('Failed to get usage analytics', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get usage analytics',
      error: error.message
    });
  }
});

/**
 * Get user role distribution analytics
 * GET /api/analytics/user-roles
 */
router.get('/user-roles', async (req, res) => {
  try {
    const { timeframe } = req.query;

    const roleAnalytics = await usageAnalyticsService.getUserRoleAnalytics(timeframe);

    res.json({
      success: true,
      data: roleAnalytics
    });

  } catch (error) {
    logger.error('Failed to get user role analytics', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get user role analytics',
      error: error.message
    });
  }
});

/**
 * Get search intent analytics
 * GET /api/analytics/search-intent
 */
router.get('/search-intent', async (req, res) => {
  try {
    const { timeframe } = req.query;

    const intentAnalytics = await usageAnalyticsService.getSearchIntentAnalytics(timeframe);

    res.json({
      success: true,
      data: intentAnalytics
    });

  } catch (error) {
    logger.error('Failed to get search intent analytics', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get search intent analytics',
      error: error.message
    });
  }
});

/**
 * Get real-time usage metrics
 * GET /api/analytics/real-time
 */
router.get('/real-time', async (req, res) => {
  try {
    const metrics = await usageAnalyticsService.getRealTimeMetrics();

    res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    logger.error('Failed to get real-time metrics', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get real-time metrics',
      error: error.message
    });
  }
});

/**
 * Get comprehensive dashboard data
 * GET /api/analytics/dashboard
 */
router.get('/dashboard', async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;

    // Get multiple analytics in parallel
    const [
      usageAnalytics,
      roleAnalytics,
      intentAnalytics,
      realTimeMetrics
    ] = await Promise.all([
      usageAnalyticsService.getUsageAnalytics({ timeframe }),
      usageAnalyticsService.getUserRoleAnalytics(timeframe),
      usageAnalyticsService.getSearchIntentAnalytics(timeframe),
      usageAnalyticsService.getRealTimeMetrics()
    ]);

    const dashboard = {
      timeframe,
      overview: {
        totalSearches: usageAnalytics.totalSearches,
        categoryBreakdown: usageAnalytics.categoryBreakdown,
        insights: usageAnalytics.insights
      },
      userBehavior: {
        roleDistribution: roleAnalytics.roleDistribution,
        searchIntents: intentAnalytics.intentBreakdown
      },
      realTime: realTimeMetrics.last24Hours,
      keyMetrics: {
        professionalVsSocial: {
          professional: usageAnalytics.categoryBreakdown.find(c => c.category === 'professional')?.percentage || 0,
          social: usageAnalytics.categoryBreakdown.find(c => c.category === 'social')?.percentage || 0
        },
        topUserRole: roleAnalytics.roleDistribution[0]?.role || 'unknown',
        mostPopularIntent: intentAnalytics.intentBreakdown[0]?.intent || 'unknown'
      }
    };

    res.json({
      success: true,
      data: dashboard
    });

  } catch (error) {
    logger.error('Failed to get dashboard data', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data',
      error: error.message
    });
  }
});

module.exports = router;