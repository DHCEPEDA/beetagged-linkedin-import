// Serverless function to get all contacts
// Deploy to Vercel/Netlify as: /api/get-contacts

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

    const { limit = 50, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get contacts with pagination
    const contacts = await Contact.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean()
      .maxTimeMS(10000);

    // Get total count
    const total = await Contact.countDocuments({});

    res.status(200).json({
      contacts,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      hasMore: skip + contacts.length < total
    });

  } catch (error) {
    console.error('Get contacts function error:', error);
    
    if (error.name === 'MongooseServerSelectionError') {
      return res.status(503).json({ 
        error: 'Database temporarily unavailable',
        contacts: [],
        total: 0 
      });
    }

    res.status(500).json({ 
      error: 'Failed to fetch contacts',
      contacts: [],
      total: 0 
    });
  }
}