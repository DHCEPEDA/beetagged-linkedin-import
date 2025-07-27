const express = require('express');
const router = express.Router();
const { performAISearch, performNaturalSearch } = require('../services/searchService');
const Contact = require('../models/Contact');

// Natural language search - Enhanced from existing code
router.get('/natural', async (req, res) => {
  try {
    const query = req.query.q?.toLowerCase() || '';
    const userId = req.query.userId;
    
    console.log(`Search query: "${query}"`);
    
    if (!query) {
      const baseQuery = userId ? { userId } : {};
      const allContacts = await Contact.find(baseQuery).sort({ createdAt: -1 });
      console.log(`Returning all ${allContacts.length} contacts`);
      return res.json({ results: allContacts });
    }

    // Use enhanced natural search
    const results = await performNaturalSearch(query, userId);
    console.log(`Found ${results.length} results for "${query}"`);
    
    res.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed', results: [] });
  }
});

// AI-powered contact search with OpenAI
router.post('/ai-search', async (req, res) => {
  try {
    const { query, userId, filters = {} } = req.body;
    
    // Get user's contacts
    const baseQuery = userId ? { userId } : {};
    const userContacts = await Contact.find(baseQuery);
    
    // Perform AI search
    const searchResults = await performAISearch(query, userContacts, filters);
    
    res.json({
      query,
      totalResults: searchResults.length,
      results: searchResults
    });
  } catch (error) {
    console.error('AI search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Traditional search with filters
router.post('/filter', async (req, res) => {
  try {
    const { userId, filters } = req.body;
    
    let query = userId ? { userId } : {};
    
    if (filters.skills) {
      query.skills = { $in: filters.skills };
    }
    if (filters.tags) {
      query.tags = { $in: filters.tags };
    }
    if (filters.location) {
      query.location = new RegExp(filters.location, 'i');
    }
    if (filters.company) {
      query.company = new RegExp(filters.company, 'i');
    }
    if (filters.position) {
      query.position = new RegExp(filters.position, 'i');
    }
    if (filters.source) {
      query.source = filters.source;
    }
    
    const contacts = await Contact.find(query).sort({ createdAt: -1 });
    res.json({ results: contacts });
  } catch (error) {
    console.error('Filter search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Autocomplete search suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const { q, userId, type = 'all' } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }
    
    const baseQuery = userId ? { userId } : {};
    const regex = new RegExp(q, 'i');
    
    let suggestions = [];
    
    if (type === 'all' || type === 'companies') {
      const companies = await Contact.distinct('company', {
        ...baseQuery,
        company: { $regex: regex, $ne: null, $ne: '' }
      });
      suggestions.push(...companies.map(c => ({ type: 'company', value: c })));
    }
    
    if (type === 'all' || type === 'positions') {
      const positions = await Contact.distinct('position', {
        ...baseQuery,
        position: { $regex: regex, $ne: null, $ne: '' }
      });
      suggestions.push(...positions.map(p => ({ type: 'position', value: p })));
    }
    
    if (type === 'all' || type === 'locations') {
      const locations = await Contact.distinct('location', {
        ...baseQuery,
        location: { $regex: regex, $ne: null, $ne: '' }
      });
      suggestions.push(...locations.map(l => ({ type: 'location', value: l })));
    }
    
    res.json({ suggestions: suggestions.slice(0, 10) });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;