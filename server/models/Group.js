const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please provide a group name'],
    trim: true,
    maxlength: [100, 'Group name cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true
  },
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact'
  }],
  type: {
    type: String,
    enum: ['manual', 'auto', 'smart'],
    default: 'manual'
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
GroupSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for member count
GroupSchema.virtual('memberCount').get(function() {
  return this.members ? this.members.length : 0;
});

// Configure to include virtuals when converting to JSON
GroupSchema.set('toJSON', { virtuals: true });
GroupSchema.set('toObject', { virtuals: true });

// Prevent duplicate group names for the same user
GroupSchema.index({ user: 1, name: 1 }, { unique: true });

// Static method to update members based on tags
GroupSchema.statics.updateMembersFromTags = async function(groupId) {
  const Group = this;
  const Contact = mongoose.model('Contact');
  
  try {
    const group = await Group.findById(groupId);
    
    if (!group || !group.tags || group.tags.length === 0) {
      return group;
    }
    
    // Find all contacts that have at least one of the group's tags
    const contacts = await Contact.find({
      user: group.user,
      tags: { $in: group.tags }
    });
    
    // Update group members
    group.members = contacts.map(contact => contact._id);
    
    await group.save();
    return group;
  } catch (err) {
    console.error('Error updating group members from tags:', err);
    throw err;
  }
};

module.exports = mongoose.model('Group', GroupSchema);
