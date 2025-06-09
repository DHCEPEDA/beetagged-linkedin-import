/**
 * Natural Language Search Service - Pain Point Solution Engine
 * 
 * ADDRESSES CORE USER PAIN POINTS:
 * 1. "Who does [something] but can't remember their name?" -> Function/skill search
 * 2. "Who is near me for [activity]?" -> Location + interest/skill matching
 * 3. "Can't find contact info in other platforms" -> Rich social data overlay
 * 
 * SEARCH CAPABILITIES:
 * - Function queries: "Who works in marketing?" "Who's a developer?"
 * - Location queries: "Who's in Austin?" "Who's near me?"
 * - Combined queries: "Who's a designer in San Francisco?"
 * - Skill queries: "Who knows React?" "Who plays guitar?"
 * - Company queries: "Who works at Google?" "Who used to work at Apple?"
 */

const Contact = require('../models/Contact');
const logger = require('../../utils/logger');

class NaturalLanguageSearchService {
  constructor() {
    // Common job function patterns
    this.jobFunctionPatterns = {
      'marketing': ['marketing', 'marketer', 'growth', 'brand', 'campaign', 'digital marketing'],
      'engineering': ['engineer', 'developer', 'programmer', 'software', 'tech', 'coding'],
      'design': ['designer', 'ux', 'ui', 'creative', 'visual', 'graphic'],
      'sales': ['sales', 'account', 'business development', 'bd', 'revenue'],
      'product': ['product', 'pm', 'product manager', 'product owner'],
      'finance': ['finance', 'accounting', 'financial', 'analyst', 'cfo'],
      'operations': ['operations', 'ops', 'logistics', 'supply chain'],
      'hr': ['hr', 'human resources', 'people', 'recruiting', 'talent'],
      'management': ['manager', 'director', 'vp', 'ceo', 'executive', 'lead']
    };

    // Common location patterns
    this.locationPatterns = {
      'austin': ['austin', 'atx', 'austin tx', 'austin texas'],
      'san francisco': ['sf', 'san francisco', 'san fran', 'bay area'],
      'new york': ['nyc', 'new york', 'manhattan', 'brooklyn'],
      'los angeles': ['la', 'los angeles', 'hollywood', 'santa monica'],
      'seattle': ['seattle', 'bellevue', 'redmond'],
      'chicago': ['chicago', 'chi town'],
      'boston': ['boston', 'cambridge', 'somerville']
    };

    // Activity/interest patterns
    this.interestPatterns = {
      'sports': ['basketball', 'football', 'soccer', 'tennis', 'running', 'gym'],
      'music': ['guitar', 'piano', 'singing', 'band', 'concert', 'music'],
      'tech': ['coding', 'programming', 'ai', 'blockchain', 'startup'],
      'food': ['cooking', 'restaurant', 'foodie', 'wine', 'coffee'],
      'travel': ['travel', 'backpacking', 'adventure', 'photography']
    };
  }

  /**
   * Process natural language search query
   * @param {string} query - User's search query
   * @param {string} userId - User ID for contact filtering
   * @returns {Object} Search results with explanations
   */
  async processNaturalLanguageQuery(query, userId) {
    try {
      const normalizedQuery = query.toLowerCase().trim();
      
      // Parse query intent and extract search parameters
      const searchIntent = this.parseSearchIntent(normalizedQuery);
      
      // Build MongoDB query based on intent
      const mongoQuery = this.buildMongoQuery(searchIntent, userId);
      
      // Execute search with contact ranking
      const contacts = await Contact.find(mongoQuery)
        .sort({ lastEnriched: -1 })
        .limit(50);
      
      // Rank and filter results based on relevance
      const rankedResults = this.rankSearchResults(contacts, searchIntent);
      
      return {
        success: true,
        query: query,
        intent: searchIntent,
        results: rankedResults.slice(0, 20), // Top 20 results
        resultCount: rankedResults.length,
        explanation: this.generateSearchExplanation(searchIntent, rankedResults.length),
        suggestions: this.generateSearchSuggestions(searchIntent)
      };

    } catch (error) {
      logger.error('Natural language search failed', {
        query: query,
        userId: userId,
        error: error.message
      });

      return {
        success: false,
        query: query,
        error: error.message,
        results: [],
        suggestions: ['Try simpler terms like "marketing" or "Austin"']
      };
    }
  }

  /**
   * Parse user query to understand search intent
   * @param {string} query - Normalized query string
   * @returns {Object} Parsed search intent
   */
  parseSearchIntent(query) {
    const intent = {
      type: 'unknown',
      function: null,
      location: null,
      company: null,
      skill: null,
      interest: null,
      modifiers: []
    };

    // Check for function queries
    for (const [category, patterns] of Object.entries(this.jobFunctionPatterns)) {
      if (patterns.some(pattern => query.includes(pattern))) {
        intent.type = 'function';
        intent.function = category;
        break;
      }
    }

    // Check for location queries
    for (const [city, patterns] of Object.entries(this.locationPatterns)) {
      if (patterns.some(pattern => query.includes(pattern))) {
        intent.type = intent.type === 'function' ? 'function_location' : 'location';
        intent.location = city;
        break;
      }
    }

    // Check for company queries
    if (query.includes('works at') || query.includes('work at') || query.includes('employed at')) {
      intent.type = 'company';
      // Extract company name after "at"
      const atMatch = query.match(/at\s+([a-zA-Z0-9\s]+)/);
      if (atMatch) {
        intent.company = atMatch[1].trim();
      }
    }

    // Check for skill/interest queries
    for (const [category, patterns] of Object.entries(this.interestPatterns)) {
      if (patterns.some(pattern => query.includes(pattern))) {
        intent.type = intent.type === 'unknown' ? 'interest' : `${intent.type}_interest`;
        intent.interest = category;
        break;
      }
    }

    // Check for proximity queries
    if (query.includes('near me') || query.includes('nearby') || query.includes('around here')) {
      intent.modifiers.push('proximity');
    }

    // Check for past tense (former colleagues)
    if (query.includes('used to') || query.includes('former') || query.includes('previously')) {
      intent.modifiers.push('historical');
    }

    return intent;
  }

  /**
   * Build MongoDB query from search intent
   * @param {Object} intent - Parsed search intent
   * @param {string} userId - User ID for filtering
   * @returns {Object} MongoDB query object
   */
  buildMongoQuery(intent, userId) {
    const query = { userId: userId };
    const orConditions = [];

    // Function-based search
    if (intent.function) {
      const functionPatterns = this.jobFunctionPatterns[intent.function];
      const functionRegex = new RegExp(functionPatterns.join('|'), 'i');
      
      orConditions.push(
        { 'priorityData.employment.current.jobFunction': functionRegex },
        { 'priorityData.employment.history.jobFunction': functionRegex },
        { 'allTags.name': functionRegex }
      );
    }

    // Location-based search
    if (intent.location) {
      const locationPatterns = this.locationPatterns[intent.location];
      const locationRegex = new RegExp(locationPatterns.join('|'), 'i');
      
      orConditions.push(
        { 'priorityData.location.current': locationRegex },
        { 'priorityData.location.hometown': locationRegex },
        { 'priorityData.location.workLocations': locationRegex }
      );
    }

    // Company-based search
    if (intent.company) {
      const companyRegex = new RegExp(intent.company, 'i');
      
      if (intent.modifiers.includes('historical')) {
        orConditions.push(
          { 'priorityData.employment.history.employer': companyRegex }
        );
      } else {
        orConditions.push(
          { 'priorityData.employment.current.employer': companyRegex },
          { 'priorityData.employment.history.employer': companyRegex }
        );
      }
    }

    // Interest/skill-based search
    if (intent.interest) {
      const interestPatterns = this.interestPatterns[intent.interest];
      const interestRegex = new RegExp(interestPatterns.join('|'), 'i');
      
      orConditions.push(
        { 'priorityData.social.interests.name': interestRegex },
        { 'priorityData.social.hobbies': interestRegex },
        { 'allTags.name': interestRegex }
      );
    }

    // Add OR conditions to query
    if (orConditions.length > 0) {
      query.$or = orConditions;
    }

    return query;
  }

  /**
   * Rank search results by relevance to intent
   * @param {Array} contacts - Raw contact results
   * @param {Object} intent - Search intent
   * @returns {Array} Ranked contacts with scores
   */
  rankSearchResults(contacts, intent) {
    return contacts.map(contact => {
      let relevanceScore = 0;
      const reasons = [];

      // Score current employment matches higher than historical
      if (intent.function && contact.priorityData?.employment?.current?.jobFunction) {
        const currentJob = contact.priorityData.employment.current.jobFunction.toLowerCase();
        const patterns = this.jobFunctionPatterns[intent.function] || [];
        
        if (patterns.some(pattern => currentJob.includes(pattern))) {
          relevanceScore += 10;
          reasons.push(`Current role: ${contact.priorityData.employment.current.jobFunction}`);
        }
      }

      // Score current location matches
      if (intent.location && contact.priorityData?.location?.current) {
        const currentLocation = contact.priorityData.location.current.toLowerCase();
        const patterns = this.locationPatterns[intent.location] || [];
        
        if (patterns.some(pattern => currentLocation.includes(pattern))) {
          relevanceScore += 8;
          reasons.push(`Located in: ${contact.priorityData.location.current}`);
        }
      }

      // Score company matches
      if (intent.company && contact.priorityData?.employment?.current?.employer) {
        const employer = contact.priorityData.employment.current.employer.toLowerCase();
        if (employer.includes(intent.company.toLowerCase())) {
          relevanceScore += 12;
          reasons.push(`Works at: ${contact.priorityData.employment.current.employer}`);
        }
      }

      // Score recent enrichment higher
      if (contact.lastEnriched) {
        const daysSinceEnrichment = (Date.now() - contact.lastEnriched.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceEnrichment < 30) {
          relevanceScore += 2;
        }
      }

      return {
        contact: contact,
        relevanceScore: relevanceScore,
        matchReasons: reasons,
        name: contact.name,
        currentJob: contact.priorityData?.employment?.current?.jobFunction,
        currentEmployer: contact.priorityData?.employment?.current?.employer,
        currentLocation: contact.priorityData?.location?.current
      };
    })
    .filter(result => result.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Generate human-readable explanation of search results
   * @param {Object} intent - Search intent
   * @param {number} resultCount - Number of results found
   * @returns {string} Search explanation
   */
  generateSearchExplanation(intent, resultCount) {
    let explanation = `Found ${resultCount} contacts`;

    if (intent.function && intent.location) {
      explanation += ` who work in ${intent.function} and are located in ${intent.location}`;
    } else if (intent.function) {
      explanation += ` who work in ${intent.function}`;
    } else if (intent.location) {
      explanation += ` who are located in ${intent.location}`;
    } else if (intent.company) {
      explanation += ` who work at ${intent.company}`;
    } else if (intent.interest) {
      explanation += ` who are interested in ${intent.interest}`;
    }

    if (intent.modifiers.includes('historical')) {
      explanation += ' (including past positions)';
    }

    return explanation;
  }

  /**
   * Generate search suggestions for refinement
   * @param {Object} intent - Current search intent
   * @returns {Array} Suggested search refinements
   */
  generateSearchSuggestions(intent) {
    const suggestions = [];

    if (intent.type === 'function') {
      suggestions.push(
        `Try adding location: "${intent.function} in Austin"`,
        `Try specific company: "${intent.function} at Google"`
      );
    } else if (intent.type === 'location') {
      suggestions.push(
        `Try adding role: "marketing in ${intent.location}"`,
        `Try adding interest: "${intent.location} and music"`
      );
    } else if (intent.type === 'unknown') {
      suggestions.push(
        'Try job functions: "marketing", "engineering", "design"',
        'Try locations: "Austin", "San Francisco", "New York"',
        'Try companies: "who works at Google"'
      );
    }

    return suggestions;
  }

  /**
   * Get search analytics and popular queries
   * @param {string} userId - User ID
   * @returns {Object} Search analytics data
   */
  async getSearchAnalytics(userId) {
    try {
      // This would track user search patterns over time
      // For now, return sample analytics
      return {
        popularQueries: [
          'marketing in Austin',
          'engineers at Google',
          'designers in San Francisco',
          'who works at Microsoft'
        ],
        searchTips: [
          'Use job functions: marketing, engineering, design, sales',
          'Include locations: Austin, SF, NYC, Seattle',
          'Try company searches: "who works at [company]"',
          'Combine terms: "marketing in Austin"'
        ],
        recentSearches: [] // Would be populated from user history
      };
    } catch (error) {
      logger.error('Failed to get search analytics', { userId, error: error.message });
      return { popularQueries: [], searchTips: [], recentSearches: [] };
    }
  }
}

module.exports = new NaturalLanguageSearchService();