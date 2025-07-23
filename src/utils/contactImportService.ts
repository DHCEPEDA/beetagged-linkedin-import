import { Contact } from '../types/contact';

/**
 * Contact Import Service
 * 
 * Handles CSV file processing for LinkedIn connection exports with enhanced
 * parsing capabilities for quoted fields and multiple header formats.
 * 
 * Key Features:
 * - Robust CSV parsing with quote handling
 * - Multiple header format support
 * - Data validation and cleaning
 * - Contact object transformation
 * 
 * @author BeeTagged Development Team
 */

/**
 * Contact Data Interface
 * 
 * Represents the structure of contact data extracted from CSV files
 * before transformation into the full Contact object.
 */
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
  /**
   * Import Contacts from CSV File
   * 
   * Reads a CSV file using FileReader API and processes it into Contact objects.
   * Handles LinkedIn exports with various formats and quoted field parsing.
   * 
   * @param {File} file - CSV file uploaded by user
   * @returns {Promise<Contact[]>} Promise resolving to array of Contact objects
   * @throws {Error} If file reading fails or CSV format is invalid
   * 
   * Usage Example:
   * ```typescript
   * const contacts = await ContactImportService.importFromCSV(csvFile);
   * console.log(`Imported ${contacts.length} contacts`);
   * ```
   */
  static async importFromCSV(file: File): Promise<Contact[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const csv = e.target?.result as string;
          const contacts = this.parseCSVToContacts(csv);
          resolve(contacts);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read CSV file'));
      reader.readAsText(file);
    });
  }

  /**
   * Parse CSV String to Contact Objects
   * 
   * Converts raw CSV data into structured Contact objects with proper
   * field mapping and data validation. Handles multiple LinkedIn export formats.
   * 
   * @param {string} csv - Raw CSV content as string
   * @returns {Contact[]} Array of parsed and validated Contact objects
   * @throws {Error} If CSV has invalid format or insufficient data
   * 
   * Parsing Process:
   * 1. Split CSV into lines and parse headers
   * 2. Map headers to standard field names
   * 3. Process each data row with quote handling
   * 4. Transform to Contact objects with defaults
   * 5. Apply data validation and cleaning
   */
  private static parseCSVToContacts(csv: string): Contact[] {
    const lines = csv.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');
    
    const headers = this.parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
    const contacts: Contact[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      
      if (values.length !== headers.length) continue;
      
      // Build name from separate fields or use full name
      let name = this.getCSVValue(headers, values, ['name', 'full name', 'contact name']);
      if (!name) {
        const firstName = this.getCSVValue(headers, values, ['first name', 'firstname']);
        const lastName = this.getCSVValue(headers, values, ['last name', 'lastname', 'surname']);
        name = firstName && lastName ? `${firstName} ${lastName}`.trim() : `Contact ${i}`;
      }
      
      const contact: Contact = {
        id: crypto.randomUUID(),
        name,
        company: this.getCSVValue(headers, values, ['company', 'organization', 'employer', 'current company']) || 'Unknown Company',
        jobTitle: this.getCSVValue(headers, values, ['job title', 'title', 'position', 'role', 'current position']) || 'Unknown Title',
        industry: this.getCSVValue(headers, values, ['industry', 'sector', 'company industry']) || 'Unknown Industry',
        email: this.getCSVValue(headers, values, ['email', 'email address', 'email addresses']),
        phone: this.getCSVValue(headers, values, ['phone', 'phone number', 'mobile', 'phone numbers']),
        linkedinUrl: this.getCSVValue(headers, values, ['linkedin', 'linkedin url', 'linkedin profile', 'url']),
        location: this.getCSVValue(headers, values, ['location', 'current location', 'address', 'city']),
        howWeMet: this.getCSVValue(headers, values, ['how we met', 'source', 'connection']) || 'CSV Import',
        notes: this.getCSVValue(headers, values, ['notes', 'comments', 'description']),
        tags: this.getCSVValue(headers, values, ['tags'])?.split(';').map(t => t.trim()).filter(Boolean) || [],
        createdAt: new Date(),
        source: 'linkedin'
      };
      
      contacts.push(contact);
    }
    
    return contacts;
  }

  private static getCSVValue(headers: string[], values: string[], possibleKeys: string[]): string | undefined {
    for (const key of possibleKeys) {
      const index = headers.indexOf(key);
      if (index !== -1 && values[index]) {
        return values[index].trim();
      }
    }
    return undefined;
  }

  // Phone Contacts Import (Web Contacts API - limited browser support)
  static async importFromPhone(): Promise<Contact[]> {
    if (!('contacts' in navigator)) {
      throw new Error('Phone contacts access not supported in this browser');
    }

    try {
      // @ts-ignore - Web Contacts API is experimental
      const contacts = await navigator.contacts.select(['name', 'email', 'tel'], { multiple: true });
      
      return contacts.map((contact: any) => ({
        id: crypto.randomUUID(),
        name: contact.name?.[0] || 'Unknown Contact',
        company: 'Unknown Company',
        jobTitle: 'Unknown Title',
        industry: 'Unknown Industry',
        email: contact.email?.[0],
        phone: contact.tel?.[0],
        howWeMet: 'Phone Import',
        createdAt: new Date(),
        tags: ['phone-import'],
        source: 'phone' as const
      }));
    } catch (error) {
      throw new Error('Failed to access phone contacts: ' + (error as Error).message);
    }
  }

  // Generate sample CSV template
  static generateCSVTemplate(): string {
    return [
      'name,company,job title,industry,email,phone,linkedin,how we met,notes,tags',
      'John Smith,Tesla,Software Engineer,Automotive,john@tesla.com,555-0123,linkedin.com/in/johnsmith,Conference,Great engineer,engineering;tesla',
      'Jane Doe,Google,Product Manager,Technology,jane@google.com,555-0456,linkedin.com/in/janedoe,Mutual friend,PM for Chrome,product;google;chrome'
    ].join('\n');
  }

  // Download CSV template
  static downloadCSVTemplate(): void {
    const template = this.generateCSVTemplate();
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'beetagged-contacts-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
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