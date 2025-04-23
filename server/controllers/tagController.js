const Tag = require('../models/Tag');
const Contact = require('../models/Contact');
const Group = require('../models/Group');

/**
 * Get all tags for current user
 * @route GET /api/tags
 * @access Private
 */
exports.getTags = async (req, res, next) => {
  try {
    const tags = await Tag.find({ user: req.user.id }).sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      count: tags.length,
      data: tags
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get tag by ID
 * @route GET /api/tags/:id
 * @access Private
 */
exports.getTagById = async (req, res, next) => {
  try {
    const tag = await Tag.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: tag
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new tag
 * @route POST /api/tags
 * @access Private
 */
exports.createTag = async (req, res, next) => {
  try {
    req.body.user = req.user.id;
    
    // Check if tag with same name already exists
    const existingTag = await Tag.findOne({
      user: req.user.id,
      name: req.body.name
    });
    
    if (existingTag) {
      return res.status(400).json({
        success: false,
        message: 'Tag with this name already exists'
      });
    }
    
    const tag = await Tag.create(req.body);
    
    res.status(201).json({
      success: true,
      data: tag
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a tag
 * @route PUT /api/tags/:id
 * @access Private
 */
exports.updateTag = async (req, res, next) => {
  try {
    // Check if tag exists and belongs to user
    let tag = await Tag.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }
    
    // Check if updated name conflicts with existing tag
    if (req.body.name && req.body.name !== tag.name) {
      const existingTag = await Tag.findOne({
        user: req.user.id,
        name: req.body.name
      });
      
      if (existingTag) {
        return res.status(400).json({
          success: false,
          message: 'Tag with this name already exists'
        });
      }
    }
    
    // Remove user field to prevent ownership change
    if (req.body.user) {
      delete req.body.user;
    }
    
    // Update tag
    tag = await Tag.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: tag
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a tag
 * @route DELETE /api/tags/:id
 * @access Private
 */
exports.deleteTag = async (req, res, next) => {
  try {
    // Check if tag exists and belongs to user
    const tag = await Tag.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }
    
    // Remove tag from all contacts
    await Contact.updateMany(
      { user: req.user.id, tags: req.params.id },
      { $pull: { tags: req.params.id } }
    );
    
    // Remove tag from all groups
    await Group.updateMany(
      { user: req.user.id, tags: req.params.id },
      { $pull: { tags: req.params.id } }
    );
    
    // For groups that use this tag, update members
    const groups = await Group.find({
      user: req.user.id,
      tags: { $exists: true, $ne: [] }
    });
    
    for (const group of groups) {
      await Group.updateMembersFromTags(group._id);
    }
    
    // Delete the tag
    await tag.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get contacts with specific tag
 * @route GET /api/tags/:tagId/contacts
 * @access Private
 */
exports.getContactsByTag = async (req, res, next) => {
  try {
    const { tagId } = req.params;
    
    // Check if tag exists and belongs to user
    const tag = await Tag.findOne({
      _id: tagId,
      user: req.user.id
    });
    
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }
    
    // Find contacts with this tag
    const contacts = await Contact.find({
      user: req.user.id,
      tags: tagId
    }).populate('tags');
    
    res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts
    });
  } catch (error) {
    next(error);
  }
};
