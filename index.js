const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const axios = require('axios');
const OpenAI = require('openai');
const similarity = require('compute-cosine-similarity');

const app = express();
const port = process.env.PORT || 5000;

// Initialize OpenAI for semantic search
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ===== SECURITY & MIDDLEWARE =====
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(express.json());

// Enhanced CORS configuration with environment-based security
app.use(cors({
  origin: function (origin, callback) {
    const prodOrigins = [
      'https://www.beetagged.com',
      'https://beetagged.com',
      'https://beetagged.squarespace.com'
    ];
    
    const devOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://127.0.0.1:3000',
      'https://replit.dev'
    ];
    
    let allowedOrigins;
    if (process.env.NODE_ENV === 'production') {
      allowedOrigins = prodOrigins;
    } else {
      allowedOrigins = [...prodOrigins, ...devOrigins];
    }
    
    // Check for exact origin match or replit dev domains
    const isAllowed = !origin || // Same origin requests
      allowedOrigins.includes(origin) ||
      (process.env.NODE_ENV !== 'production' && origin && (
        origin.includes('.replit.dev') || 
        origin.includes('.repl.co')
      ));
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Trust proxy for Heroku
app.set('trust proxy', 1);

// Rate limiting with Heroku proxy trust
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  trustProxy: true
});
app.use(limiter);

// Logging
app.use(morgan('combined'));

// Serve static files from dist directory (for Squarespace bundle)
app.use('/dist', express.static('dist', {
  setHeaders: (res, path) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  }
}));

// ===== MONGODB CONNECTION =====

function connectMongoDB() {
  // Fix database name from 'test' to 'beetagged' (only if MONGODB_URI contains '/test?')
  const originalUri = process.env.MONGODB_URI;
  if (!originalUri) {
    console.error('❌ MONGODB_URI environment variable not set');
    return;
  }
  
  const mongoUri = originalUri.includes('/test?') ? originalUri.replace('/test?', '/beetagged?') : originalUri;
  console.log('Connecting to MongoDB with database: beetagged');
  
  const mongoOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    retryWrites: true,
    w: 'majority'
  };

  mongoose.connect(mongoUri, mongoOptions)
    .then(async () => {
      console.log('MongoDB Atlas connected successfully');
      console.log('Database:', mongoose.connection.db.databaseName);
      
      // Ensure text search index exists for search functionality
      try {
        const indexes = await mongoose.connection.db.collection('contacts').indexes();
        console.log('Current indexes:', indexes.map(idx => idx.name));
        
        const hasTextIndex = indexes.some(idx => 
          idx.name.includes('text') || 
          (idx.key && typeof idx.key === 'object' && Object.values(idx.key).includes('text'))
        );
        
        if (!hasTextIndex) {
          console.log('Creating text search index...');
          await mongoose.connection.db.collection('contacts').createIndex({
            name: 'text',
            company: 'text',
            position: 'text',
            location: 'text',
            'tags.value': 'text',
            searchableText: 'text'
          });
          console.log('✅ Text search index created successfully');
        } else {
          console.log('✅ Text search index already exists');
        }
      } catch (indexError) {
        console.error('Warning: Could not create text search index:', indexError.message);
      }
    })
    .catch(err => {
      console.error('MongoDB connection error:', err);
      console.error('Connection string prefix:', mongoUri ? mongoUri.substring(0, 20) + '...' : 'undefined');
    });

  mongoose.connection.on('error', err => {
    console.error('MongoDB runtime error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected');
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    mongoose.connection.close(() => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  });
}

connectMongoDB();

// ===== MONGODB SCHEMA =====

const contactSchema = new mongoose.Schema({
  // Basic contact information
  name: String,
  email: { type: String, default: '', index: true },
  emails: [String], // Support for multiple emails from Contacts CSV
  phone: String,
  phoneNumber: { type: String, default: '', index: true },
  phoneNumbers: [String], // Support for multiple phone numbers from Contacts CSV
  company: { type: String, default: '', index: true },
  companies: [String], // Support for multiple companies from Contacts CSV
  position: { type: String, default: '' },
  jobTitle: { type: String, default: '' },
  location: { type: String, default: '', index: true },
  addresses: [String], // Support for multiple addresses from Contacts CSV
  
  // Social media profiles
  linkedinId: { type: String, default: '' },
  linkedinUrl: { type: String, default: '' },
  linkedinProfile: { type: String, default: '' },
  facebookId: { type: String, default: '' },
  profilePicture: { type: String, default: '' },
  sites: [String], // Support for multiple websites from Contacts CSV
  profiles: [String], // Social profiles from Contacts CSV
  
  // Additional Contacts CSV fields
  birthday: { type: String, default: '' }, // Store as string to handle various date formats
  birthdayParsed: { type: Date, default: null }, // Parsed birthday as Date
  instantMessageHandles: [String], // Support for multiple IM handles
  bookmarkedAt: { type: String, default: '' }, // Store as string initially
  bookmarkedAtParsed: { type: Date, default: null }, // Parsed bookmarked date as Date
  originalCreatedAt: { type: String, default: '' }, // For 'created at' field from Contacts CSV
  originalCreatedAtParsed: { type: Date, default: null }, // Parsed created date as Date
  
  // Enhanced LinkedIn fields
  currentPosition: {
    title: String,
    company: String,
    startDate: String,
    description: String
  },
  
  // Professional history
  experience: [{
    company: String,
    title: String,
    startDate: String,
    endDate: String,
    description: String,
    location: String
  }],
  
  // Education background
  education: [{
    school: String,
    degree: String,
    startYear: String,
    endYear: String,
    activities: String,
    notes: String
  }],
  
  // Skills and insights extracted from LinkedIn
  skills: [String],
  interests: [String],
  industries: [String],
  expertise_areas: [String],
  
  // AI-generated fields for semantic search
  embedding: [Number], // Vector embedding for semantic search
  personality_traits: [String],
  career_stage: String, // junior, mid, senior, executive
  
  // Search and metadata
  tags: [String],
  searchableText: { type: String, default: '' },
  source: String,
  connectedOn: String,
  lastEmbeddingUpdate: { type: Date, default: Date.now },
  userId: { type: String, default: null, index: true },
  
  // Audit trail and merge history
  mergeHistory: [{
    timestamp: { type: Date, default: Date.now },
    action: { type: String, enum: ['create', 'merge', 'update'], default: 'create' },
    sourceContactId: String,
    sourceData: String,
    mergedFields: [String]
  }],
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create indexes for enhanced search
contactSchema.index({ embedding: 1 });
contactSchema.index({ skills: 1 });
contactSchema.index({ expertise_areas: 1 });
contactSchema.index({ industries: 1 });

const Contact = mongoose.model('Contact', contactSchema);

// ===== AI & SEMANTIC SEARCH FUNCTIONS =====

// LinkedIn Data Processor Class
class LinkedInDataProcessor {
  
  // Extract skills from job descriptions using NLP patterns
  extractSkills(text) {
    const skillPatterns = [
      /\b(JavaScript|Python|React|Node\.js|TypeScript|SQL|MongoDB|AWS|Azure|Docker|Kubernetes|Java|C\+\+|C#|PHP|Ruby|Go|Swift|Kotlin)\b/gi,
      /\b(Marketing|Sales|Analytics|Strategy|Operations|Finance|HR|Legal|Consulting|Management)\b/gi,
      /\b(Machine Learning|AI|Data Science|Analytics|Business Intelligence|DevOps|Cloud Computing)\b/gi,
      /\b(Leadership|Management|Team Building|Cross-functional|Project Management|Agile|Scrum)\b/gi
    ];
    
    const skills = new Set();
    skillPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => skills.add(match.toLowerCase()));
    });
    
    return Array.from(skills);
  }

  // Extract interests and personality traits
  extractInterests(text) {
    const interestPatterns = [
      /\b(chess|soccer|basketball|hiking|photography|music|travel|cooking|gaming|reading)\b/gi,
      /\b(entrepreneurship|startups|innovation|technology|sustainability|blockchain|crypto)\b/gi,
      /\b(volunteer|community|nonprofit|social impact|mentoring|education|teaching)\b/gi
    ];
    
    const interests = new Set();
    interestPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => interests.add(match.toLowerCase()));
    });
    
    return Array.from(interests);
  }

  // Determine expertise areas based on experience
  determineExpertiseAreas(text) {
    const expertiseMap = {
      'Product Marketing': ['marketing', 'product', 'go-to-market', 'positioning', 'messaging', 'brand'],
      'Data Analytics': ['analytics', 'data', 'metrics', 'reporting', 'business intelligence', 'statistics'],
      'Sales Strategy': ['sales', 'revenue', 'pipeline', 'forecasting', 'account management', 'business development'],
      'Entrepreneurship': ['founder', 'startup', 'entrepreneur', 'venture', 'innovation', 'business development'],
      'Technology': ['software', 'platform', 'cloud', 'AI', 'automation', 'digital', 'engineering', 'development'],
      'Leadership': ['director', 'manager', 'team', 'leadership', 'strategy', 'executive', 'ceo', 'cto', 'cmo']
    };

    const expertise = new Set();
    const allText = text.toLowerCase();

    Object.entries(expertiseMap).forEach(([area, keywords]) => {
      if (keywords.some(keyword => allText.includes(keyword))) {
        expertise.add(area);
      }
    });

    return Array.from(expertise);
  }

  // Determine career stage based on title and experience
  determineCareerStage(currentPosition, experienceCount) {
    if (!currentPosition || !currentPosition.title) return 'mid';
    
    const title = currentPosition.title.toLowerCase();
    
    if (title.includes('intern') || title.includes('junior') || title.includes('associate') || experienceCount <= 2) {
      return 'junior';
    } else if (title.includes('senior') || title.includes('lead') || title.includes('principal') || experienceCount >= 8) {
      return 'senior';
    } else if (title.includes('director') || title.includes('vp') || title.includes('ceo') || title.includes('cto') || title.includes('cmo') || title.includes('head of')) {
      return 'executive';
    } else {
      return 'mid';
    }
  }

  // Enhanced contact enrichment
  enhanceContact(contact) {
    const allText = [
      contact.company || '',
      contact.position || '',
      contact.jobTitle || '',
      contact.location || '',
      ...(contact.experience || []).map(exp => `${exp.company} ${exp.title} ${exp.description || ''}`),
      ...(contact.education || []).map(edu => `${edu.school} ${edu.degree || ''} ${edu.notes || ''}`)
    ].join(' ');

    const enriched = {
      ...contact,
      skills: this.extractSkills(allText),
      interests: this.extractInterests(allText),
      expertise_areas: this.determineExpertiseAreas(allText),
      career_stage: this.determineCareerStage(contact.currentPosition, (contact.experience || []).length),
      searchableText: allText,
      lastEmbeddingUpdate: new Date()
    };

    return enriched;
  }
}

// Generate embeddings using OpenAI
async function generateEmbedding(text) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured, skipping embedding generation');
      return null;
    }

    if (!text || text.trim().length === 0) {
      return null;
    }

    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text.substring(0, 8000), // Limit text length for API
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error.message);
    return null;
  }
}

// Enhanced semantic search function
async function semanticSearch(query, userId = null, limit = 20) {
  try {
    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query);
    
    if (!queryEmbedding) {
      // Fallback to text search
      console.log('No query embedding available, falling back to text search');
      return await textSearch(query, userId, limit);
    }

    // Get all contacts with embeddings
    const searchQuery = { embedding: { $exists: true, $ne: [] } };
    if (userId) searchQuery.userId = userId;
    
    const contacts = await Contact.find(searchQuery).lean();

    if (contacts.length === 0) {
      console.log('No contacts with embeddings found, falling back to text search');
      return await textSearch(query, userId, limit);
    }

    // Calculate similarity scores
    const results = contacts.map(contact => {
      try {
        const sim = similarity(queryEmbedding, contact.embedding);
        return {
          ...contact,
          similarity: sim || 0
        };
      } catch (err) {
        console.error('Similarity calculation error:', err.message);
        return {
          ...contact,
          similarity: 0
        };
      }
    })
    .filter(contact => contact.similarity > 0.6) // Threshold for relevance
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

    console.log(`Semantic search found ${results.length} results for "${query}"`);
    return results;
  } catch (error) {
    console.error('Semantic search error:', error.message);
    return await textSearch(query, userId, limit);
  }
}

// Fallback text search
async function textSearch(query, userId = null, limit = 20) {
  try {
    const searchQuery = { $text: { $search: query } };
    if (userId) searchQuery.userId = userId;
    
    const results = await Contact.find(searchQuery)
      .limit(limit)
      .sort({ score: { $meta: "textScore" } })
      .lean();
      
    console.log(`Text search found ${results.length} results for "${query}"`);
    return results;
  } catch (error) {
    console.error('Text search error:', error.message);
    
    // Final fallback to regex search
    const regexQuery = {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { company: { $regex: query, $options: 'i' } },
        { position: { $regex: query, $options: 'i' } },
        { location: { $regex: query, $options: 'i' } },
        { skills: { $in: [new RegExp(query, 'i')] } },
        { expertise_areas: { $in: [new RegExp(query, 'i')] } }
      ]
    };
    
    if (userId) regexQuery.userId = userId;
    
    const results = await Contact.find(regexQuery).limit(limit).lean();
    console.log(`Regex search found ${results.length} results for "${query}"`);
    return results;
  }
}

const linkedinProcessor = new LinkedInDataProcessor();

// ===== AUTHENTICATION MIDDLEWARE =====

// Enhanced authentication middleware for protected endpoints
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please provide a valid auth token.'
    });
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  if (!token || token.trim().length === 0) {
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token'
    });
  }
  
  // Production environment should use proper JWT validation
  if (process.env.NODE_ENV === 'production') {
    // In production, implement JWT verification
    try {
      // For now, use a simple verification - this should be replaced with proper JWT
      if (!token.startsWith('prod-token-') || token.length < 20) {
        return res.status(401).json({
          success: false,
          message: 'Invalid production token'
        });
      }
      // Extract user ID from production token
      const userId = token.replace('prod-token-', '').split('-')[0];
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token format'
        });
      }
      req.user = {
        id: userId,
        userId: userId,
        isAuthenticated: true
      };
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token verification failed'
      });
    }
  } else {
  
    // Development environment: Use a stable user ID for consistent data scoping
    // Generate a consistent userId based on token prefix for session continuity
    const userId = 'dev-user-' + (token.includes('beetagged-session') ? 
      token.split('-')[2] || 'anonymous' : 'anonymous');
    
    req.user = {
      id: userId,
      userId: userId,
      isAuthenticated: true
    };
  }
  
  next();
}

// Input validation middleware
function validateMergeRequest(req, res, next) {
  const { mergeDecisions } = req.body;
  
  if (!mergeDecisions || !Array.isArray(mergeDecisions)) {
    return res.status(400).json({
      success: false,
      message: 'mergeDecisions array is required'
    });
  }
  
  // Validate each decision object
  for (const decision of mergeDecisions) {
    if (!decision.action || !['add', 'merge', 'skip'].includes(decision.action)) {
      return res.status(400).json({
        success: false,
        message: 'Each decision must have a valid action: add, merge, or skip'
      });
    }
    
    if (decision.action === 'merge' && !decision.existingContactId) {
      return res.status(400).json({
        success: false,
        message: 'existingContactId is required for merge action'
      });
    }
    
    if (!decision.newContact) {
      return res.status(400).json({
        success: false,
        message: 'newContact data is required for each decision'
      });
    }
  }
  
  next();
}

// ===== FILE UPLOAD SETUP =====

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// ===== UTILITY FUNCTIONS =====

// Enhanced name normalization function
function normalizeName(name) {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .trim()
    // Remove diacritics and special characters
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    // Remove punctuation and special characters
    .replace(/[^\w\s]/g, '')
    // Normalize multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}

// Function to categorize potential duplicates by match type for automatic vs manual handling
async function findPotentialDuplicates(contactData, userId = null) {
  try {
    const normalizedNewName = normalizeName(contactData.name);
    const newNameWords = normalizedNewName.split(/\s+/).filter(w => w.length > 1);
    
    // Build search query with multiple strategies
    const query = {
      $or: [
        // Exact normalized match
        { name: { $regex: new RegExp(`^${normalizedNewName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
        // Partial word matches (only if we have valid name words)
        ...(newNameWords.length > 0 ? newNameWords.map(word => ({
          name: { $regex: new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
        })) : []),
        // Email exact match (primary identifier for automatic merging)
        ...(contactData.email ? [{ email: contactData.email.toLowerCase().trim() }] : []),
        // Phone exact match (secondary identifier) - search multiple phone fields
        ...(contactData.phone || contactData.phoneNumber || (contactData.phoneNumbers && contactData.phoneNumbers.length > 0) ? (() => {
          const phoneQueries = [];
          const phoneToSearch = contactData.phone || contactData.phoneNumber || (contactData.phoneNumbers && contactData.phoneNumbers[0]);
          if (phoneToSearch) {
            const normalizedPhone = phoneToSearch.replace(/\D/g, '');
            if (normalizedPhone.length > 7) {
              phoneQueries.push(
                { phone: phoneToSearch },
                { phoneNumber: phoneToSearch },
                { phone: normalizedPhone },
                { phoneNumber: normalizedPhone },
                // Also search in phoneNumbers array
                { phoneNumbers: { $in: [phoneToSearch, normalizedPhone] } }
              );
            }
          }
          return phoneQueries;
        })() : [])
      ]
    };
    
    if (userId) {
      query.userId = userId;
    }
    
    // Find existing contacts with similar identifiers
    const existingContacts = await Contact.find(query).limit(20).lean();
    
    // Categorize duplicates by match type
    const automaticMerges = [];
    const manualReview = [];
    
    existingContacts.forEach(existing => {
      const normalizedExistingName = normalizeName(existing.name);
      const existingNameWords = normalizedExistingName.split(/\s+/).filter(w => w.length > 1);
      
      // 1. Exact email match = automatic merge (highest priority)
      if (contactData.email && existing.email && 
          contactData.email.toLowerCase().trim() === existing.email.toLowerCase().trim()) {
        automaticMerges.push(existing);
        return; // Don't add to manual review if email matches
      }
      
      // 2. Exact phone match = automatic merge (high priority)
      const getPhoneNumbers = (contact) => {
        const phones = [];
        if (contact.phone) phones.push(contact.phone);
        if (contact.phoneNumber) phones.push(contact.phoneNumber);
        if (contact.phoneNumbers && Array.isArray(contact.phoneNumbers)) {
          phones.push(...contact.phoneNumbers);
        }
        return phones.filter(p => p && p.trim()).map(p => p.replace(/\D/g, ''));
      };
      
      const newPhones = getPhoneNumbers(contactData);
      const existingPhones = getPhoneNumbers(existing);
      
      if (newPhones.length > 0 && existingPhones.length > 0) {
        const hasMatchingPhone = newPhones.some(newPhone => 
          existingPhones.some(existingPhone => 
            newPhone.length > 7 && existingPhone.length > 7 && newPhone === existingPhone
          )
        );
        
        if (hasMatchingPhone) {
          automaticMerges.push(existing);
          return; // Don't add to manual review if phone matches
        }
      }
      
      // 3. Name similarity scoring = manual review required
      if (existingNameWords.length > 0 && newNameWords.length > 0) {
        // Calculate name similarity score
        const matchingWords = existingNameWords.filter(existingWord => 
          newNameWords.some(newWord => {
            // Exact word match
            if (existingWord === newWord) return true;
            
            // Substring match for longer words
            if (existingWord.length > 3 && newWord.length > 3) {
              return existingWord.includes(newWord) || newWord.includes(existingWord);
            }
            
            // Prefix match for names (first 3 characters)
            if (existingWord.length > 2 && newWord.length > 2) {
              return existingWord.substring(0, 3) === newWord.substring(0, 3);
            }
            
            return false;
          })
        );
        
        // Calculate similarity ratio
        const totalWords = Math.max(existingNameWords.length, newNameWords.length);
        const similarityRatio = matchingWords.length / totalWords;
        
        // Require at least 50% name similarity for potential duplicate
        if (similarityRatio >= 0.5) {
          manualReview.push(existing);
        }
      }
    });
    
    const hasEmailMatch = automaticMerges.length > 0 && automaticMerges.some(contact => 
      contact.email && contactData.email && 
      contact.email.toLowerCase().trim() === contactData.email.toLowerCase().trim()
    );
    
    const hasPhoneMatch = automaticMerges.length > 0 && automaticMerges.some(contact => {
      const newPhones = getPhoneNumbers(contactData);
      const existingPhones = getPhoneNumbers(contact);
      return newPhones.some(newPhone => 
        existingPhones.some(existingPhone => 
          newPhone.length > 7 && existingPhone.length > 7 && newPhone === existingPhone
        )
      );
    });
    
    const matchTypes = [];
    if (hasEmailMatch) matchTypes.push('email');
    if (hasPhoneMatch) matchTypes.push('phone');
    if (manualReview.length > 0) matchTypes.push('name-similarity');
    
    console.log(`Duplicate analysis for "${contactData.name}": ${automaticMerges.length} automatic merges (${matchTypes.join(', ') || 'none'}), ${manualReview.length} manual review needed`);
    
    return {
      automaticMerges,
      manualReview,
      hasEmailMatch,
      hasPhoneMatch,
      matchTypes
    };
  } catch (error) {
    console.error('Error finding potential duplicates:', error);
    return { automaticMerges: [], manualReview: [], hasEmailMatch: false, hasPhoneMatch: false, matchTypes: [] };
  }
}

// LinkedIn header mappings
const LINKEDIN_HEADER_MAPPINGS = {
  firstName: ['first name', 'firstname'],
  lastName: ['last name', 'lastname'],
  name: ['name', 'full name', 'contact name'],
  email: ['email address', 'email', 'e-mail'],
  company: ['company', 'organization', 'employer'],
  position: ['position', 'title', 'job title', 'role'],
  location: ['location', 'region', 'area', 'city'],
  connectedOn: ['connected on', 'connection date', 'date connected', 'connected'],
  url: ['url', 'profile url', 'linkedin url', 'link']
};

// Contacts CSV format header mappings
const CONTACTS_HEADER_MAPPINGS = {
  source: ['source'],
  firstName: ['firstname', 'first name'],
  lastName: ['lastname', 'last name'],
  fullName: ['fullname', 'full name', 'name'],
  companies: ['companies', 'company', 'organization'],
  title: ['title', 'position', 'job title'],
  emails: ['emails', 'email', 'email address', 'e-mail'],
  phoneNumbers: ['phone numbers', 'phone', 'phone number', 'mobile'],
  createdAt: ['created at', 'date created', 'created'],
  addresses: ['addresses', 'address', 'location'],
  sites: ['sites', 'website', 'websites', 'url'],
  instantMessageHandles: ['instantmessagehandles', 'instant message', 'im'],
  birthday: ['birthday', 'birth date', 'date of birth'],
  location: ['location', 'region', 'area', 'city'],
  bookmarkedAt: ['bookmarkedat', 'bookmarked', 'bookmarked at'],
  profiles: ['profiles', 'profile', 'social profiles']
};

function findHeaderIndex(headers, possibleNames) {
  for (const name of possibleNames) {
    const index = headers.findIndex(h => h && h.toLowerCase().includes(name.toLowerCase()));
    if (index !== -1) return index;
  }
  return -1;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result.map(field => field.trim());
}

// Function to detect CSV format based on headers using scoring
function detectCSVFormat(headers) {
  const headerLower = headers.map(h => h.toLowerCase().trim());
  
  let contactsScore = 0;
  let linkedinScore = 0;
  
  // Contacts CSV format indicators with weights
  const contactsIndicators = {
    'firstname': 2,
    'lastname': 2, 
    'fullname': 3,
    'companies': 4, // Unique to contacts format
    'emails': 4, // Unique to contacts format  
    'phone numbers': 4, // Unique to contacts format
    'addresses': 3,
    'sites': 3,
    'instantmessagehandles': 5, // Very unique to contacts format
    'bookmarkedat': 5, // Very unique to contacts format
    'profiles': 3,
    'birthday': 3,
    'source': 2
  };
  
  // LinkedIn CSV format indicators with weights
  const linkedinIndicators = {
    'first name': 3,
    'last name': 3,
    'connected on': 5, // Very unique to LinkedIn format
    'connection date': 5, // Very unique to LinkedIn format
    'profile url': 4,
    'linkedin url': 5,
    'position': 1, // Common to both
    'company': 1, // Common to both
    'email address': 2 // LinkedIn uses 'email address' vs 'emails'
  };
  
  // Calculate scores for Contacts format
  Object.entries(contactsIndicators).forEach(([indicator, weight]) => {
    if (headerLower.some(h => h.includes(indicator))) {
      contactsScore += weight;
    }
  });
  
  // Calculate scores for LinkedIn format
  Object.entries(linkedinIndicators).forEach(([indicator, weight]) => {
    if (headerLower.some(h => h.includes(indicator))) {
      linkedinScore += weight;
    }
  });
  
  console.log('Format detection scores:');
  console.log('- Contacts score:', contactsScore);
  console.log('- LinkedIn score:', linkedinScore);
  console.log('Headers analyzed:', headerLower.slice(0, 8));
  
  // Return format with higher score, defaulting to LinkedIn if tie
  if (contactsScore > linkedinScore) {
    console.log('✅ Detected format: Contacts CSV');
    return 'contacts';
  } else {
    console.log('✅ Detected format: LinkedIn CSV');
    return 'linkedin';
  }
}

// Enhanced function to merge contact data with priority-based field selection
function mergeContactData(existingContact, newContactData, mergeStrategy = 'prefer_existing') {
  const merged = { ...existingContact };
  
  // Define field priorities (higher priority sources overwrite lower priority)
  const fieldPriorities = {
    linkedin: 3,      // Highest priority - most structured data
    contacts: 2,      // Medium priority - user-exported data
    facebook: 1,      // Lower priority - less professional context
    manual: 4         // Highest priority - user-entered data
  };
  
  // Get source priorities
  const existingPriority = fieldPriorities[existingContact.source?.toLowerCase()] || 1;
  const newPriority = fieldPriorities[newContactData.source?.toLowerCase()] || 1;
  
  // Define merge rules for different field types
  const mergeRules = {
    // Always prefer non-empty values for basic contact info
    critical_fields: ['name', 'email', 'phone', 'phoneNumber'],
    
    // Union arrays (combine and deduplicate)
    array_fields: ['emails', 'phoneNumbers', 'companies', 'addresses', 'sites', 
                   'profiles', 'instantMessageHandles', 'skills', 'interests', 
                   'expertise_areas', 'industries', 'tags'],
    
    // Prefer LinkedIn for professional data
    professional_fields: ['company', 'position', 'jobTitle', 'currentPosition', 
                          'experience', 'education', 'linkedinUrl', 'linkedinProfile'],
    
    // Prefer more recent or higher quality data
    metadata_fields: ['profilePicture', 'location', 'birthday', 'birthdayParsed'],
    
    // Always combine sources
    special_fields: ['source']
  };
  
  // Process each field from new contact data
  Object.keys(newContactData).forEach(key => {
    const newValue = newContactData[key];
    const existingValue = merged[key];
    
    // Skip empty or null values
    if (!newValue || newValue === '' || newValue === null) {
      return;
    }
    
    if (mergeRules.array_fields.includes(key)) {
      // Union arrays with deduplication
      const existingArray = Array.isArray(existingValue) ? existingValue : 
                           (existingValue ? [existingValue] : []);
      const newArray = Array.isArray(newValue) ? newValue : [newValue];
      
      // Combine, deduplicate, and filter empty values
      const combined = [...existingArray, ...newArray]
        .filter(item => item && item !== '' && item !== null)
        .map(item => typeof item === 'string' ? item.trim() : item);
      
      merged[key] = [...new Set(combined)];
      
    } else if (mergeRules.special_fields.includes(key)) {
      // Special handling for source field
      if (key === 'source') {
        merged[key] = existingValue ? `${existingValue}, ${newValue}` : newValue;
      }
      
    } else if (mergeRules.critical_fields.includes(key)) {
      // Critical fields: prefer non-empty values, then higher priority source
      if (!existingValue || existingValue === '') {
        merged[key] = newValue;
      } else if (newPriority > existingPriority) {
        merged[key] = newValue;
      }
      // Otherwise keep existing value
      
    } else if (mergeRules.professional_fields.includes(key)) {
      // Professional fields: prefer LinkedIn data
      if (!existingValue || existingValue === '') {
        merged[key] = newValue;
      } else if (newContactData.source?.toLowerCase() === 'linkedin' && 
                 existingContact.source?.toLowerCase() !== 'linkedin') {
        merged[key] = newValue; // LinkedIn overwrites non-LinkedIn
      } else if (newPriority > existingPriority) {
        merged[key] = newValue;
      }
      
    } else {
      // Default behavior: prefer non-empty values, then higher priority source
      if (!existingValue || existingValue === '' || newPriority > existingPriority) {
        merged[key] = newValue;
      }
    }
  });
  
  // Ensure data consistency and quality
  merged.updatedAt = new Date();
  
  // Preserve the earliest creation date
  if (newContactData.createdAt && (!merged.createdAt || newContactData.createdAt < merged.createdAt)) {
    merged.originalCreatedAt = merged.createdAt;
    merged.createdAt = newContactData.createdAt;
  }
  
  // Create audit trail for merged contact IDs (ensure schema supports this)
  if (!merged.mergeHistory) {
    merged.mergeHistory = [];
  }
  
  // Add merge event to history
  merged.mergeHistory.push({
    timestamp: new Date(),
    action: 'merge',
    sourceContactId: existingContact._id ? existingContact._id.toString() : null,
    sourceData: newContactData.source || 'unknown',
    mergedFields: Object.keys(newContactData).filter(key => 
      newContactData[key] && newContactData[key] !== '' && newContactData[key] !== null)
  });
  
  return merged;
}

// Enhanced CSV processing with support for both LinkedIn and Contacts formats
function processSingleCSV(lines) {
  const contacts = [];
  const errors = [];
  
  // Parse headers - handle both CSV formats with notes at the top
  let headerIndex = 0;
  let headers = [];
  let headerLine = '';
  
  // Find the actual header row (skip notes and empty lines)
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim();
    if (!line || line.toLowerCase().startsWith('note')) {
      console.log(`Skipping line ${i}: "${line.substring(0, 50)}..."`);
      continue;
    }
    
    const testHeaders = parseCSVLine(line);
    console.log(`Testing line ${i} as headers:`, testHeaders.slice(0, 5));
    
    // Check if this looks like a valid CSV header row (either format)
    if (testHeaders.length >= 3 && testHeaders.some(h => h && (
      // LinkedIn format indicators
      h.toLowerCase().includes('first name') || 
      h.toLowerCase().includes('last name') ||
      h.toLowerCase().includes('company') ||
      h.toLowerCase().includes('position') ||
      h.toLowerCase().includes('email') ||
      h.toLowerCase().includes('connected') ||
      // Contacts format indicators
      h.toLowerCase().includes('firstname') ||
      h.toLowerCase().includes('lastname') ||
      h.toLowerCase().includes('fullname') ||
      h.toLowerCase().includes('companies') ||
      h.toLowerCase().includes('emails') ||
      h.toLowerCase().includes('phone numbers') ||
      h.toLowerCase().includes('addresses')
    ))) {
      headers = testHeaders;
      headerIndex = i;
      headerLine = line;
      break;
    }
  }
  
  if (headers.length === 0) {
    console.log('All lines tested:');
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      console.log(`Line ${i}: "${lines[i].substring(0, 100)}..."`);
    }
    throw new Error('Could not find valid CSV headers. Please check your file format.');
  }
  
  console.log('CSV Headers found:', headers);
  console.log('Header found at line:', headerIndex);
  console.log('Raw header line:', headerLine);
  
  // Detect CSV format
  const csvFormat = detectCSVFormat(headers);
  console.log('Detected CSV format:', csvFormat);
  
  // Choose appropriate mappings based on detected format
  const mappings = csvFormat === 'contacts' ? CONTACTS_HEADER_MAPPINGS : LINKEDIN_HEADER_MAPPINGS;
  
  // Find column indices with appropriate mapping
  let indices;
  if (csvFormat === 'contacts') {
    indices = {
      source: findHeaderIndex(headers, mappings.source),
      firstName: findHeaderIndex(headers, mappings.firstName),
      lastName: findHeaderIndex(headers, mappings.lastName),
      fullName: findHeaderIndex(headers, mappings.fullName),
      companies: findHeaderIndex(headers, mappings.companies),
      title: findHeaderIndex(headers, mappings.title),
      emails: findHeaderIndex(headers, mappings.emails),
      phoneNumbers: findHeaderIndex(headers, mappings.phoneNumbers),
      createdAt: findHeaderIndex(headers, mappings.createdAt),
      addresses: findHeaderIndex(headers, mappings.addresses),
      sites: findHeaderIndex(headers, mappings.sites),
      instantMessageHandles: findHeaderIndex(headers, mappings.instantMessageHandles),
      birthday: findHeaderIndex(headers, mappings.birthday),
      location: findHeaderIndex(headers, mappings.location),
      bookmarkedAt: findHeaderIndex(headers, mappings.bookmarkedAt),
      profiles: findHeaderIndex(headers, mappings.profiles)
    };
  } else {
    indices = {
      firstName: findHeaderIndex(headers, mappings.firstName),
      lastName: findHeaderIndex(headers, mappings.lastName),
      name: findHeaderIndex(headers, mappings.name),
      email: findHeaderIndex(headers, mappings.email),
      company: findHeaderIndex(headers, mappings.company),
      position: findHeaderIndex(headers, mappings.position),
      location: findHeaderIndex(headers, mappings.location),
      connectedOn: findHeaderIndex(headers, mappings.connectedOn),
      url: findHeaderIndex(headers, mappings.url)
    };
  }

  console.log('Field indices:', indices);
  console.log('Available headers for mapping:', headers.map((h, i) => `${i}: "${h}"`));
  
  // Validate that we found at least name fields
  const hasNameField = (csvFormat === 'contacts') ? 
    (indices.firstName >= 0 || indices.lastName >= 0 || indices.fullName >= 0) :
    (indices.firstName >= 0 || indices.lastName >= 0 || indices.name >= 0);
    
  if (!hasNameField) {
    throw new Error(`Could not find name columns in ${csvFormat} CSV. Expected name fields.`);
  }

  // Check what data we can expect to extract
  const availableFields = [];
  if (csvFormat === 'contacts') {
    if (indices.firstName >= 0 || indices.lastName >= 0 || indices.fullName >= 0) availableFields.push('Names');
    if (indices.emails >= 0) availableFields.push('Emails');
    if (indices.companies >= 0) availableFields.push('Companies');
    if (indices.title >= 0) availableFields.push('Titles');
    if (indices.phoneNumbers >= 0) availableFields.push('Phone Numbers');
    if (indices.addresses >= 0) availableFields.push('Addresses');
    if (indices.sites >= 0) availableFields.push('Websites');
  } else {
    if (indices.firstName >= 0 || indices.lastName >= 0) availableFields.push('Names');
    if (indices.email >= 0) availableFields.push('Emails');
    if (indices.company >= 0) availableFields.push('Companies');
    if (indices.position >= 0) availableFields.push('Positions');
    if (indices.location >= 0) availableFields.push('Locations');
  }
  
  console.log('Will extract:', availableFields.join(', '));

  let processed = 0;
  let skipped = 0;

  // Process data rows (skip header)
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      skipped++;
      continue;
    }

    try {
      const fields = parseCSVLine(line);
      processed++;

      let contactData;
      
      if (csvFormat === 'contacts') {
        // Extract name with priority: fullName > firstName + lastName
        let name = '';
        if (indices.fullName >= 0 && fields[indices.fullName]?.trim()) {
          name = fields[indices.fullName].trim();
        } else {
          const firstName = indices.firstName >= 0 ? (fields[indices.firstName]?.trim() || '') : '';
          const lastName = indices.lastName >= 0 ? (fields[indices.lastName]?.trim() || '') : '';
          name = `${firstName} ${lastName}`.trim();
        }

        if (!name) {
          errors.push(`Row ${i + 1}: No valid name found`);
          continue;
        }

        // Helper function to parse multi-value fields
        const parseMultiValueField = (rawValue) => {
          if (!rawValue) return [];
          return rawValue.split(/[;,|]/).map(val => val.trim()).filter(val => val.length > 0);
        };
        
        // Helper function to parse date fields
        const parseDate = (rawDate) => {
          if (!rawDate) return { raw: '', parsed: null };
          const trimmed = rawDate.trim();
          
          // Try to parse common date formats
          let parsed = null;
          if (trimmed) {
            // Try parsing with Date constructor (handles ISO, MM/DD/YYYY, etc.)
            const dateAttempt = new Date(trimmed);
            if (!isNaN(dateAttempt.getTime())) {
              parsed = dateAttempt;
            } else {
              // Try some common formats if direct parsing fails
              const patterns = [
                /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // MM/DD/YYYY
                /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
                /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // MM-DD-YYYY
              ];
              
              for (const pattern of patterns) {
                const match = trimmed.match(pattern);
                if (match) {
                  const [, part1, part2, part3] = match;
                  // Assume first pattern is MM/DD/YYYY, others are YYYY-MM-DD or MM-DD-YYYY
                  const testDate = pattern === patterns[0] || pattern === patterns[2] 
                    ? new Date(part3, part1 - 1, part2) // MM/DD/YYYY or MM-DD-YYYY
                    : new Date(part1, part2 - 1, part3); // YYYY-MM-DD
                  
                  if (!isNaN(testDate.getTime())) {
                    parsed = testDate;
                    break;
                  }
                }
              }
            }
          }
          
          return { raw: trimmed, parsed };
        };
        
        // Extract field data for Contacts CSV format
        const emailsRaw = indices.emails >= 0 && fields[indices.emails] ? fields[indices.emails].trim() : '';
        const companiesRaw = indices.companies >= 0 && fields[indices.companies] ? fields[indices.companies].trim() : '';
        const titleRaw = indices.title >= 0 && fields[indices.title] ? fields[indices.title].trim() : '';
        const phoneRaw = indices.phoneNumbers >= 0 && fields[indices.phoneNumbers] ? fields[indices.phoneNumbers].trim() : '';
        const addressRaw = indices.addresses >= 0 && fields[indices.addresses] ? fields[indices.addresses].trim() : '';
        const sitesRaw = indices.sites >= 0 && fields[indices.sites] ? fields[indices.sites].trim() : '';
        const profilesRaw = indices.profiles >= 0 && fields[indices.profiles] ? fields[indices.profiles].trim() : '';
        const imHandlesRaw = indices.instantMessageHandles >= 0 && fields[indices.instantMessageHandles] ? fields[indices.instantMessageHandles].trim() : '';
        
        // Parse multi-value fields into arrays
        const emailsList = parseMultiValueField(emailsRaw);
        const companiesList = parseMultiValueField(companiesRaw);
        const phonesList = parseMultiValueField(phoneRaw);
        const addressesList = parseMultiValueField(addressRaw);
        const sitesList = parseMultiValueField(sitesRaw);
        const imHandlesList = parseMultiValueField(imHandlesRaw);
        const profilesList = parseMultiValueField(profilesRaw);
        
        // Parse date fields
        const birthdayData = indices.birthday >= 0 && fields[indices.birthday] ? parseDate(fields[indices.birthday]) : { raw: '', parsed: null };
        const bookmarkedData = indices.bookmarkedAt >= 0 && fields[indices.bookmarkedAt] ? parseDate(fields[indices.bookmarkedAt]) : { raw: '', parsed: null };
        const createdData = indices.createdAt >= 0 && fields[indices.createdAt] ? parseDate(fields[indices.createdAt]) : { raw: '', parsed: null };
        
        // Extract LinkedIn URL from sites or profiles
        const allUrls = [...sitesList, ...profilesList];
        const linkedinUrl = allUrls.find(url => url.toLowerCase().includes('linkedin')) || '';
        
        contactData = {
          name,
          // Primary fields (backward compatibility)
          email: emailsList.length > 0 ? emailsList[0].toLowerCase() : '',
          company: companiesList.length > 0 ? companiesList[0] : '',
          position: titleRaw,
          phone: phonesList.length > 0 ? phonesList[0] : '',
          location: indices.location >= 0 && fields[indices.location] ? fields[indices.location].trim() : (addressesList.length > 0 ? addressesList[0] : ''),
          
          // Multi-value arrays (new schema fields)
          emails: emailsList.map(email => email.toLowerCase()),
          companies: companiesList,
          phoneNumbers: phonesList,
          addresses: addressesList,
          sites: sitesList,
          instantMessageHandles: imHandlesList,
          
          // Single value fields from Contacts CSV
          source: indices.source >= 0 && fields[indices.source] ? fields[indices.source].trim() : 'contacts_import',
          linkedinUrl: linkedinUrl,
          
          // Date fields (both raw and parsed)
          birthday: birthdayData.raw,
          birthdayParsed: birthdayData.parsed,
          bookmarkedAt: bookmarkedData.raw,
          bookmarkedAtParsed: bookmarkedData.parsed,
          originalCreatedAt: createdData.raw,
          originalCreatedAtParsed: createdData.parsed,
          
          // Social profiles as array
          profiles: profilesList
        };
      } else {
        // LinkedIn CSV format processing (existing logic)
        let name = '';
        if (indices.name >= 0 && fields[indices.name]?.trim()) {
          name = fields[indices.name].trim();
        } else {
          const firstName = indices.firstName >= 0 ? (fields[indices.firstName]?.trim() || '') : '';
          const lastName = indices.lastName >= 0 ? (fields[indices.lastName]?.trim() || '') : '';
          name = `${firstName} ${lastName}`.trim();
        }

        if (!name) {
          errors.push(`Row ${i + 1}: No valid name found`);
          continue;
        }

        // Extract field data for LinkedIn CSV format
        const emailRaw = indices.email >= 0 && fields[indices.email] ? fields[indices.email].trim() : '';
        const companyRaw = indices.company >= 0 && fields[indices.company] ? fields[indices.company].trim() : '';
        const positionRaw = indices.position >= 0 && fields[indices.position] ? fields[indices.position].trim() : '';
        
        contactData = {
          name,
          email: emailRaw.toLowerCase(),
          company: companyRaw,
          position: positionRaw,
          location: indices.location >= 0 && fields[indices.location] ? fields[indices.location].trim() : '',
          connectedOn: indices.connectedOn >= 0 && fields[indices.connectedOn] ? fields[indices.connectedOn].trim() : '',
          linkedinUrl: indices.url >= 0 && fields[indices.url] ? fields[indices.url].trim() : '',
          source: 'linkedin_import'
        };
      }

      // Debug sample contacts
      if (contacts.length < 3) {
        console.log(`Sample contact ${contacts.length + 1} (${csvFormat}):`, JSON.stringify(contactData));
        console.log(`Raw fields for row ${contacts.length + 1}:`, fields.slice(0, 10));
      }

      contacts.push(contactData);

    } catch (error) {
      console.error(`Error processing row ${i + 1}:`, error);
      errors.push(`Row ${i + 1}: ${error.message}`);
      skipped++;
    }
  }

  console.log(`Processed ${processed} rows, ${contacts.length} valid contacts, ${skipped} skipped, ${errors.length} errors`);
  
  return contacts;
}

// ===== FACEBOOK INTEGRATION =====

// Facebook OAuth endpoints
app.get('/api/facebook/auth', (req, res) => {
  const fbAppId = process.env.FACEBOOK_APP_ID || '1222790436230433';
  const redirectUri = `${req.protocol}://${req.get('host')}/api/facebook/callback`;
  const scope = 'public_profile,email,user_friends';
  
  const fbAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${fbAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;
  
  res.redirect(fbAuthUrl);
});

app.get('/api/facebook/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ error: 'No authorization code provided' });
    }

    const fbAppId = process.env.FACEBOOK_APP_ID || '1222790436230433';
    const fbAppSecret = process.env.FACEBOOK_APP_SECRET;
    const redirectUri = `${req.protocol}://${req.get('host')}/api/facebook/callback`;

    // Exchange code for access token
    const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: fbAppId,
        client_secret: fbAppSecret,
        redirect_uri: redirectUri,
        code
      }
    });

    const accessToken = tokenResponse.data.access_token;
    
    // Get user profile
    const profileResponse = await axios.get('https://graph.facebook.com/v18.0/me', {
      params: {
        fields: 'id,name,email,picture',
        access_token: accessToken
      }
    });

    res.json({
      success: true,
      profile: profileResponse.data,
      accessToken
    });

  } catch (error) {
    console.error('Facebook OAuth error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Facebook authentication failed' });
  }
});

app.post('/api/facebook/import', async (req, res) => {
  try {
    const { accessToken, userId } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({ error: 'Access token required' });
    }

    // Get user profile
    const profileResponse = await axios.get('https://graph.facebook.com/v18.0/me', {
      params: {
        fields: 'id,name,email,picture',
        access_token: accessToken
      }
    });

    const userProfile = profileResponse.data;
    
    // Get friends (Note: Facebook API now only returns friends who also use the app)
    const friendsResponse = await axios.get('https://graph.facebook.com/v18.0/me/friends', {
      params: {
        fields: 'id,name,picture',
        access_token: accessToken
      }
    });

    const friends = friendsResponse.data.data || [];
    let importedCount = 0;
    let updatedCount = 0;

    // Import user profile
    const userContact = {
      name: userProfile.name,
      email: userProfile.email,
      facebookId: userProfile.id,
      profilePicture: userProfile.picture?.data?.url,
      source: 'facebook',
      userId: userId || 'anonymous',
      searchableText: `${userProfile.name} ${userProfile.email || ''} facebook profile`,
      tags: [
        { category: 'platform', value: 'facebook' },
        { category: 'type', value: 'profile' }
      ]
    };

    const existingUser = await Contact.findOne({ 
      $or: [
        { facebookId: userProfile.id },
        { email: userProfile.email }
      ]
    });

    if (existingUser) {
      await Contact.updateOne({ _id: existingUser._id }, userContact);
      updatedCount++;
    } else {
      await Contact.create(userContact);
      importedCount++;
    }

    // Import friends
    for (const friend of friends) {
      const friendContact = {
        name: friend.name,
        facebookId: friend.id,
        profilePicture: friend.picture?.data?.url,
        source: 'facebook',
        userId: userId || 'anonymous',
        searchableText: `${friend.name} facebook friend`,
        tags: [
          { category: 'platform', value: 'facebook' },
          { category: 'type', value: 'friend' }
        ]
      };

      const existingFriend = await Contact.findOne({ facebookId: friend.id });
      
      if (existingFriend) {
        await Contact.updateOne({ _id: existingFriend._id }, friendContact);
        updatedCount++;
      } else {
        await Contact.create(friendContact);
        importedCount++;
      }
    }

    res.json({
      success: true,
      imported: importedCount,
      updated: updatedCount,
      total: friends.length + 1, // friends + user profile
      message: `Successfully imported ${importedCount} new contacts and updated ${updatedCount} existing contacts from Facebook`
    });

  } catch (error) {
    console.error('Facebook import error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to import Facebook contacts' });
  }
});

// ===== API ROUTES =====

// Health check endpoints
app.get('/', (req, res) => {
  res.json({
    status: 'BeeTagged Server running',
    environment: process.env.NODE_ENV || 'development',
    mongodb: 'configured'
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/healthz', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    service: 'beetagged-backend'
  });
});

// Enhanced search with semantic capabilities
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    const userId = req.query.userId;
    const useSemanticSearch = req.query.semantic === 'true';
    
    console.log('Search request for:', query, useSemanticSearch ? '(semantic)' : '(traditional)');

    if (!query) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }

    let contacts = [];
    let searchType = 'traditional';

    // Use semantic search if requested and OpenAI is available
    if (useSemanticSearch && process.env.OPENAI_API_KEY) {
      try {
        contacts = await semanticSearch(query, userId, 50);
        console.log(`Semantic search found ${contacts.length} contacts`);
        if (contacts.length > 0) {
          searchType = 'semantic';
        }
      } catch (semanticError) {
        console.error('Semantic search failed, falling back to text search:', semanticError.message);
      }
    }

    // Fallback to traditional search if semantic search didn't work or wasn't requested
    if (contacts.length === 0) {
      try {
        contacts = await Contact.find({ 
          $text: { $search: query } 
        }, { 
          score: { $meta: "textScore" } 
        }).sort({ 
          score: { $meta: "textScore" } 
        }).limit(50).lean();
        console.log(`Text search found ${contacts.length} contacts`);
      } catch (textSearchError) {
        console.log('Text search failed, using regex fallback:', textSearchError.message);
        
        // Final fallback to regex search
        contacts = await Contact.find({
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { company: { $regex: query, $options: 'i' } },
            { position: { $regex: query, $options: 'i' } },
            { location: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
            { skills: { $in: [new RegExp(query, 'i')] } },
            { expertise_areas: { $in: [new RegExp(query, 'i')] } }
          ]
        }).limit(50).lean();
        console.log(`Regex search found ${contacts.length} contacts`);
        searchType = 'regex';
      }
    }

    console.log(`Found ${contacts.length} contacts for query: ${query}`);
    res.json({ 
      contacts,
      query,
      search_type: searchType,
      count: contacts.length,
      openai_enabled: !!process.env.OPENAI_API_KEY,
      semantic_requested: useSemanticSearch
    });
    
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Dedicated semantic search endpoint with AI analytics
app.get('/api/search-semantic', async (req, res) => {
  try {
    const { q: query, userId, limit = 20 } = req.query;
    
    if (!query) {
      return res.status(400).json({ 
        error: 'Query parameter q is required',
        contacts: [],
        count: 0
      });
    }

    console.log('Semantic search query:', query);
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        error: 'OpenAI API key not configured',
        message: 'Semantic search requires OpenAI integration',
        contacts: [],
        count: 0
      });
    }
    
    // Use enhanced semantic search
    const results = await semanticSearch(query, userId, parseInt(limit));
    
    // Add analytics about search quality
    const analytics = {
      total_contacts_with_embeddings: results.filter(r => r.embedding && r.embedding.length > 0).length,
      avg_similarity: results.length > 0 ? (results.reduce((sum, r) => sum + (r.similarity || 0), 0) / results.length).toFixed(3) : 0,
      skills_found: [...new Set(results.flatMap(r => r.skills || []))].slice(0, 10),
      companies_found: [...new Set(results.map(r => r.company).filter(Boolean))].slice(0, 5),
      career_stages: [...new Set(results.map(r => r.career_stage).filter(Boolean))]
    };
    
    res.json({
      query: query,
      count: results.length,
      contacts: results,
      search_type: 'semantic',
      analytics: analytics,
      openai_enabled: true
    });

  } catch (error) {
    console.error('Semantic search error:', error);
    res.status(500).json({ 
      error: 'Search failed',
      message: error.message,
      contacts: [],
      count: 0
    });
  }
});

// Get all contacts endpoint
app.get('/api/contacts', async (req, res) => {
  try {
    console.log('Fetching all contacts...');
    const contacts = await Contact.find().sort({ updatedAt: -1 }).limit(1000);
    console.log(`Found ${contacts.length} contacts`);
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch contacts',
      message: error.message 
    });
  }
});

// STREAMLINED CSV IMPORT - Uses unified processor and batch operations
app.post('/api/import/linkedin', upload.any(), async (req, res) => {
  try {
    console.log('🚀 === STREAMLINED CSV IMPORT STARTED ===');
    
    // Validate uploaded files
    const uploadedFiles = req.files || [];
    if (uploadedFiles.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least one CSV file is required' 
      });
    }
    
    console.log(`📁 Processing ${uploadedFiles.length} file(s)`);
    
    // Import services
    const { processAnyCSV } = require('./services/unifiedCsvProcessor');
    const { batchInsertContacts, batchFindDuplicates } = require('./services/batchDatabaseService');
    
    let allContacts = [];
    let processingStats = {
      filesProcessed: 0,
      totalRows: 0,
      successfulContacts: 0,
      skippedRows: 0,
      errors: []
    };
    
    // STEP 1: Process all CSV files with unified processor
    for (const file of uploadedFiles) {
      if (!file.originalname?.toLowerCase().endsWith('.csv')) {
        console.log(`⚠️  Skipping non-CSV file: ${file.originalname}`);
        continue;
      }
      
      try {
        console.log(`📄 Processing file: ${file.originalname}`);
        
        const csvResult = await processAnyCSV(file.buffer, {
          filename: file.originalname
        });
        
        allContacts.push(...csvResult.contacts);
        processingStats.filesProcessed++;
        processingStats.totalRows += csvResult.stats.processed;
        processingStats.successfulContacts += csvResult.stats.successful;
        processingStats.skippedRows += csvResult.stats.skipped;
        
        if (csvResult.errors.length > 0) {
          processingStats.errors.push(...csvResult.errors);
        }
        
        console.log(`✅ File processed: ${csvResult.contacts.length} contacts extracted`);
        
      } catch (fileError) {
        console.error(`❌ Error processing ${file.originalname}:`, fileError);
        processingStats.errors.push({
          file: file.originalname,
          error: fileError.message
        });
      }
    }
    
    if (allContacts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid contacts found in uploaded files',
        stats: processingStats
      });
    }
    
    console.log(`🎯 Total contacts extracted: ${allContacts.length}`);
    
    // STEP 2: Import all contacts using batch operations (no duplicate checking during import)
    console.log(`💾 Starting batch import...`);
    
    const importResult = await batchInsertContacts(allContacts, Contact, {
      batchSize: 1000
    });
    
    // STEP 3: Generate import summary
    const importId = Date.now().toString();
    const summary = {
      importId,
      success: true,
      stats: {
        filesProcessed: processingStats.filesProcessed,
        totalRowsProcessed: processingStats.totalRows,
        contactsExtracted: allContacts.length,
        contactsInserted: importResult.inserted,
        duplicatesSkipped: importResult.duplicates,
        failedInserts: importResult.failed,
        processingErrors: processingStats.errors.length
      },
      message: `✅ Import complete! Processed ${processingStats.filesProcessed} file(s) and extracted ${allContacts.length} contacts. Successfully imported ${importResult.inserted} new contacts.`,
      timestamp: new Date(),
      hasPostImportDuplicates: importResult.duplicates > 0
    };
    
    // If there were duplicates, suggest post-import duplicate detection
    if (importResult.duplicates > 0) {
      summary.duplicateMessage = `Found ${importResult.duplicates} potential duplicates during import. Use the duplicate detection tool to review and merge similar contacts.`;
    }
    
    console.log(`🎉 Import Summary:`);
    console.log(`   📊 Files processed: ${summary.stats.filesProcessed}`);
    console.log(`   📋 Contacts extracted: ${summary.stats.contactsExtracted}`);
    console.log(`   ✅ Successfully imported: ${summary.stats.contactsInserted}`);
    console.log(`   🔄 Duplicates detected: ${summary.stats.duplicatesSkipped}`);
    console.log(`   ❌ Failed imports: ${summary.stats.failedInserts}`);
    
    res.json(summary);
    
  } catch (error) {
    console.error('💥 Import process failed:', error);
    res.status(500).json({
      success: false,
      message: `Import failed: ${error.message}`,
      error: error.name,
      timestamp: new Date()
    });
  }
});

// POST-IMPORT DUPLICATE DETECTION - Separate from import process
app.post('/api/contacts/detect-duplicates', async (req, res) => {
  try {
    console.log('🔍 === POST-IMPORT DUPLICATE DETECTION STARTED ===');
    
    const { batchFindDuplicates } = require('./services/batchDatabaseService');
    const { options = {} } = req.body;
    
    // Get all contacts from database for duplicate analysis
    console.log('📋 Fetching all contacts for duplicate analysis...');
    const allContacts = await Contact.find({}).lean();
    
    if (allContacts.length === 0) {
      return res.json({
        success: true,
        message: 'No contacts found for duplicate detection',
        stats: {
          totalContacts: 0,
          duplicateGroups: 0,
          potentialMerges: 0
        }
      });
    }
    
    console.log(`📊 Analyzing ${allContacts.length} contacts for duplicates...`);
    
    // Perform efficient duplicate detection
    const duplicateAnalysis = await batchFindDuplicates(allContacts, Contact);
    
    // Group duplicates for easier review
    const duplicateGroups = [];
    
    // Email-based duplicates
    if (duplicateAnalysis.emailDuplicates.length > 0) {
      const emailGroups = {};
      duplicateAnalysis.emailDuplicates.forEach(dup => {
        const email = dup.existingContact.email.toLowerCase();
        if (!emailGroups[email]) {
          emailGroups[email] = {
            type: 'email_match',
            matchValue: email,
            contacts: [dup.existingContact]
          };
        }
        emailGroups[email].contacts.push(dup.newContact);
      });
      
      Object.values(emailGroups).forEach(group => {
        if (group.contacts.length > 1) {
          duplicateGroups.push(group);
        }
      });
    }
    
    // Phone-based duplicates
    if (duplicateAnalysis.phoneDuplicates.length > 0) {
      const phoneGroups = {};
      duplicateAnalysis.phoneDuplicates.forEach(dup => {
        const phone = dup.newContact.phone || dup.existingContact.phone;
        const normalizedPhone = phone.replace(/\D/g, '');
        if (!phoneGroups[normalizedPhone]) {
          phoneGroups[normalizedPhone] = {
            type: 'phone_match',
            matchValue: phone,
            contacts: [dup.existingContact]
          };
        }
        phoneGroups[normalizedPhone].contacts.push(dup.newContact);
      });
      
      Object.values(phoneGroups).forEach(group => {
        if (group.contacts.length > 1) {
          duplicateGroups.push(group);
        }
      });
    }
    
    // Calculate potential merges
    const potentialMerges = duplicateGroups.reduce((sum, group) => sum + (group.contacts.length - 1), 0);
    
    // Generate summary
    const summary = {
      success: true,
      stats: {
        totalContacts: allContacts.length,
        duplicateGroups: duplicateGroups.length,
        emailMatches: duplicateAnalysis.emailDuplicates.length,
        phoneMatches: duplicateAnalysis.phoneDuplicates.length,
        potentialMerges: potentialMerges
      },
      duplicateGroups: duplicateGroups.slice(0, 50), // Limit to first 50 groups for performance
      message: duplicateGroups.length > 0 
        ? `Found ${duplicateGroups.length} duplicate groups affecting ${potentialMerges} contacts` 
        : 'No duplicates detected in your contact database',
      timestamp: new Date()
    };
    
    console.log(`🎯 Duplicate Detection Complete:`);
    console.log(`   📊 Total contacts analyzed: ${summary.stats.totalContacts}`);
    console.log(`   👥 Duplicate groups found: ${summary.stats.duplicateGroups}`);
    console.log(`   📧 Email matches: ${summary.stats.emailMatches}`);
    console.log(`   📞 Phone matches: ${summary.stats.phoneMatches}`);
    console.log(`   🔄 Potential merges: ${summary.stats.potentialMerges}`);
    
    res.json(summary);
    
  } catch (error) {
    console.error('❌ Duplicate detection failed:', error);
    res.status(500).json({
      success: false,
      message: `Duplicate detection failed: ${error.message}`,
      error: error.name,
      timestamp: new Date()
    });
  }
});

// BULK MERGE DUPLICATES - Process multiple merges efficiently
app.post('/api/contacts/bulk-merge', async (req, res) => {
  try {
    console.log('🔄 === BULK MERGE DUPLICATES STARTED ===');
    
    const { mergeGroups } = req.body;
    const { batchUpdateContacts, mergeContactData } = require('./services/batchDatabaseService');
    
    if (!mergeGroups || !Array.isArray(mergeGroups)) {
      return res.status(400).json({
        success: false,
        message: 'Merge groups array is required'
      });
    }
    
    console.log(`🔄 Processing ${mergeGroups.length} merge groups...`);
    
    let results = {
      processed: 0,
      merged: 0,
      deleted: 0,
      failed: 0,
      errors: []
    };
    
    const updates = [];
    const deletions = [];
    
    // Process each merge group
    for (const group of mergeGroups) {
      try {
        if (!group.contacts || group.contacts.length < 2) {
          results.failed++;
          continue;
        }
        
        // Use first contact as the master record
        const masterContact = group.contacts[0];
        const duplicateContacts = group.contacts.slice(1);
        
        // Merge all duplicates into master
        let mergedData = { ...masterContact };
        for (const duplicate of duplicateContacts) {
          mergedData = mergeContactData(mergedData, duplicate);
        }
        
        // Prepare update for master contact
        updates.push({
          _id: masterContact._id,
          data: {
            ...mergedData,
            updatedAt: new Date(),
            mergeHistory: [
              ...(masterContact.mergeHistory || []),
              {
                timestamp: new Date(),
                action: 'bulk_merge',
                mergedContactIds: duplicateContacts.map(c => c._id),
                duplicateCount: duplicateContacts.length
              }
            ]
          }
        });
        
        // Mark duplicates for deletion
        duplicateContacts.forEach(contact => {
          deletions.push(contact._id);
        });
        
        results.processed++;
        
      } catch (error) {
        console.error(`Error processing merge group:`, error);
        results.failed++;
        results.errors.push({
          group: results.processed,
          error: error.message
        });
      }
    }
    
    // Execute batch operations
    if (updates.length > 0) {
      const updateResult = await batchUpdateContacts(updates, Contact);
      results.merged = updateResult.updated;
    }
    
    if (deletions.length > 0) {
      const deleteResult = await Contact.deleteMany({
        _id: { $in: deletions }
      });
      results.deleted = deleteResult.deletedCount;
    }
    
    const summary = {
      success: true,
      results,
      message: `Bulk merge complete: ${results.merged} contacts updated, ${results.deleted} duplicates removed`,
      timestamp: new Date()
    };
    
    console.log(`🎉 Bulk Merge Complete:`);
    console.log(`   🔄 Groups processed: ${results.processed}`);
    console.log(`   ✅ Contacts merged: ${results.merged}`);
    console.log(`   🗑️  Duplicates deleted: ${results.deleted}`);
    console.log(`   ❌ Failed operations: ${results.failed}`);
    
    res.json(summary);
    
  } catch (error) {
    console.error('❌ Bulk merge failed:', error);
    res.status(500).json({
      success: false,
      message: `Bulk merge failed: ${error.message}`,
      error: error.name,
      timestamp: new Date()
    });
  }
});

// API endpoint to handle merge decisions (protected)
app.post('/api/contacts/merge', requireAuth, validateMergeRequest, async (req, res) => {
  try {
    const { mergeDecisions } = req.body;
    const userId = req.user.userId; // Get userId from authenticated user
    console.log('Processing merge decisions for user:', userId, 'Decisions:', mergeDecisions.length);
    
    if (!mergeDecisions || !Array.isArray(mergeDecisions)) {
      return res.status(400).json({
        success: false,
        message: 'Merge decisions array is required'
      });
    }
    
    let processedCount = 0;
    let mergedCount = 0;
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const decision of mergeDecisions) {
      const { action, newContact, existingContactId, mergedData } = decision;
      
      try {
        if (action === 'merge' && existingContactId) {
          // Merge with existing contact (verify ownership)
          const existingContact = await Contact.findOne({ 
            _id: existingContactId, 
            userId: userId 
          });
          if (existingContact) {
            const mergedContactData = mergeContactData(existingContact.toObject(), {
              ...newContact,
              userId: userId
            });
            await Contact.updateOne(
              { _id: existingContactId, userId: userId },
              { $set: mergedContactData }
            );
            mergedCount++;
            console.log(`Merged contact: ${newContact.name} with existing ID: ${existingContactId}`);
          } else {
            console.warn(`Existing contact ${existingContactId} not found or access denied for user ${userId}, adding as new`);
            // If existing contact not found, add as new with audit trail
            await Contact.create({ 
              ...newContact, 
              userId,
              mergeHistory: [{
                timestamp: new Date(),
                action: 'create',
                sourceContactId: null,
                sourceData: newContact.source || 'contacts-csv',
                mergedFields: Object.keys(newContact)
              }]
            });
            addedCount++;
          }
        } else if (action === 'add') {
          // Add as new contact with proper audit trail
          await Contact.create({ 
            ...newContact, 
            userId,
            mergeHistory: [{
              timestamp: new Date(),
              action: 'create',
              sourceContactId: null,
              sourceData: newContact.source || 'contacts-csv',
              mergedFields: Object.keys(newContact)
            }]
          });
          addedCount++;
          console.log(`Added new contact: ${newContact.name}`);
        } else if (action === 'skip') {
          // Skip this contact
          skippedCount++;
          console.log(`Skipped contact: ${newContact.name}`);
        }
        
        processedCount++;
      } catch (error) {
        console.error(`Error processing merge decision for ${newContact.name}:`, error);
        // Continue with other contacts even if one fails
      }
    }
    
    res.json({
      success: true,
      message: `Processed ${processedCount} contacts: ${addedCount} added, ${mergedCount} merged, ${skippedCount} skipped`,
      summary: {
        processed: processedCount,
        added: addedCount,
        merged: mergedCount,
        skipped: skippedCount
      }
    });
    
  } catch (error) {
    console.error('Error processing merge decisions:', error);
    res.status(500).json({
      success: false,
      message: `Failed to process merge decisions: ${error.message}`
    });
  }
});

// NOTE: Duplicate Facebook OAuth endpoints removed to avoid confusion
// The original Facebook endpoints (lines 1376-1500) are maintained for functionality

// Facebook data import helper function
async function importFacebookData(accessToken, userProfile) {
  let insertedCount = 0;
  let friendsCount = 0;
  
  try {
    // Import user's own profile
    if (userProfile) {
      const existingUser = await Contact.findOne({ 
        name: { $regex: new RegExp(`^${userProfile.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      });
      
      if (!existingUser) {
        const contact = new Contact({
          name: userProfile.name,
          email: userProfile.email || '',
          source: 'facebook_profile',
          url: userProfile.link || '',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        await contact.save();
        insertedCount++;
        console.log(`Added Facebook profile: ${userProfile.name}`);
      }
    }
    
    // Fetch friends who also use the app
    try {
      console.log('Fetching Facebook friends...');
      const friendsResponse = await axios.get('https://graph.facebook.com/v18.0/me/friends', {
        params: {
          fields: 'id,name,link',
          limit: 5000,
          access_token: accessToken
        }
      });
      
      const friends = friendsResponse.data.data || [];
      console.log(`Found ${friends.length} Facebook friends who use the app`);
      
      // Process each friend
      for (const friend of friends) {
        try {
          // Get friend's profile picture
          const pictureResponse = await axios.get(`https://graph.facebook.com/v18.0/${friend.id}/picture`, {
            params: {
              type: 'large',
              redirect: 0,
              access_token: accessToken
            }
          });
          
          const pictureUrl = pictureResponse.data?.data?.url;
          
          // Check if friend already exists
          const existingFriend = await Contact.findOne({ 
            name: { $regex: new RegExp(`^${friend.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
          });
          
          if (!existingFriend) {
            const contact = new Contact({
              name: friend.name,
              source: 'facebook_friend',
              url: friend.link || `https://www.facebook.com/${friend.id}`,
              profileImageUrl: pictureUrl,
              facebookId: friend.id,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            await contact.save();
            insertedCount++;
            friendsCount++;
            console.log(`Added Facebook friend: ${friend.name}`);
          }
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (friendError) {
          console.error(`Error processing friend ${friend.name}:`, friendError.message);
        }
      }
      
    } catch (friendsError) {
      console.log('Facebook friends fetch failed (normal for non-approved apps):', friendsError.message);
    }
    
    const totalContacts = await Contact.countDocuments();
    
    console.log(`=== Facebook Import Complete ===`);
    console.log(`User profile: ${userProfile ? 1 : 0}`);
    console.log(`Friends imported: ${friendsCount}`);
    console.log(`Total inserted: ${insertedCount}`);
    console.log(`Total contacts in DB: ${totalContacts}`);
    
    let message;
    if (insertedCount > 0) {
      if (friendsCount > 0) {
        message = `✅ Successfully imported your profile and ${friendsCount} friends from Facebook!`;
      } else {
        message = `✅ Successfully imported your Facebook profile! (No friends available - they need to use this app too)`;
      }
    } else {
      message = `ℹ️ Your Facebook data is already in the system.`;
    }
    
    return {
      count: insertedCount,
      friendsCount,
      totalContacts,
      message
    };
    
  } catch (error) {
    console.error('Facebook import error:', error);
    throw error;
  }
}

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`BeeTagged Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('MongoDB: configured');
});