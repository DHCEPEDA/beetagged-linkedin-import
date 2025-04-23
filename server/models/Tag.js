const mongoose = require('mongoose');

const TagSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please provide a tag name'],
    trim: true,
    maxlength: [50, 'Tag name cannot be more than 50 characters']
  },
  color: {
    type: String,
    default: '#2196f3', // Default color
    match: [
      /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
      'Please provide a valid hex color'
    ]
  },
  description: {
    type: String,
    trim: true
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
TagSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Prevent duplicate tags for the same user
TagSchema.index({ user: 1, name: 1 }, { unique: true });

// Static method to get contact count for a tag
TagSchema.statics.getContactCount = async function(tagId) {
  const Contact = mongoose.model('Contact');
  const count = await Contact.countDocuments({ tags: tagId });
  return count;
};

module.exports = mongoose.model('Tag', TagSchema);
