/**
 * Contact Model
 * 
 * Stores contact information from various sources (Facebook, LinkedIn, etc.)
 * with associated metadata and tags.
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ContactSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  photoUrl: {
    type: String
  },
  // Source information
  sources: [{
    type: {
      type: String,
      enum: ['facebook', 'linkedin', 'phone', 'manual'],
      required: true
    },
    sourceId: {
      type: String, // Facebook ID, LinkedIn ID, etc.
    },
    profileUrl: {
      type: String
    },
    accessToken: {
      type: String
    },
    // Timestamp of last sync with this source
    lastSynced: {
      type: Date
    },
    // Raw data from this source (for caching and metadata extraction)
    rawData: {
      type: Object
    }
  }],
  // Metadata extracted from sources
  metadata: {
    location: {
      type: String
    },
    hometown: {
      type: String
    },
    work: [{
      company: String,
      position: String,
      dateRange: String
    }],
    education: [{
      school: String,
      degree: String,
      fieldOfStudy: String,
      dateRange: String
    }],
    languages: [String],
    gender: String,
    birthday: Date,
    interests: [String],
    skills: [String],
    customFields: Schema.Types.Mixed
  },
  // Tags extracted from metadata or manually assigned
  tags: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['location', 'work', 'education', 'interest', 'skill', 'custom'],
      required: true
    },
    // Source that this tag came from (auto-generated from Facebook, etc. or manual)
    source: {
      type: String,
      enum: ['facebook', 'linkedin', 'manual'],
      required: true
    },
    // When the tag was added
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  notes: {
    type: String
  },
  groups: [{
    type: Schema.Types.ObjectId,
    ref: 'Group'
  }],
  isFavorite: {
    type: Boolean,
    default: false
  },
  lastContactedDate: {
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

// Pre-save middleware to update the updatedAt field
ContactSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Search contacts by tags (single or multiple)
ContactSchema.statics.findByTags = function(userId, tags) {
  return this.find({
    user: userId,
    'tags.name': { $all: Array.isArray(tags) ? tags : [tags] }
  });
};

// Search contacts by metadata query
ContactSchema.statics.searchByMetadata = function(userId, query) {
  const searchCriteria = { user: userId };
  
  Object.keys(query).forEach(key => {
    // Handle nested fields
    if (key.includes('.')) {
      const [field, subfield] = key.split('.');
      if (field === 'metadata') {
        searchCriteria[`metadata.${subfield}`] = query[key];
      }
    } else if (key === 'tags') {
      // Handle tag search
      searchCriteria['tags.name'] = { $in: query.tags };
    } else {
      // Handle direct fields
      searchCriteria[key] = query[key];
    }
  });
  
  return this.find(searchCriteria);
};

// Get most common tags for a user
ContactSchema.statics.getCommonTags = function(userId, limit = 10) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    { $unwind: '$tags' },
    { 
      $group: { 
        _id: '$tags.name',
        count: { $sum: 1 },
        type: { $first: '$tags.type' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit },
    { 
      $project: { 
        _id: 0,
        name: '$_id',
        count: 1,
        type: 1
      }
    }
  ]);
};

module.exports = mongoose.model('Contact', ContactSchema);