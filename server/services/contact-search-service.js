/**
 * Contact Search Service
 * Core search engine for BeeTagged MVP - "Google for your personal network"
 */

const Contact = require('../models/Contact');
const logger = require('../../utils/logger');

class ContactSearchService {
  /**
   * Search contacts by multiple criteria with intelligent ranking
   * @param {string} userId - User ID performing the search
   * @param {Object} searchParams - Search parameters
   * @returns {Array} Ranked search results
   */
  async searchContacts(userId, searchParams) {
    try {
      const {
        query,          // General search query
        company,        // "Who do I know at Google?"
        jobTitle,       // "Who do I know in marketing?"
        location,       // "Who do I know in Austin?"
        skills,         // "Who do I know who codes?"
        industry,       // "Who do I know in tech?"
        tags           // Custom user tags
      } = searchParams;

      // Build MongoDB aggregation pipeline for intelligent search
      const pipeline = [
        // Match contacts belonging to the user
        { $match: { userId: userId } },
        
        // Add search score field
        {
          $addFields: {
            searchScore: { $literal: 0 },
            matchReasons: []
          }
        }
      ];

      // Add text search scoring if general query provided
      if (query) {
        pipeline.push({
          $addFields: {
            searchScore: {
              $add: [
                "$searchScore",
                {
                  $cond: {
                    if: { $regexMatch: { input: "$name", regex: query, options: "i" } },
                    then: 10,
                    else: 0
                  }
                },
                {
                  $cond: {
                    if: { $regexMatch: { input: "$email", regex: query, options: "i" } },
                    then: 8,
                    else: 0
                  }
                },
                {
                  $cond: {
                    if: { $regexMatch: { input: "$company", regex: query, options: "i" } },
                    then: 7,
                    else: 0
                  }
                },
                {
                  $cond: {
                    if: { $regexMatch: { input: "$jobTitle", regex: query, options: "i" } },
                    then: 6,
                    else: 0
                  }
                }
              ]
            },
            matchReasons: {
              $concatArrays: [
                "$matchReasons",
                {
                  $cond: {
                    if: { $regexMatch: { input: "$name", regex: query, options: "i" } },
                    then: ["name match"],
                    else: []
                  }
                },
                {
                  $cond: {
                    if: { $regexMatch: { input: "$company", regex: query, options: "i" } },
                    then: ["company match"],
                    else: []
                  }
                }
              ]
            }
          }
        });
      }

      // Company-specific search scoring
      if (company) {
        pipeline.push({
          $addFields: {
            searchScore: {
              $add: [
                "$searchScore",
                {
                  $cond: {
                    if: { $regexMatch: { input: "$company", regex: company, options: "i" } },
                    then: 15, // High score for exact company matches
                    else: 0
                  }
                }
              ]
            },
            matchReasons: {
              $concatArrays: [
                "$matchReasons",
                {
                  $cond: {
                    if: { $regexMatch: { input: "$company", regex: company, options: "i" } },
                    then: [`works at ${company}`],
                    else: []
                  }
                }
              ]
            }
          }
        });
      }

      // Job title/function search scoring
      if (jobTitle) {
        pipeline.push({
          $addFields: {
            searchScore: {
              $add: [
                "$searchScore",
                {
                  $cond: {
                    if: { $regexMatch: { input: "$jobTitle", regex: jobTitle, options: "i" } },
                    then: 12,
                    else: 0
                  }
                },
                {
                  $cond: {
                    if: { $regexMatch: { input: "$industry", regex: jobTitle, options: "i" } },
                    then: 8,
                    else: 0
                  }
                }
              ]
            },
            matchReasons: {
              $concatArrays: [
                "$matchReasons",
                {
                  $cond: {
                    if: { $regexMatch: { input: "$jobTitle", regex: jobTitle, options: "i" } },
                    then: [`${jobTitle} role`],
                    else: []
                  }
                }
              ]
            }
          }
        });
      }

      // Location-based search scoring
      if (location) {
        pipeline.push({
          $addFields: {
            searchScore: {
              $add: [
                "$searchScore",
                {
                  $cond: {
                    if: { $regexMatch: { input: "$location", regex: location, options: "i" } },
                    then: 10,
                    else: 0
                  }
                }
              ]
            },
            matchReasons: {
              $concatArrays: [
                "$matchReasons",
                {
                  $cond: {
                    if: { $regexMatch: { input: "$location", regex: location, options: "i" } },
                    then: [`lives in ${location}`],
                    else: []
                  }
                }
              ]
            }
          }
        });
      }

      // Skills-based search
      if (skills) {
        pipeline.push({
          $addFields: {
            searchScore: {
              $add: [
                "$searchScore",
                {
                  $cond: {
                    if: {
                      $gt: [
                        {
                          $size: {
                            $filter: {
                              input: "$skills",
                              cond: { $regexMatch: { input: "$$this", regex: skills, options: "i" } }
                            }
                          }
                        },
                        0
                      ]
                    },
                    then: 8,
                    else: 0
                  }
                }
              ]
            },
            matchReasons: {
              $concatArrays: [
                "$matchReasons",
                {
                  $cond: {
                    if: {
                      $gt: [
                        {
                          $size: {
                            $filter: {
                              input: "$skills",
                              cond: { $regexMatch: { input: "$$this", regex: skills, options: "i" } }
                            }
                          }
                        },
                        0
                      ]
                    },
                    then: [`${skills} skills`],
                    else: []
                  }
                }
              ]
            }
          }
        });
      }

      // Tag-based search
      if (tags && tags.length > 0) {
        pipeline.push({
          $addFields: {
            searchScore: {
              $add: [
                "$searchScore",
                {
                  $multiply: [
                    {
                      $size: {
                        $setIntersection: ["$tags", tags]
                      }
                    },
                    5 // 5 points per matching tag
                  ]
                }
              ]
            },
            matchReasons: {
              $concatArrays: [
                "$matchReasons",
                {
                  $map: {
                    input: { $setIntersection: ["$tags", tags] },
                    as: "tag",
                    in: { $concat: ["tagged: ", "$$tag"] }
                  }
                }
              ]
            }
          }
        });
      }

      // Filter to only return contacts with matches (score > 0)
      pipeline.push({ $match: { searchScore: { $gt: 0 } } });

      // Sort by relevance score (highest first)
      pipeline.push({ $sort: { searchScore: -1, name: 1 } });

      // Limit results
      pipeline.push({ $limit: 50 });

      const results = await Contact.aggregate(pipeline);

      logger.info('Contact search completed', {
        userId,
        searchParams,
        resultCount: results.length
      });

      return results;

    } catch (error) {
      logger.error('Contact search failed', {
        userId,
        searchParams,
        error: error.message
      });
      throw new Error(`Contact search failed: ${error.message}`);
    }
  }

  /**
   * Get search suggestions based on user's contact data
   * @param {string} userId - User ID
   * @returns {Object} Search suggestions
   */
  async getSearchSuggestions(userId) {
    try {
      const suggestions = await Contact.aggregate([
        { $match: { userId: userId } },
        {
          $group: {
            _id: null,
            companies: { $addToSet: "$company" },
            locations: { $addToSet: "$location" },
            jobTitles: { $addToSet: "$jobTitle" },
            industries: { $addToSet: "$industry" },
            skills: { $addToSet: { $arrayElemAt: ["$skills", 0] } },
            tags: { $addToSet: { $arrayElemAt: ["$tags", 0] } }
          }
        },
        {
          $project: {
            _id: 0,
            companies: { $slice: [{ $filter: { input: "$companies", cond: { $ne: ["$$this", null] } } }, 10] },
            locations: { $slice: [{ $filter: { input: "$locations", cond: { $ne: ["$$this", null] } } }, 10] },
            jobTitles: { $slice: [{ $filter: { input: "$jobTitles", cond: { $ne: ["$$this", null] } } }, 10] },
            industries: { $slice: [{ $filter: { input: "$industries", cond: { $ne: ["$$this", null] } } }, 10] },
            skills: { $slice: [{ $filter: { input: "$skills", cond: { $ne: ["$$this", null] } } }, 10] },
            tags: { $slice: [{ $filter: { input: "$tags", cond: { $ne: ["$$this", null] } } }, 10] }
          }
        }
      ]);

      return suggestions.length > 0 ? suggestions[0] : {
        companies: [],
        locations: [],
        jobTitles: [],
        industries: [],
        skills: [],
        tags: []
      };

    } catch (error) {
      logger.error('Failed to get search suggestions', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Search contacts for specific high-value scenarios
   * @param {string} userId - User ID
   * @param {string} scenario - Search scenario type
   * @param {string} value - Search value
   * @returns {Array} Targeted search results
   */
  async searchByScenario(userId, scenario, value) {
    const scenarioMap = {
      'job-search': { company: value },
      'travel': { location: value },
      'skill-help': { skills: value },
      'industry-networking': { industry: value },
      'function-referral': { jobTitle: value }
    };

    const searchParams = scenarioMap[scenario];
    if (!searchParams) {
      throw new Error(`Unknown search scenario: ${scenario}`);
    }

    return await this.searchContacts(userId, searchParams);
  }
}

module.exports = new ContactSearchService();