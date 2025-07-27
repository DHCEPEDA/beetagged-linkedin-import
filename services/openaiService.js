const OpenAI = require('openai');

// Initialize OpenAI only if API key is available
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * Generate search embeddings for semantic search
 */
async function generateSearchEmbedding(query) {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }
  
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('OpenAI embedding error:', error);
    throw error;
  }
}

/**
 * AI-powered contact ranking based on search query
 */
async function rankContacts(query, contacts) {
  if (!openai) {
    console.log('OpenAI not configured, returning contacts in original order');
    return contacts;
  }
  
  try {
    // Limit contacts to avoid token limits
    const contactsToRank = contacts.slice(0, 50);
    
    const prompt = `
Given this search query: "${query}"

Rank these contacts from most to least relevant based on the query. Consider their job titles, companies, skills, and how well they match what the user is looking for.

Contacts:
${contactsToRank.map((c, i) => 
  `${i+1}. ${c.name} - ${c.position || 'Unknown Position'} at ${c.company || 'Unknown Company'} ${c.location ? `(${c.location})` : ''} ${c.tags ? `[${c.tags.join(', ')}]` : ''}`
).join('\n')}

Return only the numbers in order of relevance (most relevant first), separated by commas.
Example: 3,1,5,2,4
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Using latest model as specified in blueprint
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0.3
    });

    const rankingText = response.choices[0].message.content.trim();
    const ranking = rankingText
      .split(/[,\s]+/)
      .map(n => parseInt(n.trim()))
      .filter(n => !isNaN(n) && n >= 1 && n <= contactsToRank.length);

    // Reorder contacts based on AI ranking
    const rankedContacts = [];
    ranking.forEach(index => {
      if (contactsToRank[index - 1]) {
        rankedContacts.push({
          ...contactsToRank[index - 1],
          relevanceScore: (ranking.length - ranking.indexOf(index)) / ranking.length
        });
      }
    });

    // Add any unranked contacts at the end
    contactsToRank.forEach((contact, index) => {
      if (!ranking.includes(index + 1)) {
        rankedContacts.push({
          ...contact,
          relevanceScore: 0
        });
      }
    });

    // Add remaining contacts that weren't processed due to limit
    if (contacts.length > 50) {
      contacts.slice(50).forEach(contact => {
        rankedContacts.push({
          ...contact,
          relevanceScore: 0
        });
      });
    }

    console.log(`AI ranked ${rankedContacts.length} contacts for query: "${query}"`);
    return rankedContacts;
  } catch (error) {
    console.error('OpenAI ranking error:', error);
    // Return original order with zero relevance scores if AI fails
    return contacts.map(contact => ({
      ...contact,
      relevanceScore: 0
    }));
  }
}

/**
 * Generate contact insights using AI
 */
async function generateContactInsights(contact) {
  if (!openai) {
    return { insights: [], summary: 'AI insights not available' };
  }
  
  try {
    const prompt = `
Analyze this professional contact and provide insights:

Name: ${contact.name}
Company: ${contact.company || 'Unknown'}
Position: ${contact.position || 'Unknown'}
Location: ${contact.location || 'Unknown'}
Skills/Tags: ${contact.tags?.join(', ') || 'None listed'}

Provide:
1. 3 key professional insights about this person
2. Potential networking opportunities
3. Conversation starters or common interests

Keep it professional and actionable.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.7
    });

    const insights = response.choices[0].message.content;
    
    return {
      insights: insights.split('\n').filter(line => line.trim()),
      summary: `AI-generated insights for ${contact.name}`,
      generatedAt: new Date()
    };
  } catch (error) {
    console.error('Contact insights error:', error);
    return { 
      insights: [], 
      summary: 'Unable to generate insights at this time',
      error: error.message 
    };
  }
}

/**
 * Suggest contact tags using AI
 */
async function suggestContactTags(contact) {
  if (!openai) {
    return [];
  }
  
  try {
    const prompt = `
Based on this contact information, suggest 3-5 relevant professional tags:

Name: ${contact.name}
Company: ${contact.company || 'Unknown'}
Position: ${contact.position || 'Unknown'}
Location: ${contact.location || 'Unknown'}

Return only the tags, one per line, without numbers or bullets.
Tags should be professional categories, skills, or industries.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
      temperature: 0.5
    });

    const tags = response.choices[0].message.content
      .split('\n')
      .map(tag => tag.trim())
      .filter(tag => tag && !tag.match(/^\d+\./) && tag.length > 2)
      .slice(0, 5);

    return tags;
  } catch (error) {
    console.error('Tag suggestion error:', error);
    return [];
  }
}

module.exports = {
  generateSearchEmbedding,
  rankContacts,
  generateContactInsights,
  suggestContactTags
};