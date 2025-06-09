/**
 * Intelligent Search Service
 * Core search intelligence that works automatically without manual input
 * Gamification only refines results when automation needs improvement
 */

const Contact = require('../models/Contact');
const logger = require('../../utils/logger');

class IntelligentSearchService {

  /**
   * Smart search that automatically surfaces relevant contacts
   * @param {string} userId - User ID
   * @param {Object} searchContext - Search context and intent
   * @returns {Array} Intelligently ranked contacts
   */
  async intelligentSearch(userId, searchContext) {
    try {
      const {
        query,           // "traveling to Seattle" or "need a programmer"
        intent,          // 'travel', 'job_search', 'skill_help', 'networking'
        location,        // Extracted location if travel intent
        skill,           // Extracted skill if help intent
        company,         // Target company if job search
        autoDetect = true // Auto-detect intent from query
      } = searchContext;

      // Auto-detect intent from natural language query
      const detectedContext = autoDetect ? this.detectSearchIntent(query) : searchContext;
      
      // Build intelligent search pipeline
      const searchPipeline = await this.buildSearchPipeline(userId, detectedContext);
      
      // Execute search with intelligent ranking
      const results = await Contact.aggregate(searchPipeline);
      
      // Apply personalized ranking based on validated preferences
      const personalizedResults = await this.applyPersonalizedRanking(userId, results, detectedContext);

      logger.info('Intelligent search completed', {
        userId,
        originalQuery: query,
        detectedIntent: detectedContext.intent,
        resultCount: personalizedResults.length
      });

      return {
        query: query,
        detectedIntent: detectedContext.intent,
        extractedContext: detectedContext,
        results: personalizedResults,
        searchMetadata: {
          totalMatches: results.length,
          highConfidenceMatches: results.filter(r => r.relevanceScore > 7).length,
          autoEnrichedContacts: results.filter(r => r.lastAutoTagged).length
        }
      };

    } catch (error) {
      logger.error('Intelligent search failed', {
        userId,
        searchContext,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Detect search intent from natural language query
   * @param {string} query - Natural language search query
   * @returns {Object} Detected context and intent
   */
  detectSearchIntent(query) {
    if (!query) return { intent: 'general' };

    const lowerQuery = query.toLowerCase();
    const context = { originalQuery: query };

    // Travel intent detection
    const travelKeywords = ['travel', 'visiting', 'going to', 'trip to', 'in town', 'vacation'];
    if (travelKeywords.some(keyword => lowerQuery.includes(keyword))) {
      context.intent = 'travel';
      context.location = this.extractLocation(query);
    }

    // Job search intent detection
    const jobKeywords = ['job', 'hiring', 'work at', 'know someone at', 'introduction to'];
    const companyPattern = /\b(at|with|for)\s+([A-Z][a-zA-Z\s&]+)/;
    if (jobKeywords.some(keyword => lowerQuery.includes(keyword)) || companyPattern.test(query)) {
      context.intent = 'job_search';
      const companyMatch = query.match(companyPattern);
      if (companyMatch) {
        context.company = companyMatch[2].trim();
      }
    }

    // Skill help intent detection
    const skillKeywords = ['help with', 'know about', 'expert in', 'good at', 'programmer', 'developer', 'designer', 'marketer'];
    if (skillKeywords.some(keyword => lowerQuery.includes(keyword))) {
      context.intent = 'skill_help';
      context.skill = this.extractSkill(query);
    }

    // Networking intent detection
    const networkKeywords = ['connect', 'introduction', 'meet', 'know someone', 'network'];
    if (networkKeywords.some(keyword => lowerQuery.includes(keyword))) {
      context.intent = 'networking';
      context.networkingType = this.extractNetworkingType(query);
    }

    // Default to general search if no specific intent detected
    if (!context.intent) {
      context.intent = 'general';
    }

    return context;
  }

  /**
   * Build MongoDB aggregation pipeline for intelligent search
   * @param {string} userId - User ID
   * @param {Object} context - Search context
   * @returns {Array} MongoDB aggregation pipeline
   */
  async buildSearchPipeline(userId, context) {
    const pipeline = [
      // Match user's contacts
      { $match: { userId: userId } },
      
      // Add relevance scoring
      {
        $addFields: {
          relevanceScore: { $literal: 0 },
          matchReasons: [],
          confidenceBoost: 0
        }
      }
    ];

    // Intent-specific scoring
    switch (context.intent) {
      case 'travel':
        if (context.location) {
          pipeline.push(...this.getTravelScoringStages(context.location));
        }
        break;
        
      case 'job_search':
        if (context.company) {
          pipeline.push(...this.getJobSearchScoringStages(context.company));
        }
        break;
        
      case 'skill_help':
        if (context.skill) {
          pipeline.push(...this.getSkillScoringStages(context.skill));
        }
        break;
        
      case 'networking':
        pipeline.push(...this.getNetworkingScoringStages(context.networkingType));
        break;
        
      default:
        // General search scoring
        pipeline.push(...this.getGeneralScoringStages(context.originalQuery));
    }

    // Boost based on data richness and validation
    pipeline.push({
      $addFields: {
        relevanceScore: {
          $add: [
            '$relevanceScore',
            // Boost for Facebook enrichment
            { $cond: [{ $ne: ['$facebookId', null] }, 2, 0] },
            // Boost for LinkedIn enrichment  
            { $cond: [{ $ne: ['$linkedinId', null] }, 2, 0] },
            // Boost for auto-tagged contacts
            { $cond: [{ $ne: ['$lastAutoTagged', null] }, 1, 0] },
            // Boost for high match confidence
            { $multiply: ['$matchConfidence', 3] },
            // Boost for recent interactions
            {
              $cond: [
                { $gte: ['$lastInteraction', { $dateSubtract: { startDate: '$$NOW', unit: 'month', amount: 3 } }] },
                2, 0
              ]
            }
          ]
        }
      }
    });

    // Filter to only relevant results
    pipeline.push({ $match: { relevanceScore: { $gt: 0 } } });

    // Sort by relevance
    pipeline.push({ $sort: { relevanceScore: -1, name: 1 } });

    // Limit results
    pipeline.push({ $limit: 50 });

    return pipeline;
  }

  /**
   * Get travel-specific scoring stages
   * @param {string} location - Travel destination
   * @returns {Array} Pipeline stages
   */
  getTravelScoringStages(location) {
    return [
      {
        $addFields: {
          relevanceScore: {
            $add: [
              '$relevanceScore',
              // Current location match (highest priority)
              {
                $cond: [
                  { $regexMatch: { input: '$location', regex: location, options: 'i' } },
                  15, 0
                ]
              },
              // Hometown match
              {
                $cond: [
                  { $regexMatch: { input: '$hometown', regex: location, options: 'i' } },
                  12, 0
                ]
              },
              // Location in work history
              {
                $cond: [
                  {
                    $gt: [
                      {
                        $size: {
                          $filter: {
                            input: '$workHistory',
                            cond: { $regexMatch: { input: '$$this.location', regex: location, options: 'i' } }
                          }
                        }
                      }, 0
                    ]
                  },
                  10, 0
                ]
              },
              // Auto-generated location tags
              {
                $cond: [
                  {
                    $gt: [
                      {
                        $size: {
                          $filter: {
                            input: '$tags',
                            cond: {
                              $and: [
                                { $eq: ['$$this.category', 'location'] },
                                { $regexMatch: { input: '$$this.value', regex: location, options: 'i' } }
                              ]
                            }
                          }
                        }
                      }, 0
                    ]
                  },
                  8, 0
                ]
              }
            ]
          },
          matchReasons: {
            $concatArrays: [
              '$matchReasons',
              {
                $cond: [
                  { $regexMatch: { input: '$location', regex: location, options: 'i' } },
                  [`lives in ${location}`], []
                ]
              },
              {
                $cond: [
                  { $regexMatch: { input: '$hometown', regex: location, options: 'i' } },
                  [`from ${location}`], []
                ]
              }
            ]
          }
        }
      }
    ];
  }

  /**
   * Get job search-specific scoring stages
   * @param {string} company - Target company
   * @returns {Array} Pipeline stages
   */
  getJobSearchScoringStages(company) {
    return [
      {
        $addFields: {
          relevanceScore: {
            $add: [
              '$relevanceScore',
              // Current company exact match
              {
                $cond: [
                  { $regexMatch: { input: '$company', regex: company, options: 'i' } },
                  20, 0
                ]
              },
              // Company in work history
              {
                $multiply: [
                  {
                    $size: {
                      $filter: {
                        input: '$workHistory',
                        cond: { $regexMatch: { input: '$$this.employer', regex: company, options: 'i' } }
                      }
                    }
                  },
                  15
                ]
              },
              // Auto-generated company tags
              {
                $cond: [
                  {
                    $gt: [
                      {
                        $size: {
                          $filter: {
                            input: '$tags',
                            cond: {
                              $and: [
                                { $eq: ['$$this.category', 'professional'] },
                                { $regexMatch: { input: '$$this.value', regex: company, options: 'i' } }
                              ]
                            }
                          }
                        }
                      }, 0
                    ]
                  },
                  12, 0
                ]
              }
            ]
          },
          matchReasons: {
            $concatArrays: [
              '$matchReasons',
              {
                $cond: [
                  { $regexMatch: { input: '$company', regex: company, options: 'i' } },
                  [`works at ${company}`], []
                ]
              }
            ]
          }
        }
      }
    ];
  }

  /**
   * Get skill-specific scoring stages
   * @param {string} skill - Target skill
   * @returns {Array} Pipeline stages
   */
  getSkillScoringStages(skill) {
    return [
      {
        $addFields: {
          relevanceScore: {
            $add: [
              '$relevanceScore',
              // Explicit skills match
              {
                $multiply: [
                  {
                    $size: {
                      $filter: {
                        input: '$skills',
                        cond: { $regexMatch: { input: '$$this', regex: skill, options: 'i' } }
                      }
                    }
                  },
                  10
                ]
              },
              // Job title implies skill
              {
                $cond: [
                  { $regexMatch: { input: '$jobTitle', regex: skill, options: 'i' } },
                  12, 0
                ]
              },
              // Auto-generated skill tags
              {
                $multiply: [
                  {
                    $size: {
                      $filter: {
                        input: '$tags',
                        cond: {
                          $and: [
                            { $eq: ['$$this.category', 'skills'] },
                            { $regexMatch: { input: '$$this.value', regex: skill, options: 'i' } }
                          ]
                        }
                      }
                    }
                  },
                  8
                ]
              }
            ]
          },
          matchReasons: {
            $concatArrays: [
              '$matchReasons',
              {
                $cond: [
                  { $regexMatch: { input: '$jobTitle', regex: skill, options: 'i' } },
                  [`${skill} professional`], []
                ]
              }
            ]
          }
        }
      }
    ];
  }

  /**
   * Get networking-specific scoring stages
   * @param {string} networkingType - Type of networking
   * @returns {Array} Pipeline stages
   */
  getNetworkingScoringStages(networkingType) {
    return [
      {
        $addFields: {
          relevanceScore: {
            $add: [
              '$relevanceScore',
              // Boost highly connected people
              {
                $cond: [
                  { $gt: ['$facebookData.mutualFriends', 5] },
                  5, 0
                ]
              },
              {
                $cond: [
                  { $gt: ['$linkedinData.numConnections', 500] },
                  3, 0
                ]
              },
              // Boost recent interactions
              {
                $cond: [
                  { $gt: ['$interactionCount', 3] },
                  4, 0
                ]
              }
            ]
          }
        }
      }
    ];
  }

  /**
   * Get general search scoring stages
   * @param {string} query - Search query
   * @returns {Array} Pipeline stages
   */
  getGeneralScoringStages(query) {
    if (!query) return [];

    return [
      {
        $addFields: {
          relevanceScore: {
            $add: [
              '$relevanceScore',
              // Name match
              {
                $cond: [
                  { $regexMatch: { input: '$name', regex: query, options: 'i' } },
                  10, 0
                ]
              },
              // Company match
              {
                $cond: [
                  { $regexMatch: { input: '$company', regex: query, options: 'i' } },
                  8, 0
                ]
              },
              // Job title match
              {
                $cond: [
                  { $regexMatch: { input: '$jobTitle', regex: query, options: 'i' } },
                  7, 0
                ]
              },
              // Any tag match
              {
                $multiply: [
                  {
                    $size: {
                      $filter: {
                        input: '$tags',
                        cond: { $regexMatch: { input: '$$this.value', regex: query, options: 'i' } }
                      }
                    }
                  },
                  5
                ]
              }
            ]
          }
        }
      }
    ];
  }

  /**
   * Apply personalized ranking based on gamification validation
   * @param {string} userId - User ID
   * @param {Array} results - Search results
   * @param {Object} context - Search context
   * @returns {Array} Personalized ranked results
   */
  async applyPersonalizedRanking(userId, results, context) {
    // Only apply personalization if we have validated preferences
    const hasValidatedData = results.some(r => r.tagRankings && Object.keys(r.tagRankings).length > 0);
    
    if (!hasValidatedData) {
      return results; // Return auto-scored results if no validation data
    }

    return results.map(contact => {
      let personalizedScore = contact.relevanceScore;
      
      // Apply validated preferences based on search intent
      if (context.intent && contact.tagRankings) {
        const contextMapping = {
          'travel': 'location_knowledge',
          'skill_help': 'programming_experience',
          'job_search': 'professional_experience'
        };
        
        const relevantCategory = contextMapping[context.intent];
        if (relevantCategory && contact.tagRankings[relevantCategory]) {
          personalizedScore += contact.tagRankings[relevantCategory] * 2;
        }
      }

      return {
        ...contact,
        personalizedScore: personalizedScore,
        hasPersonalization: hasValidatedData
      };
    }).sort((a, b) => b.personalizedScore - a.personalizedScore);
  }

  /**
   * Extract location from natural language query
   * @param {string} query - Search query
   * @returns {string} Extracted location
   */
  extractLocation(query) {
    // Simple location extraction - could be enhanced with NLP
    const locationPattern = /(to|in|at|visiting)\s+([A-Z][a-zA-Z\s]+)/i;
    const match = query.match(locationPattern);
    return match ? match[2].trim() : null;
  }

  /**
   * Extract skill from natural language query
   * @param {string} query - Search query
   * @returns {string} Extracted skill
   */
  extractSkill(query) {
    const skillKeywords = ['programming', 'coding', 'design', 'marketing', 'sales', 'finance', 'engineering'];
    const lowerQuery = query.toLowerCase();
    
    for (const skill of skillKeywords) {
      if (lowerQuery.includes(skill)) {
        return skill;
      }
    }
    
    return null;
  }

  /**
   * Extract networking type from query
   * @param {string} query - Search query
   * @returns {string} Networking type
   */
  extractNetworkingType(query) {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('professional')) return 'professional';
    if (lowerQuery.includes('social')) return 'social';
    if (lowerQuery.includes('industry')) return 'industry';
    
    return 'general';
  }

  /**
   * Get quick search suggestions based on user's contact data
   * @param {string} userId - User ID
   * @returns {Array} Smart search suggestions
   */
  async getSmartSuggestions(userId) {
    try {
      const suggestions = await Contact.aggregate([
        { $match: { userId: userId } },
        {
          $group: {
            _id: null,
            topCompanies: { $addToSet: '$company' },
            topLocations: { $addToSet: '$location' },
            topSkills: { $addToSet: { $arrayElemAt: ['$skills', 0] } },
            recentContacts: { $push: { name: '$name', lastInteraction: '$lastInteraction' } }
          }
        },
        {
          $project: {
            suggestions: {
              travel: { $slice: [{ $filter: { input: '$topLocations', cond: { $ne: ['$$this', null] } } }, 5] },
              jobSearch: { $slice: [{ $filter: { input: '$topCompanies', cond: { $ne: ['$$this', null] } } }, 5] },
              skillHelp: { $slice: [{ $filter: { input: '$topSkills', cond: { $ne: ['$$this', null] } } }, 5] },
              recent: { 
                $slice: [
                  { 
                    $sortArray: { 
                      input: { $filter: { input: '$recentContacts', cond: { $ne: ['$$this.lastInteraction', null] } } },
                      sortBy: { lastInteraction: -1 }
                    }
                  }, 3
                ]
              }
            }
          }
        }
      ]);

      return suggestions.length > 0 ? suggestions[0].suggestions : {
        travel: [], jobSearch: [], skillHelp: [], recent: []
      };

    } catch (error) {
      logger.error('Failed to get smart suggestions', {
        userId,
        error: error.message
      });
      return { travel: [], jobSearch: [], skillHelp: [], recent: [] };
    }
  }
}

module.exports = new IntelligentSearchService();