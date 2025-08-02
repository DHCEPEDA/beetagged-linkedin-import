// Function to merge LinkedIn Connections and Contacts data
function mergeLinkedInData(connectionsData, contactsData) {
  const mergedContacts = new Map();
  
  // Process Connections CSV (usually: First Name, Last Name, Connected On)
  if (connectionsData) {
    const connectionsLines = connectionsData.split(/\r?\n/).filter(line => line.trim());
    if (connectionsLines.length > 1) {
      const connectionsHeaders = parseCSVLine(connectionsLines[0]);
      console.log('Connections headers:', connectionsHeaders);
      
      for (let i = 1; i < connectionsLines.length; i++) {
        const fields = parseCSVLine(connectionsLines[i]);
        const firstName = fields[0]?.trim() || '';
        const lastName = fields[1]?.trim() || '';
        const connectedOn = fields[2]?.trim() || '';
        
        if (firstName || lastName) {
          const fullName = `${firstName} ${lastName}`.trim();
          const key = fullName.toLowerCase();
          
          mergedContacts.set(key, {
            name: fullName,
            firstName,
            lastName,
            connectedOn,
            source: 'connections'
          });
        }
      }
    }
  }
  
  // Process Contacts CSV (usually: Name, URL, Email, Company, Position, etc.)
  if (contactsData) {
    const contactsLines = contactsData.split(/\r?\n/).filter(line => line.trim());
    if (contactsLines.length > 1) {
      const contactsHeaders = parseCSVLine(contactsLines[0]);
      console.log('Contacts headers:', contactsHeaders);
      
      // Find column indices in contacts CSV
      const contactsIndices = {
        name: findHeaderIndex(contactsHeaders, ['name', 'full name', 'contact name']),
        firstName: findHeaderIndex(contactsHeaders, ['first name', 'first']),
        lastName: findHeaderIndex(contactsHeaders, ['last name', 'last']),
        email: findHeaderIndex(contactsHeaders, ['email', 'email address', 'e-mail']),
        company: findHeaderIndex(contactsHeaders, ['company', 'organization', 'employer']),
        position: findHeaderIndex(contactsHeaders, ['position', 'title', 'job title']),
        url: findHeaderIndex(contactsHeaders, ['url', 'profile url', 'linkedin url', 'profile']),
        phone: findHeaderIndex(contactsHeaders, ['phone', 'phone number', 'mobile']),
        location: findHeaderIndex(contactsHeaders, ['location', 'address', 'city'])
      };
      
      for (let i = 1; i < contactsLines.length; i++) {
        const fields = parseCSVLine(contactsLines[i]);
        
        let fullName = '';
        if (contactsIndices.name >= 0) {
          fullName = fields[contactsIndices.name]?.trim() || '';
        } else if (contactsIndices.firstName >= 0 || contactsIndices.lastName >= 0) {
          const firstName = fields[contactsIndices.firstName]?.trim() || '';
          const lastName = fields[contactsIndices.lastName]?.trim() || '';
          fullName = `${firstName} ${lastName}`.trim();
        }
        
        if (fullName) {
          const key = fullName.toLowerCase();
          const existing = mergedContacts.get(key) || {};
          
          // Merge data from contacts CSV
          mergedContacts.set(key, {
            ...existing,
            name: fullName,
            email: fields[contactsIndices.email]?.trim() || existing.email || '',
            company: fields[contactsIndices.company]?.trim() || existing.company || '',
            position: fields[contactsIndices.position]?.trim() || existing.position || '',
            url: fields[contactsIndices.url]?.trim() || existing.url || '',
            phone: fields[contactsIndices.phone]?.trim() || existing.phone || '',
            location: fields[contactsIndices.location]?.trim() || existing.location || '',
            source: existing.source ? `${existing.source}+contacts` : 'contacts'
          });
        }
      }
    }
  }
  
  return Array.from(mergedContacts.values());
}

// Helper function to parse CSV line (handles quotes and commas)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Helper function to find header index
function findHeaderIndex(headers, variations) {
  for (const variation of variations) {
    const index = headers.findIndex(header => 
      header.toLowerCase().includes(variation.toLowerCase())
    );
    if (index >= 0) return index;
  }
  return -1;
}

module.exports = { mergeLinkedInData, parseCSVLine };