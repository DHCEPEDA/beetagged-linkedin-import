const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
  origin: '*',
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

// LinkedIn CSV parser
function parseLinkedInCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        const contact = {
          id: `linkedin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          source: 'linkedin_import',
          tags: []
        };
        
        const fields = {
          'First Name': 'firstName',
          'Last Name': 'lastName', 
          'Email Address': 'email',
          'Company': 'company',
          'Position': 'title',
          'Connected On': 'connectedOn',
          'Location': 'location',
          'Industry': 'industry',
          'Phone Number': 'phone'
        };
        
        Object.keys(data).forEach(col => {
          if (fields[col] && data[col]) {
            contact[fields[col]] = data[col].trim();
          }
        });
        
        contact.name = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
        
        const tags = [];
        if (contact.location) tags.push({ type: 'location', name: contact.location });
        if (contact.company) tags.push({ type: 'company', name: contact.company });
        if (contact.title) tags.push({ type: 'position', name: contact.title });
        if (contact.industry) tags.push({ type: 'industry', name: contact.industry });
        
        contact.tags = tags;
        contact.picture = 'https://cdn.jsdelivr.net/npm/simple-icons@v6/icons/linkedin.svg';
        
        results.push(contact);
      })
      .on('end', () => resolve(results))
      .on('error', reject);
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

// LinkedIn import API
app.post('/api/import/linkedin', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No CSV file uploaded' 
      });
    }

    const contacts = await parseLinkedInCSV(req.file.path);
    
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('File cleanup error:', err);
    });
    
    res.json({
      success: true,
      message: `Successfully imported ${contacts.length} contacts from LinkedIn`,
      contacts,
      count: contacts.length
    });
    
  } catch (error) {
    console.error('LinkedIn import error:', error);
    
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
    
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
    contacts: contacts
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
    
    // Add demo contacts if none exist
    if (contacts.length === 0) {
      contacts = [
        {
          _id: 1,
          name: 'John Smith',
          phoneNumber: '+1234567890',
          email: 'john.smith@google.com',
          company: 'Google',
          title: 'Software Engineer',
          priorityData: {
            employment: { current: { jobFunction: 'Software Engineer', employer: 'Google' } },
            location: { current: 'San Francisco, CA' }
          },
          allTags: [
            { name: 'JavaScript', category: 'skill' },
            { name: 'React', category: 'skill' },
            { name: 'Google', category: 'company' },
            { name: 'Tech Industry', category: 'industry' }
          ],
          linkedinData: { id: 'john-smith-123' },
          source: 'linkedin'
        },
        {
          _id: 2,
          name: 'Sarah Chen',
          phoneNumber: '+1987654321',
          email: 'sarah.chen@google.com',
          company: 'Google',
          title: 'Product Manager',
          priorityData: {
            employment: { current: { jobFunction: 'Product Manager', employer: 'Google' } },
            location: { current: 'Mountain View, CA' }
          },
          allTags: [
            { name: 'Product Management', category: 'skill' },
            { name: 'Google', category: 'company' },
            { name: 'Analytics', category: 'skill' }
          ],
          linkedinData: { id: 'sarah-chen-456' },
          source: 'linkedin'
        },
        {
          _id: 3,
          name: 'Michael Rodriguez',
          phoneNumber: '+1555123456',
          email: 'michael.rodriguez@meta.com',
          company: 'Meta',
          title: 'Marketing Director',
          priorityData: {
            employment: { current: { jobFunction: 'Marketing Director', employer: 'Meta' } },
            location: { current: 'Menlo Park, CA' }
          },
          allTags: [
            { name: 'Digital Marketing', category: 'skill' },
            { name: 'Meta', category: 'company' },
            { name: 'Leadership', category: 'personality' }
          ],
          source: 'linkedin'
        },
        {
          _id: 4,
          name: 'Emily Wang',
          phoneNumber: '+1555987654',
          email: 'emily.wang@apple.com',
          company: 'Apple',
          title: 'UX Designer',
          priorityData: {
            employment: { current: { jobFunction: 'UX Designer', employer: 'Apple' } },
            location: { current: 'Cupertino, CA' }
          },
          allTags: [
            { name: 'UX Design', category: 'skill' },
            { name: 'Apple', category: 'company' },
            { name: 'Design', category: 'skill' }
          ],
          source: 'linkedin'
        }
      ];
      contactIdCounter = 5;
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
  console.log(`Test page: /li-import`);
  console.log(`API: /api/import/linkedin`);
});

module.exports = app;