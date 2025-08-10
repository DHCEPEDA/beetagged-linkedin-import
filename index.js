const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 5000;

// ===== SECURITY & MIDDLEWARE =====
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(express.json());

// CORS for Squarespace integration
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://www.beetagged.com',
      'https://beetagged.com',
      'https://beetagged.squarespace.com',
      'http://localhost:3000',
      'http://localhost:5000',
      'http://127.0.0.1:3000',
      'https://replit.dev',
      'https://*.replit.dev',
      'https://*.repl.co'
    ];
    
    if (!origin || allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        return origin.includes(allowed.replace('https://*.', '').replace('*', ''));
      }
      return allowed === origin;
    })) {
      callback(null, true);
    } else {
      callback(null, true); // Allow for development
    }
  },
  credentials: false,
  methods: ['GET', 'POST', 'OPTIONS'],
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

// ===== MONGODB CONNECTION =====

function connectMongoDB() {
  // Fix database name from 'test' to 'beetagged'
  const mongoUri = process.env.MONGODB_URI.replace('/test?', '/beetagged?');
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
  name: String,
  email: String,
  phone: String,
  company: String,
  position: String,
  location: String,
  tags: [String],
  source: String,
  connectedOn: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Contact = mongoose.model('Contact', contactSchema);

// ===== FILE UPLOAD SETUP =====

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// ===== UTILITY FUNCTIONS =====

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

// Enhanced CSV processing with LinkedIn format support
function processSingleCSV(lines) {
  const contacts = [];
  const errors = [];
  
  // Parse headers - handle LinkedIn CSV format with notes at the top
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
    
    // Check if this looks like a LinkedIn header row
    if (testHeaders.some(h => h && (
      h.toLowerCase().includes('first name') || 
      h.toLowerCase().includes('last name') ||
      h.toLowerCase().includes('company') ||
      h.toLowerCase().includes('position') ||
      h.toLowerCase().includes('email') ||
      h.toLowerCase().includes('connected')
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
    throw new Error('Could not find valid LinkedIn CSV headers. Please check your file format.');
  }
  
  console.log('CSV Headers found:', headers);
  console.log('Header found at line:', headerIndex);
  console.log('Raw header line:', headerLine);
  
  // Enhanced header validation - accept minimal LinkedIn format
  const hasValidHeaders = headers.some(header => 
    header.toLowerCase().includes('name') || 
    header.toLowerCase().includes('company') ||
    header.toLowerCase().includes('position') ||
    header.toLowerCase().includes('connected')
  );
  
  if (!hasValidHeaders) {
    throw new Error('This doesn\'t appear to be a valid LinkedIn connections CSV. Expected headers like "First Name", "Last Name", etc.');
  }
  
  // Find column indices with better mapping
  const indices = {
    firstName: findHeaderIndex(headers, LINKEDIN_HEADER_MAPPINGS.firstName),
    lastName: findHeaderIndex(headers, LINKEDIN_HEADER_MAPPINGS.lastName),
    name: findHeaderIndex(headers, LINKEDIN_HEADER_MAPPINGS.name),
    email: findHeaderIndex(headers, LINKEDIN_HEADER_MAPPINGS.email),
    company: findHeaderIndex(headers, LINKEDIN_HEADER_MAPPINGS.company),
    position: findHeaderIndex(headers, LINKEDIN_HEADER_MAPPINGS.position),
    location: findHeaderIndex(headers, LINKEDIN_HEADER_MAPPINGS.location),
    connectedOn: findHeaderIndex(headers, LINKEDIN_HEADER_MAPPINGS.connectedOn),
    url: findHeaderIndex(headers, LINKEDIN_HEADER_MAPPINGS.url)
  };

  console.log('Field indices:', indices);
  console.log('Available headers for mapping:', headers.map((h, i) => `${i}: "${h}"`));
  
  // Debug email field specifically
  if (indices.email >= 0) {
    console.log(`✅ Email field found at index ${indices.email}: "${headers[indices.email]}"`);
  } else {
    console.log('❌ No email field found in headers');
  }

  // Validate that we found at least name fields
  if (indices.firstName === -1 && indices.lastName === -1 && indices.name === -1) {
    throw new Error('Could not find name columns in CSV. Expected "First Name" and "Last Name" or similar.');
  }

  // Check what data we can expect to extract
  const availableFields = [];
  if (indices.firstName >= 0 || indices.lastName >= 0) availableFields.push('Names');
  if (indices.email >= 0) availableFields.push('Emails');
  if (indices.company >= 0) availableFields.push('Companies');
  if (indices.position >= 0) availableFields.push('Positions');
  if (indices.location >= 0) availableFields.push('Locations');
  
  console.log('Will extract:', availableFields.join(', '));
  
  // Warn if only basic data is available
  if (availableFields.length === 1 && availableFields[0] === 'Names') {
    console.log('⚠️ LinkedIn export contains only names - no company/email data available');
  }

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

      // Extract name with priority: explicit name field > firstName + lastName
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

      // Extract field data with better error handling
      const emailRaw = indices.email >= 0 && fields[indices.email] ? fields[indices.email].trim() : '';
      const companyRaw = indices.company >= 0 && fields[indices.company] ? fields[indices.company].trim() : '';
      const positionRaw = indices.position >= 0 && fields[indices.position] ? fields[indices.position].trim() : '';
      
      const contactData = {
        name,
        email: emailRaw.toLowerCase(),
        company: companyRaw,
        position: positionRaw,
        location: indices.location >= 0 && fields[indices.location] ? fields[indices.location].trim() : '',
        connectedOn: indices.connectedOn >= 0 && fields[indices.connectedOn] ? fields[indices.connectedOn].trim() : '',
        url: indices.url >= 0 && fields[indices.url] ? fields[indices.url].trim() : '',
        source: 'linkedin_import'
      };

      // Debug sample contacts
      if (contacts.length < 3) {
        console.log(`Sample contact ${contacts.length + 1}:`, JSON.stringify(contactData));
        console.log(`Raw fields for row ${contacts.length + 1}:`, fields);
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

// ===== API ROUTES =====

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'BeeTagged Server running',
    environment: process.env.NODE_ENV || 'development',
    mongodb: 'configured'
  });
});

// Search contacts
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    console.log('Search request for:', query);

    if (!query) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }

    // Try text search first (requires text index)
    let contacts = [];
    try {
      contacts = await Contact.find({ 
        $text: { $search: query } 
      }, { 
        score: { $meta: "textScore" } 
      }).sort({ 
        score: { $meta: "textScore" } 
      }).limit(50).lean();
    } catch (textSearchError) {
      console.log('Text search failed, using regex fallback:', textSearchError.message);
      
      // Fallback to regex search
      contacts = await Contact.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { company: { $regex: query, $options: 'i' } },
          { position: { $regex: query, $options: 'i' } },
          { location: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ]
      }).limit(50).lean();
    }

    console.log(`Found ${contacts.length} contacts for query: ${query}`);
    res.json({ contacts });
    
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// LinkedIn CSV import
app.post('/api/import/linkedin', upload.fields([
  { name: 'linkedinCsv', maxCount: 1 },
  { name: 'csvFile', maxCount: 1 },
  { name: 'connectionsFile', maxCount: 1 },
  { name: 'contactsCsv', maxCount: 1 },
  { name: 'contactsFile', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('=== LinkedIn CSV Import Started ===');
    console.log('Files received:', req.files);
    
    const linkedinFile = req.files?.linkedinCsv?.[0] || req.files?.csvFile?.[0] || req.files?.connectionsFile?.[0];
    
    if (!linkedinFile) {
      return res.status(400).json({ 
        success: false, 
        message: 'No files uploaded. Please select a CSV file from LinkedIn export.' 
      });
    }
    
    console.log('LinkedIn file:', !!linkedinFile);

    // Validate file type
    if (!linkedinFile.originalname?.toLowerCase().endsWith('.csv')) {
      return res.status(400).json({ 
        success: false, 
        message: `${linkedinFile.originalname} is not a CSV file. LinkedIn exports are in CSV format.` 
      });
    }

    // Parse CSV file
    const csvData = linkedinFile.buffer.toString('utf8');
    const lines = csvData.split(/\r?\n/).filter(line => line.trim());
    console.log('Total lines found:', lines.length);
    
    if (lines.length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'CSV file appears to be empty or only contains headers. Please check your LinkedIn export.' 
      });
    }
    
    // Process CSV with enhanced LinkedIn format support
    const mergedContacts = processSingleCSV(lines);
    
    if (mergedContacts.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No valid contacts found in the uploaded files.' 
      });
    }

    // Save to database
    let insertedCount = 0;
    let duplicateCount = 0;
    let contactsWithCompany = 0;
    let contactsWithEmail = 0;
    
    for (const contactData of mergedContacts) {
      if (contactData.company) contactsWithCompany++;
      if (contactData.email) contactsWithEmail++;
      
      try {
        // Check for existing contact by name
        const existingContact = await Contact.findOne({ 
          name: { $regex: new RegExp(`^${contactData.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });
        
        if (!existingContact) {
          // Create new contact
          const contact = new Contact({
            name: contactData.name,
            email: contactData.email,
            phone: contactData.phone,
            company: contactData.company,
            position: contactData.position,
            location: contactData.location,
            source: 'linkedin_import',
            connectedOn: contactData.connectedOn,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          await contact.save();
          insertedCount++;
        } else {
          // Update existing contact with additional data if available
          const updates = {};
          if (contactData.email && !existingContact.email) updates.email = contactData.email;
          if (contactData.company && !existingContact.company) updates.company = contactData.company;
          if (contactData.position && !existingContact.position) updates.position = contactData.position;
          if (contactData.location && !existingContact.location) updates.location = contactData.location;
          if (contactData.connectedOn && !existingContact.connectedOn) updates.connectedOn = contactData.connectedOn;
          
          if (Object.keys(updates).length > 0) {
            await Contact.findByIdAndUpdate(existingContact._id, updates);
            console.log(`Enhanced existing contact: ${contactData.name}`);
          }
          duplicateCount++;
        }
      } catch (error) {
        console.error(`Error saving contact ${contactData.name}:`, error);
      }
    }

    const totalContacts = await Contact.countDocuments();
    console.log(`=== Import Complete ===`);
    console.log(`Processed: ${mergedContacts.length}`);
    console.log(`Inserted: ${insertedCount}`);
    console.log(`Enhanced/Skipped: ${duplicateCount}`);
    console.log(`Total contacts in DB: ${totalContacts}`);

    res.json({
      success: true,
      count: insertedCount,
      processed: mergedContacts.length,
      enhanced: duplicateCount,
      totalContacts: totalContacts,
      message: insertedCount > 0 
        ? `✅ Successfully imported ${insertedCount} new contacts! ${duplicateCount > 0 ? `Enhanced ${duplicateCount} existing contacts. ` : ''}Data includes: ${contactsWithCompany > 0 ? `${contactsWithCompany} companies, ` : ''}${contactsWithEmail > 0 ? `${contactsWithEmail} emails, ` : ''}profile links, and connection dates.`
        : duplicateCount > 0
          ? `⚠️ No new contacts added, but enhanced ${duplicateCount} existing contacts with additional data from your files.`
          : `❌ No valid contacts found in the uploaded files.`
    });

  } catch (error) {
    console.error('=== Import Error ===', error);
    res.status(500).json({ 
      success: false, 
      message: `Upload failed: ${error.message}. Please try again or check your CSV format.`
    });
  }
});

// Facebook OAuth endpoints

// Facebook OAuth initiation
app.get('/api/facebook/auth', (req, res) => {
  const fbAppId = process.env.FACEBOOK_APP_ID;
  const redirectUri = req.get('origin') + '/api/facebook/callback';
  
  const params = new URLSearchParams({
    client_id: fbAppId,
    redirect_uri: redirectUri,
    scope: 'public_profile,email,user_friends',
    response_type: 'code',
    state: 'beetagged_facebook_auth'
  });
  
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  console.log('Facebook auth URL:', authUrl);
  
  res.json({ authUrl });
});

// Facebook OAuth callback
app.get('/api/facebook/callback', async (req, res) => {
  const { code, error, error_description } = req.query;
  
  if (error) {
    console.error('Facebook OAuth error:', error, error_description);
    return res.redirect('/?facebook_error=' + encodeURIComponent(error_description || error));
  }
  
  try {
    const fbAppId = process.env.FACEBOOK_APP_ID;
    const fbAppSecret = process.env.FACEBOOK_APP_SECRET;
    const redirectUri = req.get('origin') + '/api/facebook/callback';
    
    // Exchange code for access token
    const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: fbAppId,
        client_secret: fbAppSecret,
        redirect_uri: redirectUri,
        code: code
      }
    });
    
    const accessToken = tokenResponse.data.access_token;
    console.log('Facebook access token obtained');
    
    // Get user profile
    const profileResponse = await axios.get('https://graph.facebook.com/v18.0/me', {
      params: {
        fields: 'id,name,email,link',
        access_token: accessToken
      }
    });
    
    const profile = profileResponse.data;
    console.log('Facebook profile obtained:', profile.name);
    
    // Import Facebook data
    const importResult = await importFacebookData(accessToken, profile);
    
    // Redirect back to frontend with success
    res.redirect('/?facebook_success=' + encodeURIComponent(JSON.stringify({
      profile: profile.name,
      count: importResult.count,
      friends: importResult.friendsCount
    })));
    
  } catch (error) {
    console.error('Facebook callback error:', error.response?.data || error.message);
    res.redirect('/?facebook_error=' + encodeURIComponent('Failed to process Facebook login'));
  }
});

// Enhanced Facebook import with friends support
app.post('/api/facebook/import', async (req, res) => {
  try {
    console.log('=== Facebook Import Started ===');
    const { accessToken, userID, profile } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'Facebook access token is required' 
      });
    }
    
    const importResult = await importFacebookData(accessToken, profile);
    
    res.json({
      success: true,
      count: importResult.count,
      friendsCount: importResult.friendsCount,
      totalContacts: importResult.totalContacts,
      message: importResult.message
    });

  } catch (error) {
    console.error('=== Facebook Import Error ===', error);
    res.status(500).json({ 
      success: false, 
      message: `Facebook import failed: ${error.message}`
    });
  }
});

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