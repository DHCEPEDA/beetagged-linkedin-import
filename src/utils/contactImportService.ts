// Enhanced CSV parsing service for LinkedIn contact imports
export interface ContactData {
  name: string;
  email: string;
  company: string;
  position: string;
  location: string;
  connectedOn?: string;
  url?: string;
}

export class ContactImportService {
  // LinkedIn CSV header mappings - handles multiple variations
  private static LINKEDIN_HEADER_MAPPINGS = {
    name: [
      'first name',
      'last name', 
      'name',
      'full name',
      'contact name'
    ],
    firstName: [
      'first name',
      'firstname',
      'given name'
    ],
    lastName: [
      'last name',
      'lastname',
      'surname',
      'family name'
    ],
    email: [
      'email address',
      'email',
      'e-mail',
      'email addresses',
      'primary email'
    ],
    company: [
      'company',
      'current company',
      'organization',
      'employer',
      'workplace'
    ],
    position: [
      'position',
      'current position',
      'title',
      'job title',
      'current title',
      'role'
    ],
    location: [
      'location',
      'current location',
      'address',
      'city',
      'region'
    ],
    connectedOn: [
      'connected on',
      'connection date',
      'date connected',
      'connected'
    ],
    url: [
      'url',
      'profile url',
      'linkedin url',
      'profile link'
    ]
  };

  // Parse a single CSV line handling quoted fields properly
  static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote within quotes
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator outside quotes
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }

    // Add the last field
    result.push(current.trim());
    return result;
  }

  // Find header index by checking multiple possible names
  static findHeaderIndex(headers: string[], fieldMappings: string[]): number {
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
    
    for (const mapping of fieldMappings) {
      const index = normalizedHeaders.indexOf(mapping.toLowerCase());
      if (index !== -1) {
        return index;
      }
    }
    return -1;
  }

  // Parse complete CSV content
  static parseLinkedInCSV(csvContent: string): ContactData[] {
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('CSV file must contain at least a header row and one data row');
    }

    // Parse headers
    const headerLine = lines[0];
    const headers = this.parseCSVLine(headerLine);
    
    // Find column indices for each field
    const indices = {
      firstName: this.findHeaderIndex(headers, this.LINKEDIN_HEADER_MAPPINGS.firstName),
      lastName: this.findHeaderIndex(headers, this.LINKEDIN_HEADER_MAPPINGS.lastName),
      name: this.findHeaderIndex(headers, this.LINKEDIN_HEADER_MAPPINGS.name),
      email: this.findHeaderIndex(headers, this.LINKEDIN_HEADER_MAPPINGS.email),
      company: this.findHeaderIndex(headers, this.LINKEDIN_HEADER_MAPPINGS.company),
      position: this.findHeaderIndex(headers, this.LINKEDIN_HEADER_MAPPINGS.position),
      location: this.findHeaderIndex(headers, this.LINKEDIN_HEADER_MAPPINGS.location),
      connectedOn: this.findHeaderIndex(headers, this.LINKEDIN_HEADER_MAPPINGS.connectedOn),
      url: this.findHeaderIndex(headers, this.LINKEDIN_HEADER_MAPPINGS.url)
    };

    console.log('CSV Headers found:', headers);
    console.log('Field indices:', indices);

    const contacts: ContactData[] = [];

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      try {
        const fields = this.parseCSVLine(lines[i]);
        
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
          continue;
        }

        const contact: ContactData = {
          name,
          email: indices.email >= 0 ? (fields[indices.email]?.trim() || '') : '',
          company: indices.company >= 0 ? (fields[indices.company]?.trim() || '') : '',
          position: indices.position >= 0 ? (fields[indices.position]?.trim() || '') : '',
          location: indices.location >= 0 ? (fields[indices.location]?.trim() || '') : '',
          connectedOn: indices.connectedOn >= 0 ? (fields[indices.connectedOn]?.trim() || '') : '',
          url: indices.url >= 0 ? (fields[indices.url]?.trim() || '') : ''
        };

        contacts.push(contact);
      } catch (error) {
        console.warn(`Error parsing CSV line ${i + 1}:`, error);
        // Continue processing other lines
      }
    }

    console.log(`Successfully parsed ${contacts.length} contacts from CSV`);
    return contacts;
  }

  // Generate smart tags based on contact data
  static generateTags(contact: ContactData): string[] {
    const tags: string[] = ['linkedin'];

    // Company tags
    if (contact.company) {
      tags.push(`company:${contact.company.toLowerCase()}`);
      
      // Industry detection
      const companyLower = contact.company.toLowerCase();
      if (companyLower.includes('google') || companyLower.includes('microsoft') || 
          companyLower.includes('apple') || companyLower.includes('amazon')) {
        tags.push('industry:tech');
      } else if (companyLower.includes('bank') || companyLower.includes('financial') || 
                 companyLower.includes('investment')) {
        tags.push('industry:finance');
      } else if (companyLower.includes('hospital') || companyLower.includes('medical') || 
                 companyLower.includes('health')) {
        tags.push('industry:healthcare');
      }
    }

    // Position/role tags
    if (contact.position) {
      tags.push(`role:${contact.position.toLowerCase()}`);
      
      const positionLower = contact.position.toLowerCase();
      if (positionLower.includes('engineer') || positionLower.includes('developer') || 
          positionLower.includes('programmer')) {
        tags.push('function:engineering');
      } else if (positionLower.includes('marketing') || positionLower.includes('growth')) {
        tags.push('function:marketing');
      } else if (positionLower.includes('sales') || positionLower.includes('business development')) {
        tags.push('function:sales');
      } else if (positionLower.includes('manager') || positionLower.includes('director') || 
                 positionLower.includes('vp') || positionLower.includes('ceo')) {
        tags.push('function:management');
      } else if (positionLower.includes('design') || positionLower.includes('ux') || 
                 positionLower.includes('ui')) {
        tags.push('function:design');
      }
    }

    // Location tags
    if (contact.location) {
      tags.push(`location:${contact.location.toLowerCase()}`);
      
      const locationLower = contact.location.toLowerCase();
      if (locationLower.includes('san francisco') || locationLower.includes('sf bay')) {
        tags.push('city:san-francisco');
      } else if (locationLower.includes('new york') || locationLower.includes('nyc')) {
        tags.push('city:new-york');
      } else if (locationLower.includes('seattle')) {
        tags.push('city:seattle');
      } else if (locationLower.includes('los angeles') || locationLower.includes('la')) {
        tags.push('city:los-angeles');
      } else if (locationLower.includes('boston')) {
        tags.push('city:boston');
      } else if (locationLower.includes('chicago')) {
        tags.push('city:chicago');
      }
    }

    return tags;
  }

  // Validate contact data
  static validateContact(contact: ContactData): boolean {
    return !!(contact.name && contact.name.trim().length > 0);
  }

  // Clean and normalize contact data
  static cleanContact(contact: ContactData): ContactData {
    return {
      name: contact.name.trim(),
      email: contact.email.trim().toLowerCase(),
      company: contact.company.trim(),
      position: contact.position.trim(),
      location: contact.location.trim(),
      connectedOn: contact.connectedOn?.trim() || '',
      url: contact.url?.trim() || ''
    };
  }
}

export default ContactImportService;