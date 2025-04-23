const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  phone: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  title: {
    type: String,
    trim: true
  },
  notes: {
    type: String
  },
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
  linkedinId: {
    type: String
  },
  linkedinConnected: {
    type: Boolean,
    default: false
  },
  linkedinProfileUrl: {
    type: String
  },
  facebookId: {
    type: String
  },
  facebookConnected: {
    type: Boolean,
    default: false
  },
  facebookProfileUrl: {
    type: String
  },
  profilePicture: {
    type: String
  },
  source: {
    type: String,
    enum: ['manual', 'phone', 'linkedin', 'facebook'],
    default: 'manual'
  },
  lastSynced: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
ContactSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster queries
ContactSchema.index({ user: 1, name: 1 });
ContactSchema.index({ user: 1, email: 1 });
ContactSchema.index({ user: 1, linkedinId: 1 });
ContactSchema.index({ user: 1, facebookId: 1 });

module.exports = mongoose.model('Contact', ContactSchema);
