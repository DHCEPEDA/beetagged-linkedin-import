// Serverless function for health check
// Deploy to Vercel/Netlify as: /api/health

const mongoose = require('mongoose');

// MongoDB connection
async function connectMongoDB() {
  if (mongoose.connection.readyState === 1) return true;
  
  try {
    const mongoOptions = {
      serverSelectionTimeoutMS: 3000,
      socketTimeoutMS: 5000,
      maxPoolSize: 5,
      retryWrites: true
    };
    
    await mongoose.connect(process.env.MONGODB_URI, mongoOptions);
    return true;
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    return false;
  }
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

  const startTime = process.hrtime();
  
  try {
    // Test MongoDB connection
    const mongoConnected = await connectMongoDB();
    
    let contactCount = 0;
    if (mongoConnected) {
      try {
        const Contact = mongoose.models.Contact || mongoose.model('Contact', new mongoose.Schema({
          name: String,
          email: String,
          company: String,
          position: String,
          createdAt: { type: Date, default: Date.now }
        }));
        
        contactCount = await Contact.countDocuments({});
      } catch (countError) {
        console.error('Contact count failed:', countError);
      }
    }

    const [seconds, nanoseconds] = process.hrtime(startTime);
    const uptime = seconds + nanoseconds / 1e9;

    res.status(200).json({
      status: 'healthy',
      server: 'BeeTagged Serverless',
      contacts: contactCount,
      mongodb: mongoConnected ? 'connected' : 'disconnected',
      mongoState: mongoose.connection.readyState,
      environment: process.env.NODE_ENV || 'development',
      uptime: uptime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Health check error:', error);
    
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const uptime = seconds + nanoseconds / 1e9;

    res.status(500).json({
      status: 'unhealthy',
      server: 'BeeTagged Serverless',
      error: error.message,
      uptime: uptime,
      timestamp: new Date().toISOString()
    });
  }
}