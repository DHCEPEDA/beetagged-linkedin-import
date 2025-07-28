// Serverless function for contact search
// Deploy to Vercel/Netlify as: /api/search-contacts

const mongoose = require('mongoose');

// MongoDB connection
async function connectMongoDB() {
  if (mongoose.connection.readyState === 1) return;
  
  const mongoOptions = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    retryWrites: true
  };
  
  await mongoose.connect(process.env.MONGODB_URI, mongoOptions);
}

// Contact schema
const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  company: String,
  position: String,
  location: String,
  connectedOn: Date,
  source: { type: String, default: 'linkedin' },
  createdAt: { type: Date, default: Date.now }
});

const Contact = mongoose.models.Contact || mongoose.model('Contact', contactSchema);

// Natural language search patterns
const searchPatterns = {
  companies: ['google', 'microsoft', 'apple', 'amazon', 'meta', 'tesla', 'netflix', 'uber', 'airbnb', 'spotify'],
  roles: ['engineer', 'manager', 'designer', 'developer', 'analyst', 'consultant', 'director', 'ceo', 'cto'],
  locations: ['austin', 'san francisco', 'new york', 'seattle', 'boston', 'chicago', 'miami', 'denver']
};

function buildSearchQuery(query) {
  const searchTerms = query.toLowerCase().split(/\s+/);
  const conditions = [];

  // Text search across all fields
  conditions.push({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { company: { $regex: query, $options: 'i' } },
      { position: { $regex: query, $options: 'i' } },
      { location: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } }
    ]
  });

  // Enhanced pattern matching
  searchTerms.forEach(term => {
    if (searchPatterns.companies.includes(term)) {
      conditions.push({ company: { $regex: term, $options: 'i' } });
    }
    if (searchPatterns.roles.includes(term)) {
      conditions.push({ position: { $regex: term, $options: 'i' } });
    }
    if (searchPatterns.locations.includes(term)) {
      conditions.push({ location: { $regex: term, $options: 'i' } });
    }
  });

  return conditions.length > 1 ? { $or: conditions } : conditions[0] || {};
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectMongoDB();

    const { q: query } = req.query;

    if (!query || query.trim().length === 0) {
      // Return all contacts if no query
      const contacts = await Contact.find({})
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      return res.status(200).json({
        contacts,
        total: contacts.length,
        query: ''
      });
    }

    // Build search query
    const searchQuery = buildSearchQuery(query.trim());
    
    // Execute search with timeout
    const contacts = await Contact.find(searchQuery)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
      .maxTimeMS(10000);

    res.status(200).json({
      contacts,
      total: contacts.length,
      query: query.trim()
    });

  } catch (error) {
    console.error('Search function error:', error);
    
    if (error.name === 'MongooseServerSelectionError') {
      return res.status(503).json({ 
        error: 'Database temporarily unavailable',
        contacts: [],
        total: 0 
      });
    }

    res.status(500).json({ 
      error: 'Search failed',
      contacts: [],
      total: 0 
    });
  }
}