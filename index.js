const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');
const FacebookAPI = require('./server/facebook-api');

const app = express();
const facebookAPI = new FacebookAPI();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
  origin: ['https://beetagged.com', 'https://www.beetagged.com', 'http://localhost:3000', '*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Static files - serve dist first for React app
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.static(path.join(__dirname, 'public')));

// Upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${timestamp}-${random}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files allowed'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

/**
 * LinkedIn CSV Parser - Extracts contact data from LinkedIn export files
 * Supports standard LinkedIn CSV format with flexible column mapping
 * 
 * @param {string} filePath - Path to the uploaded CSV file
 * @returns {Promise<Array>} - Array of parsed contact objects
 */
function parseLinkedInCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    console.log('Starting CSV parsing for file:', filePath);
    
    // Create readable stream and pipe through CSV parser
    fs.createReadStream(filePath)
      .pipe(csv()) // Automatically detects headers from first row
      .on('data', (data) => {
        // Initialize contact object with unique ID and metadata
        const contact = {
          id: `linkedin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          source: 'linkedin_import',
          tags: []
        };
        
        // Enhanced field mapping - handles multiple possible column names
        const fieldMappings = [
          // Standard LinkedIn export format
          { csvField: 'First Name', contactField: 'firstName' },
          { csvField: 'Last Name', contactField: 'lastName' },
          { csvField: 'Email Address', contactField: 'email' },
          { csvField: 'Company', contactField: 'company' },
          { csvField: 'Position', contactField: 'title' },
          { csvField: 'Connected On', contactField: 'connectedOn' },
          { csvField: 'Location', contactField: 'location' },
          { csvField: 'Industry', contactField: 'industry' },
          { csvField: 'Phone Number', contactField: 'phone' },
          
          // Alternative formats (case variations and common alternatives)
          { csvField: 'first name', contactField: 'firstName' },
          { csvField: 'last name', contactField: 'lastName' },
          { csvField: 'email', contactField: 'email' },
          { csvField: 'company', contactField: 'company' },
          { csvField: 'position', contactField: 'title' },
          { csvField: 'title', contactField: 'title' },
          { csvField: 'job title', contactField: 'title' },
          { csvField: 'Name', contactField: 'fullName' },
          { csvField: 'Full Name', contactField: 'fullName' },
          { csvField: 'Organization', contactField: 'company' },
          { csvField: 'Employer', contactField: 'company' }
        ];
        
        // Extract data using flexible field mapping
        fieldMappings.forEach(mapping => {
          if (data[mapping.csvField] && data[mapping.csvField].trim()) {
            contact[mapping.contactField] = data[mapping.csvField].trim();
          }
        });
        
        // Handle full name splitting if we got a single name field
        if (contact.fullName && !contact.firstName && !contact.lastName) {
          const nameParts = contact.fullName.split(' ');
          contact.firstName = nameParts[0] || '';
          contact.lastName = nameParts.slice(1).join(' ') || '';
        }
        
        // Create full name by combining first and last name
        contact.name = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
        
        // Enhanced validation - accept contact if it has ANY meaningful data
        const hasValidData = contact.name || 
                           contact.company || 
                           contact.email || 
                           contact.title ||
                           contact.fullName;
        
        if (hasValidData) {
          // Generate intelligent tags based on contact data
          const tags = [];
          if (contact.location) tags.push({ type: 'location', name: contact.location });
          if (contact.company) tags.push({ type: 'company', name: contact.company });
          if (contact.title) tags.push({ type: 'position', name: contact.title });
          if (contact.industry) tags.push({ type: 'industry', name: contact.industry });
          
          contact.tags = tags;
          // Add LinkedIn icon as default profile picture
          contact.picture = 'https://cdn.jsdelivr.net/npm/simple-icons@v6/icons/linkedin.svg';
          
          results.push(contact);
          console.log(`Parsed contact: ${contact.name} at ${contact.company}`);
        } else {
          console.log('Skipped row - no name or company found');
        }
      })
      .on('end', () => {
        console.log(`CSV parsing complete. Found ${results.length} valid contacts`);
        resolve(results);
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        reject(error);
      });
  });
}

// Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'BeeTagged LinkedIn Import' 
  });
});

app.get('/status', (req, res) => {
  res.json({
    server: 'running',
    linkedinImport: 'available',
    routes: {
      import: '/li-import',
      api: '/api/import/linkedin'
    },
    timestamp: new Date().toISOString()
  });
});

// Test page
app.get('/li-import', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'li-import.html');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('LinkedIn import page not found');
  }
});

app.get('/squarespace-linkedin-import', (req, res) => {
  res.redirect('/li-import');
});

/**
 * LinkedIn Import API Endpoint - Processes uploaded LinkedIn CSV files
 * POST /api/import/linkedin
 * 
 * This endpoint accepts a CSV file upload, parses LinkedIn connection data,
 * converts it to our internal contact format, and generates intelligent tags.
 * 
 * Features:
 * - File validation and error handling
 * - Duplicate prevention (clears existing LinkedIn imports)
 * - Automatic tag generation based on company, location, position
 * - Contact format standardization for the BeeTagged system
 */
app.post('/api/import/linkedin', upload.single('linkedinCsv'), async (req, res) => {
  try {
    // Step 1: Validate file upload
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No CSV file uploaded' 
      });
    }

    console.log('Processing LinkedIn CSV file:', req.file.originalname);
    
    // Step 2: Parse the CSV file using our LinkedIn parser
    const importedContacts = await parseLinkedInCSV(req.file.path);
    
    // Step 3: Validate that we found meaningful contact data
    if (!importedContacts || importedContacts.length === 0) {
      console.log('No valid contacts found in CSV file');
      return res.status(400).json({ 
        success: false, 
        message: 'No valid contacts found in CSV file. Please check that your CSV has First Name, Last Name, Company, or Position columns.' 
      });
    }
    
    console.log(`Found ${importedContacts.length} valid contacts in CSV`);
    
    // Step 4: Clear existing LinkedIn imports to avoid duplicates
    // This ensures fresh data on each import while preserving manual contacts
    contacts = contacts.filter(c => c.source !== 'linkedin_import');
    
    // Step 5: Convert parsed contacts to BeeTagged internal format
    // This standardizes the data structure for consistent API responses
    importedContacts.forEach(contact => {
      const newContact = {
        _id: contactIdCounter++, // Unique internal ID
        name: contact.name,
        email: contact.email || '',
        phoneNumber: contact.phone || '',
        company: contact.company || '',
        title: contact.title || '',
        location: contact.location || '',
        industry: contact.industry || '',
        connectedOn: contact.connectedOn || '',
        source: 'linkedin_import', // Track data source for filtering
        picture: contact.picture,
        createdAt: new Date().toISOString(),
        
        // Priority data structure for search and filtering
        priorityData: {
          employment: { 
            current: { 
              jobFunction: contact.title || '', 
              employer: contact.company || '' 
            } 
          },
          location: { current: contact.location || '' }
        },
        
        // Tag mappings for search functionality  
        allTags: contact.tags.map(tag => ({
          name: tag.name,
          category: tag.type
        })),
        
        // LinkedIn-specific metadata
        linkedinData: { id: contact.id },
        tags: contact.tags
      };
      
      // Add to global contacts array
      contacts.push(newContact);
    });
    
    // Step 6: Generate and store unique tags from contact data
    // This builds our searchable tag database automatically
    const newTags = new Set();
    importedContacts.forEach(contact => {
      contact.tags.forEach(tag => {
        const tagName = tag.name;
        // Only add new tags (case-insensitive duplicate checking)
        if (tagName && !tags.find(t => t.name.toLowerCase() === tagName.toLowerCase())) {
          newTags.add(JSON.stringify({
            _id: tagIdCounter++,
            name: tagName,
            // Color coding by tag type for UI display
            color: tag.type === 'company' ? '#1e40af' :     // Blue for companies
                   tag.type === 'location' ? '#059669' :    // Green for locations  
                   tag.type === 'position' ? '#dc2626' :    // Red for positions
                   '#7c2d12',                               // Brown for other tags
            category: tag.type || 'general',
            createdAt: new Date().toISOString(),
            usageCount: 1,
            source: 'linkedin_import'
          }));
        }
      });
    });
    
    // Add new tags to global tags array
    newTags.forEach(tagStr => {
      tags.push(JSON.parse(tagStr));
    });
    
    // Step 7: Clean up uploaded file to save disk space
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('File cleanup error:', err);
    });
    
    // Step 8: Return success response with import statistics
    res.json({
      success: true,
      message: `Successfully imported ${importedContacts.length} contacts from LinkedIn`,
      contacts: importedContacts,
      count: importedContacts.length,
      totalContacts: contacts.length,
      newTags: Array.from(newTags).map(t => JSON.parse(t))
    });
    
  } catch (error) {
    // Error handling: Log detailed error and clean up files
    console.error('LinkedIn import error:', error);
    
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
    
    // Return error response to client
    res.status(500).json({
      success: false,
      message: 'Failed to import LinkedIn contacts',
      error: error.message
    });
  }
});

// Authentication endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    // Basic validation
    if (!username || !password || !email) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, and email are required'
      });
    }
    
    // In a real app, you'd hash the password and store in database
    // For demo purposes, we'll simulate successful registration
    const user = {
      id: Date.now(),
      username,
      email,
      createdAt: new Date().toISOString()
    };
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: user
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }
    
    // Demo authentication - accept any credentials for testing
    // In production, you'd validate against database
    if (username && password) {
      const user = {
        id: Date.now(),
        username,
        email: `${username}@example.com`,
        loginAt: new Date().toISOString()
      };
      
      res.json({
        success: true,
        message: 'Login successful',
        user: user,
        token: 'demo-jwt-token-' + Date.now()
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// Facebook API endpoints
app.get('/api/facebook/auth-url', (req, res) => {
  try {
    const redirectUri = req.query.redirect_uri || `${req.protocol}://${req.get('host')}/api/facebook/callback`;
    const state = req.query.state || '';
    
    const authUrl = facebookAPI.generateAuthURL(redirectUri, state);
    
    res.json({
      success: true,
      authUrl: authUrl,
      redirectUri: redirectUri
    });
  } catch (error) {
    console.error('Facebook auth URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate Facebook auth URL',
      error: error.message
    });
  }
});

app.get('/api/facebook/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Facebook authorization failed',
        error: error
      });
    }
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'No authorization code received'
      });
    }
    
    const redirectUri = `${req.protocol}://${req.get('host')}/api/facebook/callback`;
    const accessToken = await facebookAPI.exchangeCodeForToken(code, redirectUri);
    
    // Get user profile and friends
    const profile = await facebookAPI.getUserProfile(accessToken);
    const friends = await facebookAPI.getFriends(accessToken);
    const pages = await facebookAPI.getPages(accessToken);
    
    // Convert to contacts format
    const userContact = facebookAPI.formatContactFromProfile(profile, 'facebook_user');
    const friendContacts = friends.map(friend => 
      facebookAPI.formatContactFromProfile(friend, 'facebook_friend')
    );
    
    // Add to contacts storage
    const existingFacebookContacts = contacts.filter(c => c.source && c.source.startsWith('facebook'));
    contacts = contacts.filter(c => !c.source || !c.source.startsWith('facebook'));
    
    contacts.push(userContact);
    friendContacts.forEach(contact => {
      contact._id = contactIdCounter++;
      contacts.push(contact);
    });
    
    // Create tags from Facebook data
    const newTags = new Set();
    [userContact, ...friendContacts].forEach(contact => {
      contact.tags.forEach(tag => {
        const tagName = tag.name;
        if (tagName && !tags.find(t => t.name.toLowerCase() === tagName.toLowerCase())) {
          newTags.add(JSON.stringify({
            _id: tagIdCounter++,
            name: tagName,
            color: tag.category === 'company' ? '#1e40af' : 
                   tag.category === 'location' ? '#059669' : 
                   tag.category === 'education' ? '#dc2626' : 
                   tag.category === 'source' ? '#4f46e5' : '#7c2d12',
            category: tag.category || 'general',
            createdAt: new Date().toISOString(),
            usageCount: 1,
            source: 'facebook_import'
          }));
        }
      });
    });
    
    newTags.forEach(tagStr => {
      tags.push(JSON.parse(tagStr));
    });
    
    res.json({
      success: true,
      message: `Successfully imported ${friendContacts.length + 1} Facebook contacts`,
      user: userContact,
      friends: friendContacts,
      totalContacts: contacts.length,
      newTags: Array.from(newTags).map(t => JSON.parse(t))
    });
    
  } catch (error) {
    console.error('Facebook callback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process Facebook authorization',
      error: error.message
    });
  }
});

app.post('/api/facebook/import', async (req, res) => {
  try {
    const { accessToken } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Facebook access token is required'
      });
    }
    
    // Get user data
    const profile = await facebookAPI.getUserProfile(accessToken);
    const friends = await facebookAPI.getFriends(accessToken);
    const pages = await facebookAPI.getPages(accessToken);
    const likedPages = await facebookAPI.getLikedPages(accessToken);
    
    // Clear existing Facebook contacts
    contacts = contacts.filter(c => !c.source || !c.source.startsWith('facebook'));
    
    // Convert profile to contact
    const userContact = facebookAPI.formatContactFromProfile(profile, 'facebook_user');
    userContact._id = contactIdCounter++;
    contacts.push(userContact);
    
    // Convert friends to contacts
    const friendContacts = friends.map(friend => {
      const contact = facebookAPI.formatContactFromProfile(friend, 'facebook_friend');
      contact._id = contactIdCounter++;
      return contact;
    });
    contacts.push(...friendContacts);
    
    // Add pages as business contacts
    const pageContacts = pages.map(page => ({
      _id: contactIdCounter++,
      id: `fb_page_${page.id}`,
      name: page.name,
      company: page.name,
      title: 'Page Manager',
      source: 'facebook_page',
      facebookId: page.id,
      tags: [
        { name: page.category, category: 'industry' },
        { name: 'Facebook Page', category: 'source' }
      ],
      createdAt: new Date().toISOString(),
      priorityData: {
        employment: { current: { employer: page.name, jobFunction: 'Page Manager' } }
      }
    }));
    contacts.push(...pageContacts);
    
    // Create tags from all contacts
    const newTags = new Set();
    [...[userContact], ...friendContacts, ...pageContacts].forEach(contact => {
      contact.tags.forEach(tag => {
        const tagName = tag.name;
        if (tagName && !tags.find(t => t.name.toLowerCase() === tagName.toLowerCase())) {
          newTags.add(JSON.stringify({
            _id: tagIdCounter++,
            name: tagName,
            color: tag.category === 'company' ? '#1e40af' : 
                   tag.category === 'location' ? '#059669' : 
                   tag.category === 'education' ? '#dc2626' : 
                   tag.category === 'source' ? '#4f46e5' : '#7c2d12',
            category: tag.category || 'general',
            createdAt: new Date().toISOString(),
            usageCount: 1,
            source: 'facebook_import'
          }));
        }
      });
    });
    
    newTags.forEach(tagStr => {
      tags.push(JSON.parse(tagStr));
    });
    
    res.json({
      success: true,
      message: `Successfully imported ${friendContacts.length + pageContacts.length + 1} Facebook contacts`,
      stats: {
        user: 1,
        friends: friendContacts.length,
        pages: pageContacts.length,
        total: contacts.length
      },
      newTags: Array.from(newTags).map(t => JSON.parse(t))
    });
    
  } catch (error) {
    console.error('Facebook import error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import Facebook contacts',
      error: error.message
    });
  }
});

app.get('/api/auth/user', (req, res) => {
  // For demo purposes, return a mock user if token exists
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    res.json({
      success: true,
      user: {
        id: 1,
        username: 'demo-user',
        email: 'demo@example.com'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }
});

// Contact and Tag management endpoints
let contacts = [];
let tags = [];
let tagIdCounter = 1;
let contactIdCounter = 1;

// Tags API
app.get('/api/tags', (req, res) => {
  res.json({
    success: true,
    tags: tags
  });
});

app.post('/api/tags', (req, res) => {
  try {
    const { name, color, category } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Tag name is required'
      });
    }
    
    // Check if tag already exists
    const existingTag = tags.find(tag => tag.name.toLowerCase() === name.toLowerCase());
    if (existingTag) {
      return res.status(400).json({
        success: false,
        message: 'Tag already exists'
      });
    }
    
    const newTag = {
      _id: tagIdCounter++,
      name: name.trim(),
      color: color || '#007bff',
      category: category || 'general',
      createdAt: new Date().toISOString(),
      usageCount: 0
    };
    
    tags.push(newTag);
    
    res.status(201).json({
      success: true,
      message: 'Tag created successfully',
      tag: newTag
    });
    
  } catch (error) {
    console.error('Create tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create tag',
      error: error.message
    });
  }
});

app.put('/api/tags/:id', (req, res) => {
  try {
    const tagId = parseInt(req.params.id);
    const { name, color, category } = req.body;
    
    const tagIndex = tags.findIndex(tag => tag._id === tagId);
    if (tagIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }
    
    if (name) tags[tagIndex].name = name.trim();
    if (color) tags[tagIndex].color = color;
    if (category) tags[tagIndex].category = category;
    tags[tagIndex].updatedAt = new Date().toISOString();
    
    res.json({
      success: true,
      message: 'Tag updated successfully',
      tag: tags[tagIndex]
    });
    
  } catch (error) {
    console.error('Update tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tag'
    });
  }
});

app.delete('/api/tags/:id', (req, res) => {
  try {
    const tagId = parseInt(req.params.id);
    
    const tagIndex = tags.findIndex(tag => tag._id === tagId);
    if (tagIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }
    
    // Check if tag is being used by any contacts
    const tagUsage = contacts.filter(contact => 
      contact.tags && contact.tags.some(tag => tag._id === tagId)
    ).length;
    
    if (tagUsage > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete tag. It is used by ${tagUsage} contacts.`
      });
    }
    
    tags.splice(tagIndex, 1);
    
    res.json({
      success: true,
      message: 'Tag deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete tag'
    });
  }
});

// Contacts API
app.get('/api/contacts', (req, res) => {
  res.json({
    success: true,
    contacts: contacts,
    total: contacts.length,
    sources: {
      linkedin_import: contacts.filter(c => c.source === 'linkedin_import').length,
      manual: contacts.filter(c => c.source === 'manual').length,
      other: contacts.filter(c => c.source && c.source !== 'linkedin_import' && c.source !== 'manual').length
    }
  });
});

app.get('/api/contacts/stats', (req, res) => {
  const stats = {
    total: contacts.length,
    bySource: {
      linkedin_import: contacts.filter(c => c.source === 'linkedin_import').length,
      manual: contacts.filter(c => c.source === 'manual').length,
      other: contacts.filter(c => c.source && c.source !== 'linkedin_import' && c.source !== 'manual').length
    },
    companies: [...new Set(contacts.map(c => c.company).filter(Boolean))].length,
    tags: tags.length,
    lastImport: contacts.filter(c => c.source === 'linkedin_import').length > 0 ? 
      Math.max(...contacts.filter(c => c.source === 'linkedin_import').map(c => new Date(c.createdAt).getTime())) : null
  };
  
  res.json({
    success: true,
    stats: stats
  });
});

app.get('/api/contacts/:id', (req, res) => {
  try {
    const contactId = parseInt(req.params.id);
    const contact = contacts.find(c => c._id === contactId);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    res.json({
      success: true,
      contact: contact
    });
    
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get contact'
    });
  }
});

app.post('/api/contacts', (req, res) => {
  try {
    const { name, email, phone, company, title, tags: contactTags } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Contact name is required'
      });
    }
    
    const newContact = {
      _id: contactIdCounter++,
      name: name.trim(),
      email: email || '',
      phoneNumber: phone || '',
      company: company || '',
      title: title || '',
      tags: contactTags || [],
      createdAt: new Date().toISOString(),
      source: 'manual'
    };
    
    contacts.push(newContact);
    
    res.status(201).json({
      success: true,
      message: 'Contact created successfully',
      contact: newContact
    });
    
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create contact'
    });
  }
});

// Search API endpoint
app.post('/api/search/natural', (req, res) => {
  try {
    const { query, userId, context } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    // If no contacts exist, return empty results with helpful message
    if (contacts.length === 0) {
      return res.json({
        success: true,
        message: 'No contacts found. Please import your LinkedIn connections first.',
        results: [],
        total: 0,
        query: query
      });
    }
    
    const normalizedQuery = query.toLowerCase().trim();
    const results = [];
    
    contacts.forEach(contact => {
      let score = 0;
      let matches = false;
      
      // Natural language pattern matching
      if (normalizedQuery.includes('who works at')) {
        const companyMatch = normalizedQuery.match(/who works at (.+?)(\?|$)/);
        if (companyMatch) {
          const companyName = companyMatch[1].trim();
          if (contact.company && contact.company.toLowerCase().includes(companyName)) {
            score += 100;
            matches = true;
          }
        }
      } else if (normalizedQuery.includes('who knows')) {
        const skillMatch = normalizedQuery.match(/who knows (.+?)(\?|$)/);
        if (skillMatch) {
          const skill = skillMatch[1].trim();
          if (contact.allTags && contact.allTags.some(tag => 
            tag.name.toLowerCase().includes(skill) || 
            contact.title.toLowerCase().includes(skill)
          )) {
            score += 90;
            matches = true;
          }
        }
      } else if (normalizedQuery.includes('professionals') || normalizedQuery.includes('developers')) {
        const roleMatch = normalizedQuery.replace(/professionals|developers/, '').trim();
        if (contact.title && contact.title.toLowerCase().includes(roleMatch)) {
          score += 85;
          matches = true;
        }
      } else {
        // General search across all fields
        if (contact.name && contact.name.toLowerCase().includes(normalizedQuery)) {
          score += 50;
          matches = true;
        }
        if (contact.company && contact.company.toLowerCase().includes(normalizedQuery)) {
          score += 40;
          matches = true;
        }
        if (contact.title && contact.title.toLowerCase().includes(normalizedQuery)) {
          score += 35;
          matches = true;
        }
        if (contact.allTags && contact.allTags.some(tag => 
          tag.name.toLowerCase().includes(normalizedQuery)
        )) {
          score += 30;
          matches = true;
        }
      }
      
      if (matches) {
        results.push({
          ...contact,
          searchScore: score / 100
        });
      }
    });
    
    // Sort by score (highest first)
    results.sort((a, b) => b.searchScore - a.searchScore);
    
    res.json({
      success: true,
      results: results,
      total: results.length,
      query: query
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
});

// LinkedIn Import standalone page
app.get('/li-import', (req, res) => {
  const importPath = path.join(__dirname, 'public', 'linkedin-import-standalone.html');
  if (fs.existsSync(importPath)) {
    res.sendFile(importPath);
  } else {
    res.status(404).send('LinkedIn import page not found');
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Application not found - build may be missing');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`BeeTagged LinkedIn Import Server`);
  console.log(`Running on port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Test page: /li-import`);
  console.log(`API: /api/import/linkedin`);
});

module.exports = app;