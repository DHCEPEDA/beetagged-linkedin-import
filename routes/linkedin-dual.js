const express = require('express');
const router = express.Router();
const multer = require('multer');
const { parseLinkedInCSV } = require('../services/linkedinService');
const { generateTags } = require('../utils/dataProcessor');
const Contact = require('../models/Contact');

// File upload setup for multiple files
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Dual LinkedIn CSV Import with Duplicate Detection
router.post('/import/linkedin-dual', upload.fields([
  { name: 'contactsFile', maxCount: 1 },
  { name: 'connectionsFile', maxCount: 1 }
]), async (req, res) => {
  try {
    const contactsFile = req.files?.contactsFile?.[0];
    const connectionsFile = req.files?.connectionsFile?.[0];
    
    if (!contactsFile && !connectionsFile) {
      return res.status(400).json({ 
        success: false, 
        message: 'No files uploaded' 
      });
    }

    console.log('Processing LinkedIn CSV files...');
    let allContacts = [];
    let stats = { processed: 0, skipped: 0 };

    // Process contacts file
    if (contactsFile) {
      console.log('Processing contacts file...');
      const contactsData = contactsFile.buffer.toString('utf8');
      const contactsResult = await parseLinkedInCSV(contactsData, 'contacts');
      allContacts.push(...contactsResult.contacts);
      stats.processed += contactsResult.stats.processed;
      stats.skipped += contactsResult.stats.skipped;
    }

    // Process connections file
    if (connectionsFile) {
      console.log('Processing connections file...');
      const connectionsData = connectionsFile.buffer.toString('utf8');
      const connectionsResult = await parseLinkedInCSV(connectionsData, 'connections');
      allContacts.push(...connectionsResult.contacts);
      stats.processed += connectionsResult.stats.processed;
      stats.skipped += connectionsResult.stats.skipped;
    }

    if (allContacts.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No valid contacts found in uploaded files' 
      });
    }

    // Detect duplicates using multiple criteria
    const duplicates = detectDuplicates(allContacts);
    
    if (duplicates.length > 0) {
      console.log(`Found ${duplicates.length} potential duplicate groups`);
      
      // Return duplicates for user review
      return res.json({
        success: true,
        duplicatesFound: true,
        duplicates: duplicates,
        totalContacts: allContacts.length,
        message: `Found ${duplicates.length} potential duplicate groups requiring review`
      });
    }

    // No duplicates found, proceed with import
    const processedContacts = allContacts.map(contact => ({
      ...contact,
      tags: generateTags(contact),
      source: contact.source || 'linkedin_import',
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    try {
      await Contact.insertMany(processedContacts, { ordered: false });
      
      console.log(`Successfully imported ${processedContacts.length} contacts`);
      res.json({
        success: true,
        imported: processedContacts.length,
        processed: stats.processed,
        skipped: stats.skipped,
        duplicatesFound: false,
        message: `Successfully imported ${processedContacts.length} LinkedIn contacts with no duplicates`
      });
    } catch (error) {
      // Handle any database insertion errors
      const insertedCount = processedContacts.length - (error.writeErrors?.length || 0);
      res.json({
        success: true,
        imported: insertedCount,
        processed: stats.processed,
        skipped: stats.skipped + (error.writeErrors?.length || 0),
        duplicatesFound: false,
        message: `Processed ${insertedCount} contacts (some database duplicates skipped)`
      });
    }

  } catch (error) {
    console.error('LinkedIn dual import error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Resolve duplicates based on user choice
router.post('/import/resolve-duplicates', async (req, res) => {
  try {
    const { duplicates, action } = req.body;
    
    if (!duplicates || !action) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing duplicates or action parameter' 
      });
    }

    let result = { success: true };

    switch (action) {
      case 'consolidate':
        result = await consolidateDuplicates(duplicates);
        break;
      case 'separate':
        result = await importSeparately(duplicates);
        break;
      case 'review':
        result = await handleIndividualReview(duplicates);
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid action specified' 
        });
    }

    res.json(result);

  } catch (error) {
    console.error('Duplicate resolution error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

/**
 * Detect duplicates using multiple matching criteria
 */
function detectDuplicates(contacts) {
  const duplicateGroups = [];
  const processed = new Set();

  for (let i = 0; i < contacts.length; i++) {
    if (processed.has(i)) continue;

    const currentContact = contacts[i];
    const duplicateGroup = [currentContact];

    for (let j = i + 1; j < contacts.length; j++) {
      if (processed.has(j)) continue;

      const otherContact = contacts[j];
      
      if (isDuplicate(currentContact, otherContact)) {
        duplicateGroup.push(otherContact);
        processed.add(j);
      }
    }

    if (duplicateGroup.length > 1) {
      duplicateGroups.push(duplicateGroup);
      processed.add(i);
    }
  }

  return duplicateGroups;
}

/**
 * Check if two contacts are duplicates using multiple criteria
 */
function isDuplicate(contact1, contact2) {
  // Exact name match
  if (contact1.name && contact2.name && 
      contact1.name.toLowerCase().trim() === contact2.name.toLowerCase().trim()) {
    return true;
  }

  // Email match
  if (contact1.email && contact2.email && 
      contact1.email.toLowerCase().trim() === contact2.email.toLowerCase().trim()) {
    return true;
  }

  // Name similarity with company match
  if (contact1.name && contact2.name && contact1.company && contact2.company) {
    const name1 = contact1.name.toLowerCase().trim();
    const name2 = contact2.name.toLowerCase().trim();
    const company1 = contact1.company.toLowerCase().trim();
    const company2 = contact2.company.toLowerCase().trim();
    
    // Check if names are very similar (accounting for middle names, nicknames)
    const nameSimilarity = calculateNameSimilarity(name1, name2);
    if (nameSimilarity > 0.8 && company1 === company2) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate name similarity score
 */
function calculateNameSimilarity(name1, name2) {
  const words1 = name1.split(' ').filter(w => w.length > 1);
  const words2 = name2.split(' ').filter(w => w.length > 1);
  
  let matches = 0;
  const maxWords = Math.max(words1.length, words2.length);
  
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2 || 
          (word1.length > 2 && word2.length > 2 && 
           (word1.includes(word2) || word2.includes(word1)))) {
        matches++;
        break;
      }
    }
  }
  
  return matches / maxWords;
}

/**
 * Consolidate duplicate contacts by merging information
 */
async function consolidateDuplicates(duplicateGroups) {
  let consolidatedCount = 0;
  
  for (const group of duplicateGroups) {
    // Merge information from all contacts in the group
    const mergedContact = mergeContactInfo(group);
    
    // Add to database
    const processedContact = {
      ...mergedContact,
      tags: generateTags(mergedContact),
      source: 'linkedin_import_consolidated',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    try {
      await new Contact(processedContact).save();
      consolidatedCount++;
    } catch (error) {
      console.error('Error saving consolidated contact:', error);
    }
  }
  
  return {
    success: true,
    consolidated: consolidatedCount,
    message: `Successfully consolidated ${consolidatedCount} duplicate groups`
  };
}

/**
 * Import all contacts separately without merging
 */
async function importSeparately(duplicateGroups) {
  let importedCount = 0;
  
  for (const group of duplicateGroups) {
    for (const contact of group) {
      const processedContact = {
        ...contact,
        tags: generateTags(contact),
        source: contact.source || 'linkedin_import',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      try {
        await new Contact(processedContact).save();
        importedCount++;
      } catch (error) {
        console.error('Error saving separate contact:', error);
      }
    }
  }
  
  return {
    success: true,
    imported: importedCount,
    message: `Successfully imported ${importedCount} contacts as separate entries`
  };
}

/**
 * Handle individual review (for future implementation)
 */
async function handleIndividualReview(duplicateGroups) {
  // For now, import separately - individual review UI would be implemented later
  return await importSeparately(duplicateGroups);
}

/**
 * Merge contact information from multiple sources
 */
function mergeContactInfo(contacts) {
  const merged = {
    name: '',
    email: '',
    company: '',
    position: '',
    location: '',
    phone: '',
    connectedOn: '',
    url: '',
    source: 'linkedin_import_merged'
  };
  
  // Prioritize non-empty values, with preference for more detailed information
  for (const contact of contacts) {
    if (!merged.name && contact.name) merged.name = contact.name;
    if (!merged.email && contact.email) merged.email = contact.email;
    if (!merged.company && contact.company) merged.company = contact.company;
    if (!merged.position && contact.position) merged.position = contact.position;
    if (!merged.location && contact.location) merged.location = contact.location;
    if (!merged.phone && contact.phone) merged.phone = contact.phone;
    if (!merged.connectedOn && contact.connectedOn) merged.connectedOn = contact.connectedOn;
    if (!merged.url && contact.url) merged.url = contact.url;
    
    // For fields that might have more detailed info, prefer longer strings
    if (contact.company && contact.company.length > merged.company.length) {
      merged.company = contact.company;
    }
    if (contact.position && contact.position.length > merged.position.length) {
      merged.position = contact.position;
    }
    if (contact.location && contact.location.length > merged.location.length) {
      merged.location = contact.location;
    }
  }
  
  return merged;
}

module.exports = router;