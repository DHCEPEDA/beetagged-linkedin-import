const Group = require('../models/Group');
const Contact = require('../models/Contact');
const Tag = require('../models/Tag');

/**
 * Get all groups for current user
 * @route GET /api/groups
 * @access Private
 */
exports.getGroups = async (req, res, next) => {
  try {
    const groups = await Group.find({ user: req.user.id })
      .populate('tags')
      .sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      count: groups.length,
      data: groups
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get group by ID
 * @route GET /api/groups/:id
 * @access Private
 */
exports.getGroupById = async (req, res, next) => {
  try {
    const group = await Group.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('tags');
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: group
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new group
 * @route POST /api/groups
 * @access Private
 */
exports.createGroup = async (req, res, next) => {
  try {
    req.body.user = req.user.id;
    
    // Check if group with same name already exists
    const existingGroup = await Group.findOne({
      user: req.user.id,
      name: req.body.name
    });
    
    if (existingGroup) {
      return res.status(400).json({
        success: false,
        message: 'Group with this name already exists'
      });
    }
    
    // Determine group type
    if (req.body.tagIds && req.body.tagIds.length > 0) {
      req.body.tags = req.body.tagIds;
      req.body.type = 'auto';
      delete req.body.tagIds;
    }
    
    // Create group
    const group = await Group.create(req.body);
    
    // If it's an auto group, find contacts with matching tags
    if (group.type === 'auto' && group.tags && group.tags.length > 0) {
      await Group.updateMembersFromTags(group._id);
    }
    
    // Return group with populated tags
    const populatedGroup = await Group.findById(group._id).populate('tags');
    
    res.status(201).json({
      success: true,
      data: populatedGroup
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a group
 * @route PUT /api/groups/:id
 * @access Private
 */
exports.updateGroup = async (req, res, next) => {
  try {
    // Check if group exists and belongs to user
    let group = await Group.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }
    
    // Check if updated name conflicts with existing group
    if (req.body.name && req.body.name !== group.name) {
      const existingGroup = await Group.findOne({
        user: req.user.id,
        name: req.body.name
      });
      
      if (existingGroup) {
        return res.status(400).json({
          success: false,
          message: 'Group with this name already exists'
        });
      }
    }
    
    // Remove user field to prevent ownership change
    if (req.body.user) {
      delete req.body.user;
    }
    
    // Handle tag IDs
    if (req.body.tagIds) {
      req.body.tags = req.body.tagIds;
      
      // If tags are provided, set type to auto
      if (req.body.tags.length > 0) {
        req.body.type = 'auto';
      }
      
      delete req.body.tagIds;
    }
    
    // Update group
    group = await Group.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    // If it's an auto group, update members based on tags
    if (group.type === 'auto' && group.tags && group.tags.length > 0) {
      await Group.updateMembersFromTags(group._id);
    }
    
    // Return updated group with populated tags
    const updatedGroup = await Group.findById(group._id).populate('tags');
    
    res.status(200).json({
      success: true,
      data: updatedGroup
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a group
 * @route DELETE /api/groups/:id
 * @access Private
 */
exports.deleteGroup = async (req, res, next) => {
  try {
    // Check if group exists and belongs to user
    const group = await Group.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }
    
    // Remove group from all contacts
    await Contact.updateMany(
      { user: req.user.id, groups: req.params.id },
      { $pull: { groups: req.params.id } }
    );
    
    // Delete the group
    await group.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get members of a group
 * @route GET /api/groups/:id/members
 * @access Private
 */
exports.getGroupMembers = async (req, res, next) => {
  try {
    // Check if group exists and belongs to user
    const group = await Group.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }
    
    // Get contacts that are members of this group
    const members = await Contact.find({
      _id: { $in: group.members },
      user: req.user.id
    }).populate('tags');
    
    res.status(200).json({
      success: true,
      count: members.length,
      data: members
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a contact to a group
 * @route POST /api/groups/:groupId/members/:contactId
 * @access Private
 */
exports.addContactToGroup = async (req, res, next) => {
  try {
    const { groupId, contactId } = req.params;
    
    // Check if group exists and belongs to user
    const group = await Group.findOne({
      _id: groupId,
      user: req.user.id
    });
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }
    
    // Check if contact exists and belongs to user
    const contact = await Contact.findOne({
      _id: contactId,
      user: req.user.id
    });
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    // Don't allow manual adding to auto groups
    if (group.type !== 'manual') {
      return res.status(400).json({
        success: false,
        message: 'Cannot manually add contacts to auto or smart groups'
      });
    }
    
    // Add contact to group if not already a member
    if (!group.members.includes(contactId)) {
      group.members.push(contactId);
      await group.save();
    }
    
    // Add group to contact's groups if not already there
    if (!contact.groups.includes(groupId)) {
      contact.groups.push(groupId);
      await contact.save();
    }
    
    res.status(200).json({
      success: true,
      data: group
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a contact from a group
 * @route DELETE /api/groups/:groupId/members/:contactId
 * @access Private
 */
exports.removeContactFromGroup = async (req, res, next) => {
  try {
    const { groupId, contactId } = req.params;
    
    // Check if group exists and belongs to user
    const group = await Group.findOne({
      _id: groupId,
      user: req.user.id
    });
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }
    
    // Check if contact exists and belongs to user
    const contact = await Contact.findOne({
      _id: contactId,
      user: req.user.id
    });
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    // Don't allow manual removal from auto groups
    if (group.type !== 'manual') {
      return res.status(400).json({
        success: false,
        message: 'Cannot manually remove contacts from auto or smart groups'
      });
    }
    
    // Remove contact from group
    group.members = group.members.filter(member => member.toString() !== contactId);
    await group.save();
    
    // Remove group from contact's groups
    contact.groups = contact.groups.filter(group => group.toString() !== groupId);
    await contact.save();
    
    res.status(200).json({
      success: true,
      data: group
    });
  } catch (error) {
    next(error);
  }
};
