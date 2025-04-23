const Contact = require('../models/Contact');
const Tag = require('../models/Tag');
const Group = require('../models/Group');
const LinkedinService = require('../services/linkedinService');
const FacebookService = require('../services/facebookService');

/**
 * Get all contacts for current user
 * @route GET /api/contacts
 * @access Private
 */
exports.getContacts = async (req, res, next) => {
  try {
    const contacts = await Contact.find({ user: req.user.id })
      .populate('tags')
      .sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get contact by ID
 * @route GET /api/contacts/:id
 * @access Private
 */
exports.getContactById = async (req, res, next) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('tags');
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: contact
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new contact
 * @route POST /api/contacts
 * @access Private
 */
exports.createContact = async (req, res, next) => {
  try {
    req.body.user = req.user.id;
    
    const contact = await Contact.create(req.body);
    
    // If contact added to a group, update the group's members
    if (req.body.groups && req.body.groups.length > 0) {
      await Group.updateMany(
        { _id: { $in: req.body.groups } },
        { $addToSet: { members: contact._id } }
      );
    }
    
    const populatedContact = await Contact.findById(contact._id).populate('tags');
    
    res.status(201).json({
      success: true,
      data: populatedContact
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a contact
 * @route PUT /api/contacts/:id
 * @access Private
 */
exports.updateContact = async (req, res, next) => {
  try {
    let contact = await Contact.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    // Remove user field to prevent ownership change
    if (req.body.user) {
      delete req.body.user;
    }
    
    // Handle group changes
    if (req.body.groups) {
      const oldGroups = contact.groups || [];
      const newGroups = req.body.groups;
      
      // Groups to add the contact to
      const groupsToAdd = newGroups.filter(g => !oldGroups.includes(g));
      
      // Groups to remove the contact from
      const groupsToRemove = oldGroups.filter(g => !newGroups.includes(g));
      
      if (groupsToAdd.length > 0) {
        await Group.updateMany(
          { _id: { $in: groupsToAdd } },
          { $addToSet: { members: contact._id } }
        );
      }
      
      if (groupsToRemove.length > 0) {
        await Group.updateMany(
          { _id: { $in: groupsToRemove } },
          { $pull: { members: contact._id } }
        );
      }
    }
    
    contact = await Contact.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('tags');
    
    res.status(200).json({
      success: true,
      data: contact
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a contact
 * @route DELETE /api/contacts/:id
 * @access Private
 */
exports.deleteContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    // Remove contact from all groups
    if (contact.groups && contact.groups.length > 0) {
      await Group.updateMany(
        { _id: { $in: contact.groups } },
        { $pull: { members: contact._id } }
      );
    }
    
    await contact.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Import contacts from phone
 * @route POST /api/contacts/import/phone
 * @access Private
 */
exports.importPhoneContacts = async (req, res, next) => {
  try {
    // This is a simulated import since we can't access phone contacts directly
    // In a real app, this would get contacts from a phone upload or sync
    
    // Generate some sample contacts
    const sampleContacts = [
      {
        name: 'John Smith',
        email: 'john.smith@example.com',
        phone: '(555) 123-4567',
        company: 'Acme Inc',
        source: 'phone'
      },
      {
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        phone: '(555) 987-6543',
        title: 'Marketing Director',
        company: 'XYZ Corp',
        source: 'phone'
      },
      {
        name: 'Bob Johnson',
        phone: '(555) 555-5555',
        source: 'phone'
      }
    ];
    
    const results = {
      total: sampleContacts.length,
      added: 0,
      updated: 0,
      failed: 0
    };
    
    // Process each contact
    for (const contactData of sampleContacts) {
      try {
        // Check if contact already exists
        let existingContact = await Contact.findOne({
          user: req.user.id,
          $or: [
            { email: contactData.email },
            { phone: contactData.phone }
          ]
        });
        
        if (existingContact) {
          // Update existing contact
          await Contact.findByIdAndUpdate(
            existingContact._id,
            {
              ...contactData,
              user: req.user.id,
              source: 'phone',
              lastSynced: Date.now()
            }
          );
          results.updated++;
        } else {
          // Create new contact
          await Contact.create({
            ...contactData,
            user: req.user.id,
            lastSynced: Date.now()
          });
          results.added++;
        }
      } catch (err) {
        console.error(`Import error for contact: ${contactData.name}`, err);
        results.failed++;
      }
    }
    
    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Import contacts from social network
 * @route POST /api/contacts/import/:provider
 * @access Private
 */
exports.importSocialContacts = async (req, res, next) => {
  try {
    const { provider } = req.params;
    
    if (!['linkedin', 'facebook'].includes(provider)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid provider'
      });
    }
    
    let socialContacts = [];
    let results = {
      total: 0,
      added: 0,
      updated: 0,
      failed: 0
    };
    
    // Get social network contacts
    if (provider === 'linkedin') {
      if (!req.user.linkedinToken) {
        return res.status(400).json({
          success: false,
          message: 'LinkedIn not connected'
        });
      }
      
      socialContacts = await LinkedinService.getConnections(req.user.linkedinToken);
    } else if (provider === 'facebook') {
      if (!req.user.facebookToken) {
        return res.status(400).json({
          success: false,
          message: 'Facebook not connected'
        });
      }
      
      socialContacts = await FacebookService.getFriends(req.user.facebookToken);
    }
    
    results.total = socialContacts.length;
    
    // Create or update contacts
    for (const socialContact of socialContacts) {
      try {
        // Normalize data structure
        const contactData = {
          name: socialContact.name || `${socialContact.firstName} ${socialContact.lastName}`,
          email: socialContact.email,
          source: provider,
          lastSynced: Date.now()
        };
        
        if (provider === 'linkedin') {
          contactData.linkedinId = socialContact.id;
          contactData.linkedinConnected = true;
          contactData.linkedinProfileUrl = socialContact.profileUrl;
          contactData.company = socialContact.company;
          contactData.title = socialContact.title;
          contactData.profilePicture = socialContact.pictureUrl;
        } else if (provider === 'facebook') {
          contactData.facebookId = socialContact.id;
          contactData.facebookConnected = true;
          contactData.facebookProfileUrl = socialContact.profileUrl;
          contactData.profilePicture = socialContact.picture;
        }
        
        // Check if contact already exists
        let existingContact = await Contact.findOne({
          user: req.user.id,
          $or: [
            { [`${provider}Id`]: socialContact.id },
            { email: socialContact.email }
          ]
        });
        
        if (existingContact) {
          // Update existing contact
          await Contact.findByIdAndUpdate(
            existingContact._id,
            {
              ...contactData,
              user: req.user.id
            }
          );
          results.updated++;
        } else {
          // Create new contact
          await Contact.create({
            ...contactData,
            user: req.user.id
          });
          results.added++;
        }
      } catch (err) {
        console.error(`Import error for contact: ${socialContact.name || socialContact.id}`, err);
        results.failed++;
      }
    }
    
    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a tag to a contact
 * @route POST /api/contacts/:contactId/tags/:tagId
 * @access Private
 */
exports.addTagToContact = async (req, res, next) => {
  try {
    const { contactId, tagId } = req.params;
    
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
    
    // Add tag to contact if not already added
    if (!contact.tags.includes(tagId)) {
      contact.tags.push(tagId);
      await contact.save();
    }
    
    // Find groups that use this tag and add the contact to them
    const groups = await Group.find({
      user: req.user.id,
      tags: tagId,
      type: { $ne: 'manual' } // Only auto or smart groups
    });
    
    for (const group of groups) {
      if (!group.members.includes(contactId)) {
        group.members.push(contactId);
        await group.save();
      }
    }
    
    // Return updated contact with populated tags
    const updatedContact = await Contact.findById(contactId).populate('tags');
    
    res.status(200).json({
      success: true,
      data: updatedContact
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a tag from a contact
 * @route DELETE /api/contacts/:contactId/tags/:tagId
 * @access Private
 */
exports.removeTagFromContact = async (req, res, next) => {
  try {
    const { contactId, tagId } = req.params;
    
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
    
    // Remove tag from contact
    contact.tags = contact.tags.filter(tag => tag.toString() !== tagId);
    await contact.save();
    
    // Find groups that use only this tag and remove the contact from them
    const groups = await Group.find({
      user: req.user.id,
      tags: tagId,
      type: { $ne: 'manual' } // Only auto or smart groups
    });
    
    for (const group of groups) {
      // Check if the group uses only this tag
      if (group.tags.length === 1 && group.tags[0].toString() === tagId) {
        group.members = group.members.filter(member => member.toString() !== contactId);
        await group.save();
      } else {
        // If the group uses multiple tags, check if contact still has any other tags used by the group
        const otherGroupTags = group.tags.filter(tag => tag.toString() !== tagId);
        const contactHasOtherTags = contact.tags.some(tag => 
          otherGroupTags.includes(tag.toString())
        );
        
        if (!contactHasOtherTags) {
          group.members = group.members.filter(member => member.toString() !== contactId);
          await group.save();
        }
      }
    }
    
    // Return updated contact with populated tags
    const updatedContact = await Contact.findById(contactId).populate('tags');
    
    res.status(200).json({
      success: true,
      data: updatedContact
    });
  } catch (error) {
    next(error);
  }
};
