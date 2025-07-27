const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const { rankContacts } = require('../services/openaiService');

// Submit contact rankings
router.post('/submit', async (req, res) => {
  try {
    const { contactId, rankings, userId } = req.body;
    
    // Validate rankings
    const validCategories = ['coding', 'cooking', 'intelligence', 'networking', 'leadership'];
    const validatedRankings = {};
    
    for (const [category, score] of Object.entries(rankings)) {
      if (validCategories.includes(category) && typeof score === 'number' && score >= 1 && score <= 10) {
        validatedRankings[`ranking.${category}`] = score;
      }
    }
    
    if (Object.keys(validatedRankings).length === 0) {
      return res.status(400).json({ error: 'No valid rankings provided' });
    }
    
    // Update contact with rankings
    const query = userId ? { _id: contactId, userId } : { _id: contactId };
    const contact = await Contact.findOneAndUpdate(
      query,
      { 
        ...validatedRankings,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Rankings submitted successfully',
      contact 
    });
  } catch (error) {
    console.error('Ranking submission error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get contact rankings
router.get('/:contactId', async (req, res) => {
  try {
    const { contactId } = req.params;
    const { userId } = req.query;
    
    const query = userId ? { _id: contactId, userId } : { _id: contactId };
    const contact = await Contact.findOne(query, 'name ranking');
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json({ 
      contactId: contact._id,
      name: contact.name,
      ranking: contact.ranking || {}
    });
  } catch (error) {
    console.error('Get ranking error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get top ranked contacts in category
router.get('/top/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { userId, limit = 10 } = req.query;
    
    const validCategories = ['coding', 'cooking', 'intelligence', 'networking', 'leadership'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid ranking category' });
    }
    
    const query = userId ? { userId } : {};
    const sortField = `ranking.${category}`;
    
    const topContacts = await Contact.find({
      ...query,
      [sortField]: { $exists: true, $ne: null }
    })
    .sort({ [sortField]: -1, createdAt: -1 })
    .limit(parseInt(limit))
    .select('name company position ranking');
    
    res.json({ 
      category,
      topContacts: topContacts.map(contact => ({
        id: contact._id,
        name: contact.name,
        company: contact.company,
        position: contact.position,
        score: contact.ranking[category]
      }))
    });
  } catch (error) {
    console.error('Top ranked contacts error:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI-powered contact ranking
router.post('/ai-rank', async (req, res) => {
  try {
    const { query, contactIds, userId } = req.body;
    
    if (!query || !contactIds || !Array.isArray(contactIds)) {
      return res.status(400).json({ error: 'Query and contact IDs required' });
    }
    
    // Get contacts
    const baseQuery = userId ? { userId } : {};
    const contacts = await Contact.find({
      ...baseQuery,
      _id: { $in: contactIds }
    });
    
    // Use AI to rank contacts
    const rankedContacts = await rankContacts(query, contacts);
    
    res.json({
      query,
      rankedContacts: rankedContacts.map(contact => ({
        id: contact._id,
        name: contact.name,
        company: contact.company,
        position: contact.position,
        relevanceScore: contact.relevanceScore || 0
      }))
    });
  } catch (error) {
    console.error('AI ranking error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;