/**
 * Data Processing Utilities
 * Handles contact data validation, cleaning, and enhancement
 */

/**
 * Smart Tag Generation System
 * Automatically generates contextual tags for contacts based on their
 * company, position, and other attributes to enable intelligent search
 */
function generateTags(contact) {
  const tags = [];
  
  // Company-based tagging - enables "Who works at X" searches
  if (contact.company) {
    tags.push(contact.company);
    
    // Industry classification using company pattern matching
    const techCompanies = ['google', 'microsoft', 'apple', 'amazon', 'meta', 'facebook', 'netflix', 'uber', 'airbnb', 'stripe', 'slack', 'zoom', 'salesforce'];
    const financeCompanies = ['goldman', 'jpmorgan', 'chase', 'morgan stanley', 'blackrock', 'wells fargo', 'bank of america'];
    const consultingCompanies = ['mckinsey', 'bain', 'bcg', 'deloitte', 'pwc', 'kpmg', 'ey'];
    
    const companyLower = contact.company.toLowerCase();
    if (techCompanies.some(tech => companyLower.includes(tech))) {
      tags.push('Technology');
    } else if (financeCompanies.some(finance => companyLower.includes(finance))) {
      tags.push('Finance');
    } else if (consultingCompanies.some(consulting => companyLower.includes(consulting))) {
      tags.push('Consulting');
    }
  }
  
  // Role-based tagging
  if (contact.position) {
    tags.push(contact.position);
    
    const positionLower = contact.position.toLowerCase();
    if (positionLower.includes('engineer') || positionLower.includes('developer') || positionLower.includes('programmer')) {
      tags.push('Engineering');
    } else if (positionLower.includes('marketing') || positionLower.includes('growth')) {
      tags.push('Marketing');
    } else if (positionLower.includes('sales') || positionLower.includes('account')) {
      tags.push('Sales');
    } else if (positionLower.includes('manager') || positionLower.includes('director') || positionLower.includes('vp') || positionLower.includes('chief')) {
      tags.push('Management');
    } else if (positionLower.includes('design') || positionLower.includes('ux') || positionLower.includes('ui')) {
      tags.push('Design');
    } else if (positionLower.includes('product')) {
      tags.push('Product');
    } else if (positionLower.includes('data') || positionLower.includes('analyst') || positionLower.includes('scientist')) {
      tags.push('Data');
    }
  }
  
  // Location-based tagging
  if (contact.location) {
    tags.push(contact.location);
    
    const locationLower = contact.location.toLowerCase();
    if (locationLower.includes('san francisco') || locationLower.includes('sf') || locationLower.includes('bay area')) {
      tags.push('San Francisco');
    } else if (locationLower.includes('new york') || locationLower.includes('nyc') || locationLower.includes('manhattan')) {
      tags.push('New York');
    } else if (locationLower.includes('seattle')) {
      tags.push('Seattle');
    } else if (locationLower.includes('los angeles') || locationLower.includes('la')) {
      tags.push('Los Angeles');
    } else if (locationLower.includes('austin') || locationLower.includes('round rock')) {
      tags.push('Austin');
    } else if (locationLower.includes('boston')) {
      tags.push('Boston');
    } else if (locationLower.includes('chicago')) {
      tags.push('Chicago');
    }
  }
  
  return [...new Set(tags)]; // Remove duplicates
}

/**
 * Process and validate contact data
 */
function processContactData(rawData) {
  const processed = {
    name: cleanString(rawData.name),
    email: cleanEmail(rawData.email),
    phone: cleanPhone(rawData.phone),
    company: cleanString(rawData.company),
    position: cleanString(rawData.position),
    location: cleanString(rawData.location),
    source: rawData.source || 'manual',
    profileUrl: cleanUrl(rawData.profileUrl),
    profileImage: cleanUrl(rawData.profileImage),
    bio: cleanString(rawData.bio),
    notes: cleanString(rawData.notes),
    connectedOn: rawData.connectedOn,
    skills: Array.isArray(rawData.skills) ? rawData.skills.filter(Boolean) : [],
    tags: Array.isArray(rawData.tags) ? rawData.tags.filter(Boolean) : [],
    ranking: rawData.ranking || {},
    userId: rawData.userId,
    createdAt: rawData.createdAt || new Date(),
    updatedAt: new Date()
  };
  
  // Auto-generate tags if not provided
  if (processed.tags.length === 0) {
    processed.tags = generateTags(processed);
  } else {
    // Merge with auto-generated tags
    const autoTags = generateTags(processed);
    processed.tags = [...new Set([...processed.tags, ...autoTags])];
  }
  
  // Validate required fields
  if (!processed.name || processed.name.trim().length === 0) {
    throw new Error('Contact name is required');
  }
  
  return processed;
}

/**
 * Clean and validate string fields
 */
function cleanString(str) {
  if (!str || typeof str !== 'string') return '';
  return str.trim().replace(/\s+/g, ' ');
}

/**
 * Clean and validate email addresses
 */
function cleanEmail(email) {
  if (!email || typeof email !== 'string') return '';
  
  const cleaned = email.trim().toLowerCase();
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleaned)) {
    return ''; // Return empty string for invalid emails
  }
  
  return cleaned;
}

/**
 * Clean and validate phone numbers
 */
function cleanPhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  
  // Remove all non-digit characters except + for international numbers
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Basic phone validation (10+ digits)
  if (cleaned.length < 10) return '';
  
  return cleaned;
}

/**
 * Clean and validate URLs
 */
function cleanUrl(url) {
  if (!url || typeof url !== 'string') return '';
  
  const cleaned = url.trim();
  
  // Basic URL validation
  try {
    new URL(cleaned);
    return cleaned;
  } catch {
    // Try adding https:// if missing
    try {
      new URL(`https://${cleaned}`);
      return `https://${cleaned}`;
    } catch {
      return '';
    }
  }
}

/**
 * Deduplicate contacts based on email and name
 */
function deduplicateContacts(contacts) {
  const seen = new Set();
  const deduplicated = [];
  
  for (const contact of contacts) {
    const key = `${contact.email?.toLowerCase()}_${contact.name?.toLowerCase()}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(contact);
    }
  }
  
  return deduplicated;
}

/**
 * Merge contact data from multiple sources
 */
function mergeContactData(existingContact, newData) {
  const merged = { ...existingContact };
  
  // Merge non-empty fields
  Object.keys(newData).forEach(key => {
    if (newData[key] && (!merged[key] || merged[key].toString().trim() === '')) {
      merged[key] = newData[key];
    }
  });
  
  // Merge arrays (tags, skills)
  if (newData.tags && Array.isArray(newData.tags)) {
    merged.tags = [...new Set([...(merged.tags || []), ...newData.tags])];
  }
  
  if (newData.skills && Array.isArray(newData.skills)) {
    merged.skills = [...new Set([...(merged.skills || []), ...newData.skills])];
  }
  
  // Update timestamp
  merged.updatedAt = new Date();
  
  return merged;
}

/**
 * Extract skills from job title and company
 */
function extractSkills(contact) {
  const skills = [];
  const text = `${contact.position || ''} ${contact.company || ''}`.toLowerCase();
  
  // Common tech skills
  const techSkills = [
    'javascript', 'python', 'java', 'react', 'node.js', 'aws', 'docker', 
    'kubernetes', 'sql', 'mongodb', 'postgresql', 'machine learning', 'ai',
    'data science', 'analytics', 'salesforce', 'hubspot', 'marketing automation'
  ];
  
  techSkills.forEach(skill => {
    if (text.includes(skill.toLowerCase())) {
      skills.push(skill);
    }
  });
  
  return skills;
}

/**
 * Generate contact summary for AI processing
 */
function generateContactSummary(contact) {
  const parts = [];
  
  if (contact.name) parts.push(`Name: ${contact.name}`);
  if (contact.position) parts.push(`Position: ${contact.position}`);
  if (contact.company) parts.push(`Company: ${contact.company}`);
  if (contact.location) parts.push(`Location: ${contact.location}`);
  if (contact.skills && contact.skills.length > 0) parts.push(`Skills: ${contact.skills.join(', ')}`);
  if (contact.tags && contact.tags.length > 0) parts.push(`Tags: ${contact.tags.join(', ')}`);
  
  return parts.join(' | ');
}

module.exports = {
  generateTags,
  processContactData,
  cleanString,
  cleanEmail,
  cleanPhone,
  cleanUrl,
  deduplicateContacts,
  mergeContactData,
  extractSkills,
  generateContactSummary
};