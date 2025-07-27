const Contact = require('../models/Contact');
const { rankContacts } = require('./openaiService');

/**
 * Enhanced Natural Language Search
 * Performs sophisticated search with pattern matching and keyword analysis
 */
async function performNaturalSearch(query, userId = null) {
  const searchConditions = [];
  const keywords = query.split(/\s+/);
  
  // Build comprehensive search conditions
  for (const keyword of keywords) {
    if (keyword.length > 1) { // Skip single characters
      searchConditions.push({
        $or: [
          { name: { $regex: keyword, $options: 'i' } },
          { company: { $regex: keyword, $options: 'i' } },
          { position: { $regex: keyword, $options: 'i' } },
          { location: { $regex: keyword, $options: 'i' } },
          { email: { $regex: keyword, $options: 'i' } },
          { tags: { $elemMatch: { $regex: keyword, $options: 'i' } } }
        ]
      });
    }
  }

  // Specific pattern matching for common queries
  if (query.includes('basketball') || query.includes('sports')) {
    searchConditions.push({
      $or: [
        { tags: { $elemMatch: { $regex: 'basketball|sports|athletic', $options: 'i' } } },
        { company: { $regex: 'nba|basketball|sports', $options: 'i' } },
        { position: { $regex: 'basketball|sports|athletic', $options: 'i' } }
      ]
    });
  }

  if (query.includes('round rock') || query.includes('austin')) {
    searchConditions.push({
      $or: [
        { location: { $regex: 'round rock|austin|texas', $options: 'i' } },
        { tags: { $elemMatch: { $regex: 'round rock|austin|texas', $options: 'i' } } }
      ]
    });
  }

  // Tech companies search
  if (query.includes('tech') || query.includes('google') || query.includes('microsoft') || query.includes('apple')) {
    searchConditions.push({
      $or: [
        { company: { $regex: 'google|microsoft|apple|amazon|meta|facebook|tech', $options: 'i' } },
        { tags: { $elemMatch: { $regex: 'technology|tech|google|microsoft|apple', $options: 'i' } } }
      ]
    });
  }

  // Build final query
  let searchQuery = {};
  if (searchConditions.length > 0) {
    searchQuery.$and = searchConditions;
  }
  
  // Add user filter if provided
  if (userId) {
    searchQuery.userId = userId;
  }

  console.log('Search query object:', JSON.stringify(searchQuery, null, 2));
  
  const results = await Contact.find(searchQuery).sort({ createdAt: -1 });
  return results;
}

/**
 * AI-Powered Search with OpenAI Integration
 */
async function performAISearch(query, contacts, filters = {}) {
  try {
    // Apply basic filters first
    let filteredContacts = contacts;
    
    if (filters.company) {
      filteredContacts = filteredContacts.filter(c => 
        c.company && c.company.toLowerCase().includes(filters.company.toLowerCase())
      );
    }
    
    if (filters.location) {
      filteredContacts = filteredContacts.filter(c => 
        c.location && c.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    
    if (filters.skills && filters.skills.length > 0) {
      filteredContacts = filteredContacts.filter(c => 
        c.skills && c.skills.some(skill => 
          filters.skills.some(filterSkill => 
            skill.toLowerCase().includes(filterSkill.toLowerCase())
          )
        )
      );
    }

    // Use AI ranking if available, otherwise fall back to natural search
    if (filteredContacts.length > 0 && process.env.OPENAI_API_KEY) {
      return await rankContacts(query, filteredContacts);
    } else {
      // Fall back to natural language search patterns
      return filteredContacts.filter(contact => {
        const searchText = `${contact.name} ${contact.company} ${contact.position} ${contact.location} ${contact.tags?.join(' ')}`.toLowerCase();
        return query.toLowerCase().split(' ').some(term => searchText.includes(term));
      });
    }
  } catch (error) {
    console.error('AI search error:', error);
    // Fall back to basic search
    return contacts.filter(contact => {
      const searchText = `${contact.name} ${contact.company} ${contact.position}`.toLowerCase();
      return searchText.includes(query.toLowerCase());
    });
  }
}

/**
 * Semantic Search with Text Embeddings
 */
async function performSemanticSearch(query, userId = null) {
  try {
    // TODO: Implement semantic search with vector embeddings
    // This would require storing embeddings for each contact
    console.log('Semantic search not yet implemented, falling back to natural search');
    return await performNaturalSearch(query, userId);
  } catch (error) {
    console.error('Semantic search error:', error);
    return await performNaturalSearch(query, userId);
  }
}

/**
 * Advanced Search with Multiple Criteria
 */
async function performAdvancedSearch(criteria, userId = null) {
  let query = userId ? { userId } : {};
  
  if (criteria.name) {
    query.name = { $regex: criteria.name, $options: 'i' };
  }
  
  if (criteria.company) {
    query.company = { $regex: criteria.company, $options: 'i' };
  }
  
  if (criteria.position) {
    query.position = { $regex: criteria.position, $options: 'i' };
  }
  
  if (criteria.location) {
    query.location = { $regex: criteria.location, $options: 'i' };
  }
  
  if (criteria.tags && criteria.tags.length > 0) {
    query.tags = { $in: criteria.tags };
  }
  
  if (criteria.skills && criteria.skills.length > 0) {
    query.skills = { $in: criteria.skills };
  }
  
  if (criteria.source) {
    query.source = criteria.source;
  }
  
  // Date range filters
  if (criteria.createdAfter || criteria.createdBefore) {
    query.createdAt = {};
    if (criteria.createdAfter) {
      query.createdAt.$gte = new Date(criteria.createdAfter);
    }
    if (criteria.createdBefore) {
      query.createdAt.$lte = new Date(criteria.createdBefore);
    }
  }
  
  const results = await Contact.find(query).sort({ createdAt: -1 });
  return results;
}

module.exports = {
  performNaturalSearch,
  performAISearch,
  performSemanticSearch,
  performAdvancedSearch
};