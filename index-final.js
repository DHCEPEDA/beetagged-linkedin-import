const express = require('express');
const cors = require('cors');

const app = express();

console.log('Starting BeeTagged server...');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log('Middleware configured');

// In-memory storage
let contacts = [];
let contactIdCounter = 1;

// Routes
app.get('/', (req, res) => {
  console.log('Root route accessed');
  res.send(`
    <h1>BeeTagged Server Running!</h1>
    <p>Server is working correctly.</p>
    <p>Contacts stored: ${contacts.length}</p>
    <ul>
      <li><a href="/health">Health Check</a></li>
      <li><a href="/api/contacts">View Contacts</a></li>
    </ul>
  `);
});

app.get('/health', (req, res) => {
  console.log('Health check accessed');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    contacts: contacts.length
  });
});

app.get('/api/contacts', (req, res) => {
  console.log('Contacts API accessed');
  res.json({
    success: true,
    contacts: contacts,
    total: contacts.length
  });
});

app.post('/api/contacts', (req, res) => {
  console.log('Adding contact:', req.body);
  const { name, company, title } = req.body;
  
  if (!name) {
    return res.status(400).json({ success: false, message: 'Name required' });
  }
  
  const contact = {
    _id: contactIdCounter++,
    name: name,
    company: company || '',
    title: title || '',
    createdAt: new Date().toISOString()
  };
  
  contacts.push(contact);
  
  res.json({
    success: true,
    message: 'Contact added',
    contact: contact,
    total: contacts.length
  });
});

const PORT = process.env.PORT || 5000;

console.log(`Attempting to bind to port: ${PORT}`);

app.listen(PORT, (err) => {
  if (err) {
    console.error('FATAL: Server failed to start:', err);
    process.exit(1);
  }
  console.log(`SUCCESS: Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('Server startup complete');
});

// Error handling
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
});

console.log('Server initialization complete - waiting for port binding...');