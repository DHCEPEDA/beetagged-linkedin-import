const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const { processContactData } = require('../utils/dataProcessor');

// Get all contacts
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    const query = userId ? { userId } : {};
    const contacts = await Contact.find(query).sort({ createdAt: -1 });
    console.log(`Returning ${contacts.length} contacts`);
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Get contacts for specific user
router.get('/:userId', async (req, res) => {
  try {
    const contacts = await Contact.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new contact
router.post('/', async (req, res) => {
  try {
    const processedData = processContactData(req.body);
    const contact = new Contact(processedData);
    await contact.save();
    res.status(201).json(contact);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update contact
router.put('/:id', async (req, res) => {
  try {
    const processedData = processContactData(req.body);
    processedData.updatedAt = new Date();
    
    const contact = await Contact.findByIdAndUpdate(
      req.params.id, 
      processedData, 
      { new: true }
    );
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json(contact);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete contact
router.delete('/:id', async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk import contacts
router.post('/bulk-import', async (req, res) => {
  try {
    const { contacts, userId } = req.body;
    
    if (!contacts || !Array.isArray(contacts)) {
      return res.status(400).json({ error: 'Invalid contacts data' });
    }
    
    const processedContacts = contacts.map(contact => 
      processContactData({ ...contact, userId, createdAt: new Date() })
    );
    
    const result = await Contact.insertMany(processedContacts, { ordered: false });
    res.json({ 
      success: true,
      imported: result.length, 
      contacts: result 
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;