/**
 * Contact Model
 * MongoDB schema for BeeTagged contacts with social media enrichment and gamification
 */

const mongoose = require('mongoose');

// Tag schema for structured tagging
const tagSchema = new mongoose.Schema({
  value: { type: String, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['location', 'professional', 'skills', 'interests', 'education', 'personal', 'social']
  },
  type: { type: String }, // e.g., 'company', 'position', 'city', 'skill'
  source: { 
    type: String, 
    required: true,
    enum: [
      'facebook_location', 'facebook_work', 'facebook_education', 'facebook_interests', 'facebook_personal', 'facebook_social',
      'linkedin_experience', 'linkedin_skills', 'linkedin_education', 'linkedin_location', 'linkedin_industry', 'linkedin_social',
      'work_history', 'education_history', 'location_data', 'manual', 'inferred_from_company', 'inferred_from_job_title',
      'inferred_from_education', 'parsed_location', 'calculated_tenure', 'user_validated'
    ]
  },
  confidence: { type: Number, min: 0, max: 1, default: 0.5 },
  isCurrent: { type: Boolean, default: false },
  endorsements: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  validatedAt: { type: Date },
  validatedBy: { type: String } // User ID who validated this tag
});

// Location data schema
const locationDataSchema = new mongoose.Schema({
  currentLocation: {
    name: String,
    id: String
  },
  hometown: {
    name: String,
    id: String
  },
  cities: [String],
  coordinates: {
    latitude: Number,
    longitude: Number
  }
});

// Work history schema
const workHistorySchema = new mongoose.Schema({
  employer: String,
  position: String,
  location: String,
  startDate: String,
  endDate: String,
  description: String,
  isCurrent: { type: Boolean, default: false }
});

// Education schema
const educationSchema = new mongoose.Schema({
  school: String,
  type: String,
  year: String,
  concentration: [String],
  degree: String
});

// Facebook data schema
const facebookDataSchema = new mongoose.Schema({
  name: String,
  email: String,
  profilePictureUrl: String,
  coverPhotoUrl: String,
  about: String,
  website: String,
  relationshipStatus: String,
  birthday: String,
  interestedIn: [String],
  mutualFriends: Number
});

// LinkedIn data schema
const linkedinDataSchema = new mongoose.Schema({
  name: String,
  email: String,
  profilePictureUrl: String,
  headline: String,
  summary: String,
  industry: String,
  numConnections: Number,
  publicProfileUrl: String
});

// Main contact schema
const contactSchema = new mongoose.Schema({
  // User association
  userId: { 
    type: String, 
    required: true,
    index: true 
  },
  
  // Basic contact information
  name: { type: String, required: true },
  email: String,
  phoneNumber: String,
  
  // Professional information
  company: String,
  jobTitle: String,
  industry: String,
  
  // Location information
  location: String,
  hometown: String,
  locationData: locationDataSchema,
  
  // Profile images
  profilePictureUrl: String,
  
  // Social media IDs
  facebookId: String,
  linkedinId: String,
  
  // Rich social media data
  facebookData: facebookDataSchema,
  linkedinData: linkedinDataSchema,
  
  // Work and education history
  workHistory: [workHistorySchema],
  education: [educationSchema],
  
  // Skills array (legacy support)
  skills: [String],
  
  // Auto-generated tags
  tags: [tagSchema],
  
  // Categorized tags for easy access
  tagCategories: {
    location: [tagSchema],
    professional: [tagSchema],
    skills: [tagSchema],
    interests: [tagSchema],
    education: [tagSchema],
    personal: [tagSchema],
    social: [tagSchema]
  },
  
  // Gamification and ranking data
  tagRankings: {
    type: Map,
    of: Number,
    default: new Map()
  },
  
  // Matching and enrichment metadata
  matchConfidence: { type: Number, min: 0, max: 1, default: 0 },
  matchMethod: {
    type: String,
    enum: ['phone', 'email', 'name_exact', 'name_fuzzy', 'manual']
  },
  autoTagConfidence: { type: Number, min: 0, max: 1, default: 0 },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastEnriched: Date,
  lastAutoTagged: Date,
  lastTagUpdate: Date,
  
  // Source tracking
  source: {
    type: String,
    enum: ['phone', 'facebook', 'linkedin', 'phone_facebook', 'phone_linkedin', 'manual', 'import'],
    default: 'manual'
  },
  
  // Privacy and opt-in settings
  optInMarketing: { type: Boolean, default: false },
  optInRecruitment: { type: Boolean, default: false },
  privacyLevel: {
    type: String,
    enum: ['public', 'friends', 'private'],
    default: 'friends'
  },
  
  // Interaction tracking
  lastInteraction: Date,
  interactionCount: { type: Number, default: 0 },
  
  // Search optimization
  searchableText: String, // Concatenated text for full-text search
  
  // Validation status
  isValidated: { type: Boolean, default: false },
  validationErrors: [String]
}, {
  timestamps: true
});

// Indexes for performance
contactSchema.index({ userId: 1, name: 1 });
contactSchema.index({ userId: 1, company: 1 });
contactSchema.index({ userId: 1, location: 1 });
contactSchema.index({ userId: 1, 'tags.value': 1 });
contactSchema.index({ userId: 1, 'tags.category': 1 });
contactSchema.index({ facebookId: 1 });
contactSchema.index({ linkedinId: 1 });
contactSchema.index({ email: 1 });
contactSchema.index({ phoneNumber: 1 });

// Text search index
contactSchema.index({
  name: 'text',
  company: 'text',
  jobTitle: 'text',
  location: 'text',
  'tags.value': 'text',
  searchableText: 'text'
});

// Pre-save middleware to update searchable text
contactSchema.pre('save', function(next) {
  // Update timestamps
  this.updatedAt = new Date();
  
  // Build searchable text field
  const searchableFields = [
    this.name,
    this.email,
    this.company,
    this.jobTitle,
    this.location,
    this.hometown,
    this.industry
  ];
  
  // Add tag values to searchable text
  if (this.tags && this.tags.length > 0) {
    this.tags.forEach(tag => {
      if (tag.value) {
        searchableFields.push(tag.value);
      }
    });
  }
  
  // Add work history to searchable text
  if (this.workHistory && this.workHistory.length > 0) {
    this.workHistory.forEach(work => {
      if (work.employer) searchableFields.push(work.employer);
      if (work.position) searchableFields.push(work.position);
      if (work.location) searchableFields.push(work.location);
    });
  }
  
  // Add education to searchable text
  if (this.education && this.education.length > 0) {
    this.education.forEach(edu => {
      if (edu.school) searchableFields.push(edu.school);
      if (edu.degree) searchableFields.push(edu.degree);
      if (edu.concentration) searchableFields.push(...edu.concentration);
    });
  }
  
  // Create searchable text
  this.searchableText = searchableFields
    .filter(field => field && typeof field === 'string')
    .join(' ')
    .toLowerCase();
  
  next();
});

// Virtual for full name (if first/last names are separate)
contactSchema.virtual('fullName').get(function() {
  return this.name;
});

// Instance methods
contactSchema.methods.addTag = function(tagData) {
  this.tags.push(tagData);
  
  // Also add to categorized tags
  if (this.tagCategories && tagData.category) {
    if (!this.tagCategories[tagData.category]) {
      this.tagCategories[tagData.category] = [];
    }
    this.tagCategories[tagData.category].push(tagData);
  }
  
  this.lastTagUpdate = new Date();
  return this.save();
};

contactSchema.methods.updateTagRanking = function(category, score) {
  if (!this.tagRankings) {
    this.tagRankings = new Map();
  }
  
  const currentScore = this.tagRankings.get(category) || 0;
  this.tagRankings.set(category, currentScore + score);
  this.lastTagUpdate = new Date();
  
  return this.save();
};

contactSchema.methods.getTagsByCategory = function(category) {
  return this.tags.filter(tag => tag.category === category);
};

contactSchema.methods.hasTag = function(tagValue, category = null) {
  return this.tags.some(tag => {
    if (category) {
      return tag.value === tagValue && tag.category === category;
    }
    return tag.value === tagValue;
  });
};

contactSchema.methods.getRelevanceScore = function(searchQuery) {
  // Calculate relevance score for search ranking
  let score = 0;
  
  const query = searchQuery.toLowerCase();
  
  // Name match (highest weight)
  if (this.name && this.name.toLowerCase().includes(query)) {
    score += 10;
  }
  
  // Company match
  if (this.company && this.company.toLowerCase().includes(query)) {
    score += 8;
  }
  
  // Job title match
  if (this.jobTitle && this.jobTitle.toLowerCase().includes(query)) {
    score += 7;
  }
  
  // Location match
  if (this.location && this.location.toLowerCase().includes(query)) {
    score += 6;
  }
  
  // Tag matches
  if (this.tags && this.tags.length > 0) {
    this.tags.forEach(tag => {
      if (tag.value && tag.value.toLowerCase().includes(query)) {
        score += tag.confidence * 5; // Weight by tag confidence
      }
    });
  }
  
  // Boost for high-confidence matches
  if (this.matchConfidence > 0.8) {
    score *= 1.2;
  }
  
  // Boost for validated contacts
  if (this.isValidated) {
    score *= 1.1;
  }
  
  return score;
};

// Static methods
contactSchema.statics.findByTag = function(userId, tagValue, category = null) {
  const query = { userId: userId };
  
  if (category) {
    query['tags'] = {
      $elemMatch: {
        value: new RegExp(tagValue, 'i'),
        category: category
      }
    };
  } else {
    query['tags.value'] = new RegExp(tagValue, 'i');
  }
  
  return this.find(query);
};

contactSchema.statics.searchContacts = function(userId, searchQuery, options = {}) {
  const {
    limit = 50,
    skip = 0,
    sortBy = 'relevance'
  } = options;
  
  // Build search query
  const query = {
    userId: userId,
    $text: { $search: searchQuery }
  };
  
  let sortOptions = {};
  
  if (sortBy === 'relevance') {
    sortOptions = { score: { $meta: 'textScore' } };
  } else if (sortBy === 'name') {
    sortOptions = { name: 1 };
  } else if (sortBy === 'lastInteraction') {
    sortOptions = { lastInteraction: -1 };
  }
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .sort(sortOptions)
    .limit(limit)
    .skip(skip);
};

contactSchema.statics.getEnrichmentStats = function(userId) {
  return this.aggregate([
    { $match: { userId: userId } },
    {
      $group: {
        _id: null,
        totalContacts: { $sum: 1 },
        enrichedWithFacebook: {
          $sum: { $cond: [{ $ne: ['$facebookId', null] }, 1, 0] }
        },
        enrichedWithLinkedIn: {
          $sum: { $cond: [{ $ne: ['$linkedinId', null] }, 1, 0] }
        },
        autoTagged: {
          $sum: { $cond: [{ $ne: ['$lastAutoTagged', null] }, 1, 0] }
        },
        averageTagCount: { $avg: { $size: '$tags' } },
        averageMatchConfidence: { $avg: '$matchConfidence' }
      }
    }
  ]);
};

module.exports = mongoose.model('Contact', contactSchema);