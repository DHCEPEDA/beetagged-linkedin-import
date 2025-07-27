/**
 * Validation Utilities
 * Input validation and sanitization functions
 */

/**
 * Validate contact data structure
 */
function validateContactData(data) {
  const errors = [];
  
  // Required fields
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Name is required and must be a non-empty string');
  }
  
  // Optional field validations
  if (data.email && !isValidEmail(data.email)) {
    errors.push('Email must be a valid email address');
  }
  
  if (data.phone && !isValidPhone(data.phone)) {
    errors.push('Phone must be a valid phone number');
  }
  
  if (data.profileUrl && !isValidUrl(data.profileUrl)) {
    errors.push('Profile URL must be a valid URL');
  }
  
  if (data.source && !['linkedin', 'facebook', 'manual', 'linkedin_import'].includes(data.source)) {
    errors.push('Source must be one of: linkedin, facebook, manual, linkedin_import');
  }
  
  if (data.tags && !Array.isArray(data.tags)) {
    errors.push('Tags must be an array');
  }
  
  if (data.skills && !Array.isArray(data.skills)) {
    errors.push('Skills must be an array');
  }
  
  if (data.ranking && typeof data.ranking !== 'object') {
    errors.push('Ranking must be an object');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate phone number format
 */
function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Must have at least 10 digits
  const digitCount = cleaned.replace(/[^0-9]/g, '').length;
  return digitCount >= 10 && digitCount <= 15;
}

/**
 * Validate URL format
 */
function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    // Try with https:// prefix
    try {
      new URL(`https://${url}`);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Validate search query
 */
function validateSearchQuery(query) {
  const errors = [];
  
  if (!query || typeof query !== 'string') {
    errors.push('Query must be a non-empty string');
  } else if (query.trim().length === 0) {
    errors.push('Query cannot be empty');
  } else if (query.length > 500) {
    errors.push('Query must be less than 500 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate ranking data
 */
function validateRanking(ranking) {
  const errors = [];
  const validCategories = ['coding', 'cooking', 'intelligence', 'networking', 'leadership'];
  
  if (!ranking || typeof ranking !== 'object') {
    errors.push('Ranking must be an object');
    return { isValid: false, errors };
  }
  
  Object.entries(ranking).forEach(([category, score]) => {
    if (!validCategories.includes(category)) {
      errors.push(`Invalid ranking category: ${category}`);
    }
    
    if (typeof score !== 'number' || score < 1 || score > 10) {
      errors.push(`Ranking score for ${category} must be a number between 1 and 10`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate pagination parameters
 */
function validatePagination(page, limit) {
  const errors = [];
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  if (isNaN(pageNum) || pageNum < 1) {
    errors.push('Page must be a positive integer');
  }
  
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    errors.push('Limit must be a positive integer between 1 and 100');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    page: Math.max(1, pageNum || 1),
    limit: Math.min(100, Math.max(1, limitNum || 20))
  };
}

/**
 * Validate file upload
 */
function validateFileUpload(file, allowedTypes = [], maxSize = 10 * 1024 * 1024) {
  const errors = [];
  
  if (!file) {
    errors.push('No file provided');
    return { isValid: false, errors };
  }
  
  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
  }
  
  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
    errors.push(`File type must be one of: ${allowedTypes.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize string input
 */
function sanitizeString(str, maxLength = 1000) {
  if (!str || typeof str !== 'string') return '';
  
  return str
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .slice(0, maxLength) // Limit length
    .replace(/[<>]/g, ''); // Remove potential HTML tags
}

/**
 * Validate MongoDB ObjectId
 */
function isValidObjectId(id) {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Validate date format
 */
function isValidDate(date) {
  if (!date) return false;
  
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
}

/**
 * Validate filter object for search
 */
function validateSearchFilters(filters) {
  const errors = [];
  const validFilters = ['company', 'position', 'location', 'source', 'tags', 'skills', 'createdAfter', 'createdBefore'];
  
  if (!filters || typeof filters !== 'object') {
    return { isValid: true, errors: [], sanitized: {} };
  }
  
  const sanitized = {};
  
  Object.entries(filters).forEach(([key, value]) => {
    if (!validFilters.includes(key)) {
      errors.push(`Invalid filter: ${key}`);
      return;
    }
    
    switch (key) {
      case 'company':
      case 'position':
      case 'location':
      case 'source':
        if (typeof value === 'string' && value.trim()) {
          sanitized[key] = sanitizeString(value, 100);
        }
        break;
        
      case 'tags':
      case 'skills':
        if (Array.isArray(value)) {
          sanitized[key] = value
            .filter(item => typeof item === 'string' && item.trim())
            .map(item => sanitizeString(item, 50))
            .slice(0, 10); // Limit array size
        }
        break;
        
      case 'createdAfter':
      case 'createdBefore':
        if (isValidDate(value)) {
          sanitized[key] = new Date(value);
        } else {
          errors.push(`${key} must be a valid date`);
        }
        break;
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
}

module.exports = {
  validateContactData,
  isValidEmail,
  isValidPhone,
  isValidUrl,
  validateSearchQuery,
  validateRanking,
  validatePagination,
  validateFileUpload,
  sanitizeString,
  isValidObjectId,
  isValidDate,
  validateSearchFilters
};