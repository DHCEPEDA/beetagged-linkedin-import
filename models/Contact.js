const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  name: { type: String, required: true },
  email: String,
  phone: String,
  company: String,
  position: String,
  location: String,
  skills: [String],
  tags: [String],
  source: { 
    type: String, 
    enum: ['linkedin', 'facebook', 'manual', 'linkedin_import'], 
    default: 'manual' 
  },
  profileUrl: String,
  profileImage: String,
  bio: String,
  connectedOn: String,
  notes: String,
  ranking: {
    coding: Number,
    cooking: Number,
    intelligence: Number,
    networking: Number,
    leadership: Number
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Text search index for enhanced search capabilities
contactSchema.index({ 
  name: 'text', 
  company: 'text', 
  position: 'text', 
  location: 'text',
  email: 'text'
});

// Compound indexes for performance
contactSchema.index({ userId: 1, createdAt: -1 });
contactSchema.index({ company: 1, position: 1 });

module.exports = mongoose.model('Contact', contactSchema);