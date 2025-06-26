/**
 * BEETAGGED CSV IMPORT FIX
 * 
 * This file contains the corrected CSV parsing logic for LinkedIn imports.
 * The main issue was that the field name mapping wasn't handling different
 * CSV formats properly. This version is more flexible and includes debugging.
 * 
 * REPLACE THE EXISTING parseLinkedInCSV function in index.js with this code.
 */

const fs = require('fs');
const csv = require('csv-parser');

/**
 * Enhanced LinkedIn CSV Parser with flexible field mapping
 * Handles multiple CSV formats and provides detailed logging
 */
function parseLinkedInCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    let headersSeen = false;
    let totalRows = 0;
    let validRows = 0;
    
    console.log('=== STARTING CSV PARSING ===');
    console.log('File path:', filePath);
    
    fs.createReadStream(filePath)
      .pipe(csv({
        // More flexible CSV parsing options
        skipEmptyLines: true,
        strict: false,
        headers: true
      }))
      .on('headers', (headers) => {
        console.log('CSV Headers detected:', headers);
        headersSeen = true;
      })
      .on('data', (data) => {
        totalRows++;
        console.log(`\n--- Processing Row ${totalRows} ---`);
        console.log('Raw data:', data);
        
        // Initialize contact object
        const contact = {
          id: `linkedin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          source: 'linkedin_import',
          tags: []
        };
        
        // Enhanced field mapping - handles multiple possible column names
        const fieldMappings = [
          // Standard LinkedIn export format
          { csvField: 'First Name', contactField: 'firstName' },
          { csvField: 'Last Name', contactField: 'lastName' },
          { csvField: 'Email Address', contactField: 'email' },
          { csvField: 'Company', contactField: 'company' },
          { csvField: 'Position', contactField: 'title' },
          { csvField: 'Connected On', contactField: 'connectedOn' },
          { csvField: 'Location', contactField: 'location' },
          { csvField: 'Industry', contactField: 'industry' },
          { csvField: 'Phone Number', contactField: 'phone' },
          
          // Alternative formats (case variations)
          { csvField: 'first name', contactField: 'firstName' },
          { csvField: 'last name', contactField: 'lastName' },
          { csvField: 'email address', contactField: 'email' },
          { csvField: 'email', contactField: 'email' },
          { csvField: 'company', contactField: 'company' },
          { csvField: 'position', contactField: 'title' },
          { csvField: 'title', contactField: 'title' },
          { csvField: 'job title', contactField: 'title' },
          { csvField: 'location', contactField: 'location' },
          { csvField: 'industry', contactField: 'industry' },
          
          // Additional possible variations
          { csvField: 'Name', contactField: 'fullName' },
          { csvField: 'Full Name', contactField: 'fullName' },
          { csvField: 'Organization', contactField: 'company' },
          { csvField: 'Employer', contactField: 'company' }
        ];
        
        // Extract data using flexible field mapping
        fieldMappings.forEach(mapping => {
          if (data[mapping.csvField] && data[mapping.csvField].trim()) {
            contact[mapping.contactField] = data[mapping.csvField].trim();
            console.log(`Mapped ${mapping.csvField} -> ${mapping.contactField}: ${data[mapping.csvField]}`);
          }
        });
        
        // Handle full name splitting if we got a single name field
        if (contact.fullName && !contact.firstName && !contact.lastName) {
          const nameParts = contact.fullName.split(' ');
          contact.firstName = nameParts[0] || '';
          contact.lastName = nameParts.slice(1).join(' ') || '';
          console.log(`Split full name: ${contact.fullName} -> ${contact.firstName} ${contact.lastName}`);
        }
        
        // Create combined name
        contact.name = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
        
        // Enhanced validation - accept contact if it has ANY meaningful data
        const hasValidData = contact.name || 
                           contact.company || 
                           contact.email || 
                           contact.title ||
                           contact.fullName;
        
        console.log('Contact validation:', {
          name: contact.name,
          company: contact.company,
          email: contact.email,
          title: contact.title,
          hasValidData: hasValidData
        });
        
        if (hasValidData) {
          // Generate intelligent tags
          const tags = [];
          
          if (contact.location) {
            tags.push({ type: 'location', name: contact.location });
          }
          
          if (contact.company) {
            tags.push({ type: 'company', name: contact.company });
          }
          
          if (contact.title) {
            tags.push({ type: 'position', name: contact.title });
          }
          
          if (contact.industry) {
            tags.push({ type: 'industry', name: contact.industry });
          }
          
          // Add LinkedIn source tag
          tags.push({ type: 'source', name: 'LinkedIn Connection' });
          
          contact.tags = tags;
          contact.picture = 'https://cdn.jsdelivr.net/npm/simple-icons@v6/icons/linkedin.svg';
          
          results.push(contact);
          validRows++;
          console.log(`✓ VALID CONTACT ADDED: ${contact.name} (${contact.company})`);
        } else {
          console.log('✗ SKIPPED: No valid data found');
        }
      })
      .on('end', () => {
        console.log('\n=== CSV PARSING COMPLETE ===');
        console.log(`Total rows processed: ${totalRows}`);
        console.log(`Valid contacts found: ${validRows}`);
        console.log(`Success rate: ${totalRows > 0 ? (validRows/totalRows*100).toFixed(1) : 0}%`);
        
        if (results.length > 0) {
          console.log('\nSample contacts:');
          results.slice(0, 3).forEach((contact, i) => {
            console.log(`${i+1}. ${contact.name} - ${contact.company} (${contact.title})`);
          });
        }
        
        resolve(results);
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        reject(error);
      });
  });
}

/**
 * ALSO UPDATE THE API ENDPOINT TO USE THE CORRECT FIELD NAME
 * 
 * Change this line in your LinkedIn import endpoint:
 * FROM: app.post('/api/import/linkedin', upload.single('file'), ...)
 * TO:   app.post('/api/import/linkedin', upload.single('linkedinCsv'), ...)
 * 
 * The HTML form sends 'linkedinCsv' but the server expects 'file'
 */

// DEPLOYMENT INSTRUCTIONS:
// 1. Copy the parseLinkedInCSV function above
// 2. Replace the existing function in index.js 
// 3. Change upload.single('file') to upload.single('linkedinCsv') in the API endpoint
// 4. Deploy to Heroku
// 5. Test with your LinkedIn CSV file

module.exports = { parseLinkedInCSV };