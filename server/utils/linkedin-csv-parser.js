/**
 * LinkedIn CSV Parser
 * This utility parses LinkedIn connections export CSV files.
 * 
 * LinkedIn allows users to export their connections from:
 * Settings & Privacy > Data privacy > Get a copy of your data > Connections
 */

const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

/**
 * Parse a LinkedIn connections export CSV file
 * @param {string} filePath - Path to the CSV file
 * @return {Promise<Array>} - Parsed connections data
 */
function parseLinkedInCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        // Create a base contact object
        const contact = {
          id: `linkedin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          source: 'linkedin_import',
          tags: []
        };
        
        // Map column values from LinkedIn export to contact fields
        // Using the actual fields LinkedIn exports
        const fieldMapping = {
          'First Name': 'firstName',
          'Last Name': 'lastName',
          'Email Address': 'email',
          'Company': 'company',
          'Position': 'title',
          'Connected On': 'connectedOn',
          'Tags': 'linkedinTags', // LinkedIn allows custom tags
          'Profile URL': 'profileUrl',
          'Location': 'location',
          'Industry': 'industry', 
          'Phone Number': 'phone',
          'Twitter Handle': 'twitter',
          'Birthday': 'birthday',
          'Websites': 'websites'
        };
        
        // Apply mapping and populate contact fields
        Object.keys(data).forEach(column => {
          if (fieldMapping[column] && data[column]) {
            contact[fieldMapping[column]] = data[column].trim();
          }
        });
        
        // Create full name from first and last name
        contact.name = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
        
        // Extract and create tags from each relevant field
        const potentialTags = [];
        
        // Location tag (directly from LinkedIn data)
        if (contact.location) {
          potentialTags.push({
            type: 'location',
            name: contact.location
          });
        }
        
        // Company tag (directly from LinkedIn data)
        if (contact.company) {
          potentialTags.push({
            type: 'company',
            name: contact.company
          });
        }
        
        // Position/Title tag (directly from LinkedIn data)
        if (contact.title) {
          potentialTags.push({
            type: 'position',
            name: contact.title
          });
        }

        // Industry tag (directly from LinkedIn data)
        if (contact.industry) {
          potentialTags.push({
            type: 'industry',
            name: contact.industry
          });
        }
        
        // LinkedIn's own tags (if present in export)
        if (contact.linkedinTags) {
          const tags = contact.linkedinTags.split(',').map(tag => tag.trim());
          tags.forEach(tag => {
            if (tag) {
              potentialTags.push({
                type: 'linkedin_tag',
                name: tag
              });
            }
          });
        }
        
        // Connected On - can be used for recency tag
        if (contact.connectedOn) {
          // Only add the year to avoid too many specific tags
          const connectionYear = new Date(contact.connectedOn).getFullYear();
          if (!isNaN(connectionYear)) {
            potentialTags.push({
              type: 'connection_year',
              name: `Connected ${connectionYear}`
            });
          }
        }
        
        // Add profile picture URL or placeholder
        contact.picture = 'https://cdn.jsdelivr.net/npm/simple-icons@v6/icons/linkedin.svg';
        
        // Add tags to contact
        contact.tags = potentialTags;
        
        results.push(contact);
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * Save the parsed contacts to a user's account
 * @param {Array} contacts - Parsed contacts
 * @param {string} userId - User ID
 * @return {Promise<Array>} - Saved contacts data
 */
async function saveImportedContacts(contacts, userId) {
  // This function would typically save to a database
  // For now, we'll return the contacts as-is
  return contacts;
}

module.exports = {
  parseLinkedInCSV,
  saveImportedContacts
};