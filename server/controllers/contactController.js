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
    // Check for query parameters
    const { tags, query, source } = req.query;
    
    // Build filter based on query parameters
    const filter = { user: req.user.id };
    
    // Filter by source if provided
    if (source) {
      filter.source = source;
    }
    
    // Filter by tags if provided
    if (tags) {
      const tagIds = tags.split(',');
      filter.tags = { $in: tagIds };
    }
    
    // Text search if query parameter is provided
    if (query) {
      // Create a $or filter for multiple fields
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { company: { $regex: query, $options: 'i' } },
        { title: { $regex: query, $options: 'i' } },
        { notes: { $regex: query, $options: 'i' } }
      ];
    }
    
    const contacts = await Contact.find(filter)
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
      failed: 0,
      tagsCreated: 0
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
        
        // Extract all metadata for tagging
        const metadataForTags = {};
        
        if (provider === 'linkedin') {
          contactData.linkedinId = socialContact.id;
          contactData.linkedinConnected = true;
          contactData.linkedinProfileUrl = socialContact.profileUrl;
          contactData.company = socialContact.company;
          contactData.title = socialContact.title;
          contactData.profilePicture = socialContact.pictureUrl;
          
          // Collect LinkedIn metadata for tags
          if (socialContact.company) metadataForTags.company = socialContact.company;
          if (socialContact.title) metadataForTags.title = socialContact.title;
          if (socialContact.industry) metadataForTags.industry = socialContact.industry;
          if (socialContact.location) metadataForTags.location = socialContact.location;
          if (socialContact.education) {
            socialContact.education.forEach((edu, index) => {
              if (edu.school) metadataForTags[`education_${index}`] = edu.school;
              if (edu.degree) metadataForTags[`degree_${index}`] = edu.degree;
              if (edu.fieldOfStudy) metadataForTags[`field_${index}`] = edu.fieldOfStudy;
            });
          }
          if (socialContact.skills) {
            socialContact.skills.forEach((skill, index) => {
              metadataForTags[`skill_${index}`] = skill;
            });
          }
        } else if (provider === 'facebook') {
          contactData.facebookId = socialContact.id;
          contactData.facebookConnected = true;
          contactData.facebookProfileUrl = socialContact.profileUrl;
          contactData.profilePicture = socialContact.picture;
          
          // Collect Facebook metadata for tags
          if (socialContact.work) {
            socialContact.work.forEach((work, index) => {
              if (work.employer) metadataForTags[`employer_${index}`] = work.employer.name;
              if (work.position) metadataForTags[`position_${index}`] = work.position.name;
              if (work.location) metadataForTags[`workplace_${index}`] = work.location.name;
            });
          }
          if (socialContact.education) {
            socialContact.education.forEach((edu, index) => {
              if (edu.school) metadataForTags[`school_${index}`] = edu.school.name;
              if (edu.type) metadataForTags[`education_type_${index}`] = edu.type;
            });
          }
          if (socialContact.location) metadataForTags.location = socialContact.location.name;
          if (socialContact.hometown) metadataForTags.hometown = socialContact.hometown.name;
        }
        
        // Check if contact already exists
        let existingContact = await Contact.findOne({
          user: req.user.id,
          $or: [
            { [`${provider}Id`]: socialContact.id },
            { email: socialContact.email }
          ]
        });
        
        let contactId;
        
        if (existingContact) {
          // Update existing contact
          const updatedContact = await Contact.findByIdAndUpdate(
            existingContact._id,
            {
              ...contactData,
              user: req.user.id
            },
            { new: true }
          );
          contactId = updatedContact._id;
          results.updated++;
        } else {
          // Create new contact
          const newContact = await Contact.create({
            ...contactData,
            user: req.user.id
          });
          contactId = newContact._id;
          results.added++;
        }
        
        // Create tags from metadata and link to contact
        for (const [key, value] of Object.entries(metadataForTags)) {
          if (value && typeof value === 'string' && value.trim()) {
            // Prepare tag name with prefix to categorize metadata type
            let tagPrefix = '';
            
            if (key.startsWith('skill_')) {
              tagPrefix = 'Skill: ';
            } else if (key.startsWith('education_') || key.startsWith('school_')) {
              tagPrefix = 'Education: ';
            } else if (key.startsWith('employer_') || key === 'company') {
              tagPrefix = 'Company: ';
            } else if (key.startsWith('position_') || key === 'title') {
              tagPrefix = 'Title: ';
            } else if (key === 'location' || key === 'hometown') {
              tagPrefix = 'Location: ';
            } else if (key === 'industry') {
              tagPrefix = 'Industry: ';
            } else {
              tagPrefix = key.charAt(0).toUpperCase() + key.slice(1) + ': ';
            }
            
            const tagName = `${tagPrefix}${value.trim()}`;
            
            // Check if tag exists or create it
            let tag = await Tag.findOne({
              user: req.user.id,
              name: tagName
            });
            
            if (!tag) {
              // Create new tag - assign a color based on category
              let tagColor = '#2196f3'; // Default blue
              
              if (tagName.startsWith('Company:')) {
                tagColor = '#4CAF50'; // Green for companies
              } else if (tagName.startsWith('Title:')) {
                tagColor = '#9C27B0'; // Purple for titles
              } else if (tagName.startsWith('Location:')) {
                tagColor = '#FF9800'; // Orange for locations
              } else if (tagName.startsWith('Skill:')) {
                tagColor = '#03A9F4'; // Light blue for skills
              } else if (tagName.startsWith('Education:')) {
                tagColor = '#F44336'; // Red for education
              } else if (tagName.startsWith('Industry:')) {
                tagColor = '#795548'; // Brown for industry
              }
              
              tag = await Tag.create({
                name: tagName,
                color: tagColor,
                description: `Auto-created from ${provider} metadata`,
                user: req.user.id
              });
              
              results.tagsCreated++;
            }
            
            // Add tag to contact if not already there
            const contact = await Contact.findById(contactId);
            if (!contact.tags.includes(tag._id)) {
              contact.tags.push(tag._id);
              await contact.save();
            }
          }
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

/**
 * Search contacts by tags, metadata, or text
 * @route GET /api/contacts/search
 * @access Private
 */
exports.searchContacts = async (req, res, next) => {
  try {
    const { tags, text, metadata, source } = req.query;
    
    // Build the search filter
    const filter = { user: req.user.id };
    
    // Add tag filtering if provided
    if (tags) {
      const tagNames = tags.split(',').map(tag => tag.trim());
      
      // First, find tags by name
      const tagObjects = await Tag.find({
        user: req.user.id,
        name: { $in: tagNames }
      });
      
      if (tagObjects.length > 0) {
        const tagIds = tagObjects.map(tag => tag._id);
        filter.tags = { $in: tagIds };
      } else {
        // If no tags found, return empty result early
        return res.status(200).json({
          success: true,
          count: 0,
          data: []
        });
      }
    }
    
    // Add source filtering if provided
    if (source) {
      filter.source = source;
    }
    
    // Add metadata filtering if provided
    if (metadata) {
      const metadataFields = metadata.split(',').map(field => field.trim());
      const metadataConditions = [];
      
      // For each metadata field, add a condition
      for (const field of metadataFields) {
        // Match field:value pattern if present
        const [fieldName, fieldValue] = field.includes(':') 
          ? field.split(':') 
          : [field, null];
        
        if (fieldValue) {
          // If value is specified, search exact match
          switch (fieldName.toLowerCase()) {
            case 'company':
              metadataConditions.push({ company: { $regex: fieldValue, $options: 'i' } });
              break;
            case 'title':
              metadataConditions.push({ title: { $regex: fieldValue, $options: 'i' } });
              break;
            case 'location':
              // Find tags with this location name and get contacts with those tags
              const locationTags = await Tag.find({
                user: req.user.id,
                name: { $regex: `Location: ${fieldValue}`, $options: 'i' }
              });
              if (locationTags.length > 0) {
                const locationTagIds = locationTags.map(tag => tag._id);
                metadataConditions.push({ tags: { $in: locationTagIds } });
              }
              break;
            case 'education':
              // Find tags with education info and get contacts with those tags
              const educationTags = await Tag.find({
                user: req.user.id,
                name: { $regex: `Education: ${fieldValue}`, $options: 'i' }
              });
              if (educationTags.length > 0) {
                const educationTagIds = educationTags.map(tag => tag._id);
                metadataConditions.push({ tags: { $in: educationTagIds } });
              }
              break;
            case 'skill':
              // Find tags with skill info and get contacts with those tags
              const skillTags = await Tag.find({
                user: req.user.id,
                name: { $regex: `Skill: ${fieldValue}`, $options: 'i' }
              });
              if (skillTags.length > 0) {
                const skillTagIds = skillTags.map(tag => tag._id);
                metadataConditions.push({ tags: { $in: skillTagIds } });
              }
              break;
            case 'industry':
              // Find tags with industry info and get contacts with those tags
              const industryTags = await Tag.find({
                user: req.user.id,
                name: { $regex: `Industry: ${fieldValue}`, $options: 'i' }
              });
              if (industryTags.length > 0) {
                const industryTagIds = industryTags.map(tag => tag._id);
                metadataConditions.push({ tags: { $in: industryTagIds } });
              }
              break;
            default:
              // For any other field, search in tags
              const otherTags = await Tag.find({
                user: req.user.id,
                name: { $regex: `${fieldName}: ${fieldValue}`, $options: 'i' }
              });
              if (otherTags.length > 0) {
                const otherTagIds = otherTags.map(tag => tag._id);
                metadataConditions.push({ tags: { $in: otherTagIds } });
              }
          }
        } else {
          // If just a field name is provided, find any tags related to that field
          // For example, "company" would match any company tag
          const relatedTags = await Tag.find({
            user: req.user.id,
            name: { $regex: `${fieldName}:`, $options: 'i' }
          });
          if (relatedTags.length > 0) {
            const relatedTagIds = relatedTags.map(tag => tag._id);
            metadataConditions.push({ tags: { $in: relatedTagIds } });
          }
        }
      }
      
      // Add metadata conditions to filter if any exist
      if (metadataConditions.length > 0) {
        if (metadataConditions.length === 1) {
          // If just one condition, use it directly
          Object.assign(filter, metadataConditions[0]);
        } else {
          // If multiple conditions, use $and to combine them
          filter.$and = metadataConditions;
        }
      }
    }
    
    // Add free text search if provided
    if (text) {
      // First check if this might be part of a tag name (e.g. company or skill)
      const textTags = await Tag.find({
        user: req.user.id,
        name: { $regex: text, $options: 'i' }
      });
      
      const textTagIds = textTags.map(tag => tag._id);
      
      // Now build a full text search filter across multiple fields
      const textFilter = {
        $or: [
          { name: { $regex: text, $options: 'i' } },
          { email: { $regex: text, $options: 'i' } },
          { company: { $regex: text, $options: 'i' } },
          { title: { $regex: text, $options: 'i' } },
          { notes: { $regex: text, $options: 'i' } }
        ]
      };
      
      // Add tag search if we found matching tags
      if (textTagIds.length > 0) {
        textFilter.$or.push({ tags: { $in: textTagIds } });
      }
      
      // Add the text filter to the main filter
      if (Object.keys(filter).length > 1) {
        // If we already have other filters, use $and to combine them
        filter.$and = filter.$and || [];
        filter.$and.push(textFilter);
      } else {
        // Otherwise, just add the $or conditions directly
        filter.$or = textFilter.$or;
      }
    }
    
    // Execute the search
    const contacts = await Contact.find(filter)
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
