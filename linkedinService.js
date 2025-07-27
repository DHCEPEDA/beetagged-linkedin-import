const csv = require('csv-parser');
const { Readable } = require('stream');

/**
 * LinkedIn CSV Header Mappings
 * Maps standard contact fields to various header names found in different
 * LinkedIn export formats.
 */
const LINKEDIN_HEADER_MAPPINGS = {
  firstName: ['first name', 'firstname', 'given name'],
  lastName: ['last name', 'lastname', 'surname', 'family name'],
  name: ['first name', 'last name', 'name', 'full name', 'contact name'],
  email: ['email address', 'email', 'e-mail', 'email addresses', 'primary email'],
  company: ['company', 'current company', 'organization', 'employer', 'workplace'],
  position: ['position', 'current position', 'title', 'job title', 'current title', 'role'],
  location: ['location', 'current location', 'address', 'city', 'region'],
  connectedOn: ['connected on', 'connection date', 'date connected', 'connected'],
  url: ['url', 'profile url', 'linkedin url', 'profile link']
};

/**
 * Enhanced CSV Line Parser for LinkedIn Exports
 * Handles complex CSV formats including quoted fields with commas and escaped quotes.
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 2;
      } else {
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Find Header Index by Mapping
 */
function findHeaderIndex(headers, fieldMappings) {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  
  for (const mapping of fieldMappings) {
    const index = normalizedHeaders.indexOf(mapping.toLowerCase());
    if (index !== -1) {
      return index;
    }
  }
  return -1;
}

/**
 * Parse LinkedIn CSV Data
 * Enhanced parser that handles complex LinkedIn export formats
 */
async function parseLinkedInCSV(csvData) {
  const lines = csvData.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('CSV file must contain at least a header row and one data row');
  }

  // Parse headers using enhanced parser
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  console.log('CSV Headers found:', headers);
  
  // Find column indices for each field
  const indices = {
    firstName: findHeaderIndex(headers, LINKEDIN_HEADER_MAPPINGS.firstName),
    lastName: findHeaderIndex(headers, LINKEDIN_HEADER_MAPPINGS.lastName),
    name: findHeaderIndex(headers, LINKEDIN_HEADER_MAPPINGS.name),
    email: findHeaderIndex(headers, LINKEDIN_HEADER_MAPPINGS.email),
    company: findHeaderIndex(headers, LINKEDIN_HEADER_MAPPINGS.company),
    position: findHeaderIndex(headers, LINKEDIN_HEADER_MAPPINGS.position),
    location: findHeaderIndex(headers, LINKEDIN_HEADER_MAPPINGS.location),
    connectedOn: findHeaderIndex(headers, LINKEDIN_HEADER_MAPPINGS.connectedOn),
    url: findHeaderIndex(headers, LINKEDIN_HEADER_MAPPINGS.url)
  };

  console.log('Field indices:', indices);

  const contacts = [];
  let processed = 0;
  let skipped = 0;

  // Process data rows with enhanced parsing
  for (let i = 1; i < lines.length; i++) {
    try {
      const fields = parseCSVLine(lines[i]);
      processed++;
      
      // Build name from firstName/lastName or use full name field
      let name = '';
      if (indices.firstName >= 0 && indices.lastName >= 0) {
        const firstName = fields[indices.firstName]?.trim() || '';
        const lastName = fields[indices.lastName]?.trim() || '';
        name = `${firstName} ${lastName}`.trim();
      } else if (indices.name >= 0) {
        name = fields[indices.name]?.trim() || '';
      }

      // Skip rows without a name
      if (!name) {
        skipped++;
        continue;
      }

      const contactData = {
        name,
        email: indices.email >= 0 ? (fields[indices.email]?.trim().toLowerCase() || '') : '',
        company: indices.company >= 0 ? (fields[indices.company]?.trim() || '') : '',
        position: indices.position >= 0 ? (fields[indices.position]?.trim() || '') : '',
        location: indices.location >= 0 ? (fields[indices.location]?.trim() || '') : '',
        connectedOn: indices.connectedOn >= 0 ? (fields[indices.connectedOn]?.trim() || '') : '',
        profileUrl: indices.url >= 0 ? (fields[indices.url]?.trim() || '') : ''
      };

      contacts.push(contactData);
    } catch (error) {
      console.warn(`Error parsing CSV line ${i + 1}:`, error);
      skipped++;
    }
  }

  return {
    contacts,
    stats: { processed, skipped }
  };
}

/**
 * Fetch LinkedIn contacts via API (for future implementation)
 */
async function fetchLinkedInContacts(accessToken) {
  // TODO: Implement LinkedIn API integration
  throw new Error('LinkedIn API integration not yet implemented');
}

/**
 * Get LinkedIn profile data
 */
async function getLinkedInProfile(accessToken) {
  // TODO: Implement LinkedIn profile fetching
  throw new Error('LinkedIn profile API not yet implemented');
}

module.exports = {
  parseLinkedInCSV,
  fetchLinkedInContacts,
  getLinkedInProfile
};