const csv = require('csv-parser');
const { Readable } = require('stream');

/**
 * UNIFIED CSV PROCESSOR
 * Replaces all existing CSV processing functions with a single, efficient processor
 * Handles LinkedIn Connections, LinkedIn Contacts, and generic Contacts CSV formats
 */

/**
 * Comprehensive CSV Header Mappings
 * Supports LinkedIn exports and generic contact CSV formats
 */
const CSV_HEADER_MAPPINGS = {
  // Name fields
  firstName: ['first name', 'firstname', 'given name'],
  lastName: ['last name', 'lastname', 'surname', 'family name'],
  fullName: ['name', 'full name', 'fullname', 'contact name'],
  
  // Contact fields
  email: ['email address', 'email', 'e-mail', 'email addresses', 'primary email', 'emails'],
  phone: ['phone', 'phone number', 'phonenumber', 'mobile', 'telephone', 'phoneNumbers'],
  
  // Professional fields
  company: ['company', 'current company', 'organization', 'employer', 'workplace', 'companies'],
  position: ['position', 'current position', 'title', 'job title', 'current title', 'role', 'jobtitle'],
  location: ['location', 'current location', 'address', 'city', 'region', 'addresses'],
  
  // LinkedIn specific
  connectedOn: ['connected on', 'connection date', 'date connected', 'connected'],
  profileUrl: ['url', 'profile url', 'linkedin url', 'profile link', 'profiles'],
  
  // Additional contact fields
  birthday: ['birthday', 'birth date', 'birthdate', 'date of birth'],
  notes: ['notes', 'description', 'bio'],
  source: ['source', 'origin'],
  websites: ['websites', 'sites', 'website'],
  instantMessage: ['instant message handles', 'instantmessagehandles', 'im'],
  
  // Date fields
  createdAt: ['created at', 'createdat', 'date created'],
  bookmarkedAt: ['bookmarked at', 'bookmarkedat', 'date bookmarked']
};

/**
 * Enhanced CSV Line Parser
 * Handles quoted fields, commas inside quotes, and escaped quotes
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
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
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
 * Returns the index of the first matching header or -1 if not found
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
 * Detect CSV Format
 * Determines the type of CSV based on headers
 */
function detectCSVFormat(headers) {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  
  // LinkedIn Connections format
  if (normalizedHeaders.includes('first name') && normalizedHeaders.includes('last name')) {
    return 'linkedin_connections';
  }
  
  // LinkedIn Contacts format (usually has different structure)
  if (normalizedHeaders.includes('name') && normalizedHeaders.includes('company')) {
    return 'linkedin_contacts';
  }
  
  // Generic contacts format
  if (normalizedHeaders.includes('firstname') || normalizedHeaders.includes('fullname')) {
    return 'generic_contacts';
  }
  
  return 'unknown';
}

/**
 * Parse Multiple Values
 * Handles fields that may contain multiple values separated by various delimiters
 */
function parseMultipleValues(value) {
  if (!value || typeof value !== 'string') return [];
  
  // Common separators: semicolon, comma, pipe, newline
  const separators = [';', ',', '|', '\n', '\r\n'];
  let values = [value];
  
  for (const sep of separators) {
    if (value.includes(sep)) {
      values = value.split(sep);
      break;
    }
  }
  
  return values
    .map(v => v.trim())
    .filter(v => v.length > 0)
    .filter(v => v !== 'null' && v !== 'undefined');
}

/**
 * Clean and Normalize Data
 */
function cleanValue(value) {
  if (!value || typeof value !== 'string') return '';
  return value.trim().replace(/^"(.*)"$/, '$1'); // Remove surrounding quotes
}

/**
 * Parse Date String
 * Attempts to parse various date formats
 */
function parseDate(dateString) {
  if (!dateString || typeof dateString !== 'string') return null;
  
  const cleaned = cleanValue(dateString);
  if (!cleaned) return null;
  
  try {
    const date = new Date(cleaned);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    return null;
  }
}

/**
 * UNIFIED CSV PROCESSOR
 * Main function that processes any CSV format
 */
async function processAnyCSV(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const contacts = [];
    const errors = [];
    let processed = 0;
    let skipped = 0;
    let format = 'unknown';
    
    // Create readable stream from buffer
    const stream = Readable.from(buffer.toString('utf8'));
    
    let headers = [];
    let headerIndices = {};
    let isFirstRow = true;
    
    stream
      .pipe(csv({ headers: false }))
      .on('data', (row) => {
        try {
          // Handle headers on first row
          if (isFirstRow) {
            headers = Object.values(row);
            format = detectCSVFormat(headers);
            
            // Map header indices
            headerIndices = {
              firstName: findHeaderIndex(headers, CSV_HEADER_MAPPINGS.firstName),
              lastName: findHeaderIndex(headers, CSV_HEADER_MAPPINGS.lastName),
              fullName: findHeaderIndex(headers, CSV_HEADER_MAPPINGS.fullName),
              email: findHeaderIndex(headers, CSV_HEADER_MAPPINGS.email),
              phone: findHeaderIndex(headers, CSV_HEADER_MAPPINGS.phone),
              company: findHeaderIndex(headers, CSV_HEADER_MAPPINGS.company),
              position: findHeaderIndex(headers, CSV_HEADER_MAPPINGS.position),
              location: findHeaderIndex(headers, CSV_HEADER_MAPPINGS.location),
              connectedOn: findHeaderIndex(headers, CSV_HEADER_MAPPINGS.connectedOn),
              profileUrl: findHeaderIndex(headers, CSV_HEADER_MAPPINGS.profileUrl),
              birthday: findHeaderIndex(headers, CSV_HEADER_MAPPINGS.birthday),
              notes: findHeaderIndex(headers, CSV_HEADER_MAPPINGS.notes),
              websites: findHeaderIndex(headers, CSV_HEADER_MAPPINGS.websites),
              instantMessage: findHeaderIndex(headers, CSV_HEADER_MAPPINGS.instantMessage),
              createdAt: findHeaderIndex(headers, CSV_HEADER_MAPPINGS.createdAt),
              bookmarkedAt: findHeaderIndex(headers, CSV_HEADER_MAPPINGS.bookmarkedAt)
            };
            
            console.log(`🔍 Detected CSV format: ${format}`);
            console.log(`📋 Headers found: ${headers.length} columns`);
            
            isFirstRow = false;
            return;
          }
          
          processed++;
          const rowData = Object.values(row);
          
          // Build contact name
          let name = '';
          if (headerIndices.firstName >= 0 && headerIndices.lastName >= 0) {
            const firstName = cleanValue(rowData[headerIndices.firstName]);
            const lastName = cleanValue(rowData[headerIndices.lastName]);
            name = `${firstName} ${lastName}`.trim();
          } else if (headerIndices.fullName >= 0) {
            name = cleanValue(rowData[headerIndices.fullName]);
          }
          
          // Skip rows without name
          if (!name) {
            skipped++;
            return;
          }
          
          // Extract all contact data
          const contactData = {
            name,
            email: headerIndices.email >= 0 ? cleanValue(rowData[headerIndices.email]).toLowerCase() : '',
            emails: headerIndices.email >= 0 ? parseMultipleValues(rowData[headerIndices.email]) : [],
            phone: headerIndices.phone >= 0 ? cleanValue(rowData[headerIndices.phone]) : '',
            phoneNumbers: headerIndices.phone >= 0 ? parseMultipleValues(rowData[headerIndices.phone]) : [],
            company: headerIndices.company >= 0 ? cleanValue(rowData[headerIndices.company]) : '',
            companies: headerIndices.company >= 0 ? parseMultipleValues(rowData[headerIndices.company]) : [],
            position: headerIndices.position >= 0 ? cleanValue(rowData[headerIndices.position]) : '',
            jobTitle: headerIndices.position >= 0 ? cleanValue(rowData[headerIndices.position]) : '',
            location: headerIndices.location >= 0 ? cleanValue(rowData[headerIndices.location]) : '',
            addresses: headerIndices.location >= 0 ? parseMultipleValues(rowData[headerIndices.location]) : [],
            connectedOn: headerIndices.connectedOn >= 0 ? cleanValue(rowData[headerIndices.connectedOn]) : '',
            profileUrl: headerIndices.profileUrl >= 0 ? cleanValue(rowData[headerIndices.profileUrl]) : '',
            linkedinId: headerIndices.profileUrl >= 0 ? cleanValue(rowData[headerIndices.profileUrl]) : '',
            birthday: headerIndices.birthday >= 0 ? cleanValue(rowData[headerIndices.birthday]) : '',
            birthdayParsed: headerIndices.birthday >= 0 ? parseDate(rowData[headerIndices.birthday]) : null,
            notes: headerIndices.notes >= 0 ? cleanValue(rowData[headerIndices.notes]) : '',
            sites: headerIndices.websites >= 0 ? parseMultipleValues(rowData[headerIndices.websites]) : [],
            instantMessageHandles: headerIndices.instantMessage >= 0 ? parseMultipleValues(rowData[headerIndices.instantMessage]) : [],
            originalCreatedAt: headerIndices.createdAt >= 0 ? cleanValue(rowData[headerIndices.createdAt]) : '',
            originalCreatedAtParsed: headerIndices.createdAt >= 0 ? parseDate(rowData[headerIndices.createdAt]) : null,
            bookmarkedAt: headerIndices.bookmarkedAt >= 0 ? cleanValue(rowData[headerIndices.bookmarkedAt]) : '',
            bookmarkedAtParsed: headerIndices.bookmarkedAt >= 0 ? parseDate(rowData[headerIndices.bookmarkedAt]) : null,
            source: format,
            csvFormat: format,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          // Generate searchable text
          contactData.searchableText = [
            contactData.name,
            contactData.company,
            contactData.position,
            contactData.location,
            contactData.email,
            ...(contactData.emails || []),
            ...(contactData.companies || [])
          ].filter(Boolean).join(' ').toLowerCase();
          
          contacts.push(contactData);
          
        } catch (error) {
          errors.push({
            row: processed,
            error: error.message,
            data: row
          });
          skipped++;
        }
      })
      .on('end', () => {
        const result = {
          contacts,
          stats: {
            processed,
            skipped,
            successful: contacts.length,
            errors: errors.length,
            format
          },
          errors: errors.slice(0, 10), // Limit errors to first 10
          headers,
          headerIndices
        };
        
        console.log(`✅ CSV processing complete:`);
        console.log(`   📊 Processed: ${processed} rows`);
        console.log(`   ✅ Successful: ${contacts.length} contacts`);
        console.log(`   ⚠️  Skipped: ${skipped} rows`);
        console.log(`   ❌ Errors: ${errors.length} rows`);
        
        resolve(result);
      })
      .on('error', (error) => {
        console.error('❌ CSV parsing error:', error);
        reject(error);
      });
  });
}

/**
 * Batch Process Contacts
 * Efficiently process large arrays of contacts in batches
 */
async function batchProcessContacts(contacts, batchSize = 100) {
  const batches = [];
  
  for (let i = 0; i < contacts.length; i += batchSize) {
    batches.push(contacts.slice(i, i + batchSize));
  }
  
  console.log(`📦 Created ${batches.length} batches of ${batchSize} contacts each`);
  return batches;
}

module.exports = {
  processAnyCSV,
  batchProcessContacts,
  detectCSVFormat,
  parseMultipleValues,
  cleanValue,
  parseDate,
  CSV_HEADER_MAPPINGS
};