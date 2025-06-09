/**
 * Contact Matching Service
 * Intelligently matches phone contacts with Facebook/LinkedIn profiles
 * Handles fuzzy matching when phone numbers aren't available
 */

const logger = require('../../utils/logger');

class ContactMatchingService {
  
  /**
   * Match phone contacts with Facebook profiles using multiple strategies
   * @param {Array} phoneContacts - Contacts from phone
   * @param {Array} facebookContacts - Facebook friends data
   * @param {string} facebookToken - Facebook access token for detailed profile access
   * @returns {Array} Matched and enriched contacts
   */
  async matchContactsWithFacebook(phoneContacts, facebookContacts, facebookToken) {
    try {
      const matchedContacts = [];
      
      // Create lookup maps for Facebook contacts
      const facebookByPhone = new Map();
      const facebookByEmail = new Map();
      const facebookByName = new Map();
      
      // Index Facebook contacts by available identifiers
      for (const fbContact of facebookContacts) {
        if (fbContact.phone) {
          const normalizedPhone = this.normalizePhoneNumber(fbContact.phone);
          facebookByPhone.set(normalizedPhone, fbContact);
        }
        if (fbContact.email) {
          facebookByEmail.set(fbContact.email.toLowerCase(), fbContact);
        }
        if (fbContact.name) {
          const normalizedName = this.normalizeName(fbContact.name);
          facebookByName.set(normalizedName, fbContact);
        }
      }

      // Match each phone contact with Facebook data
      for (const phoneContact of phoneContacts) {
        let fbMatch = null;
        let matchMethod = null;
        let confidence = 0;

        // Strategy 1: Exact phone number match (highest confidence)
        if (phoneContact.phoneNumber) {
          const normalizedPhone = this.normalizePhoneNumber(phoneContact.phoneNumber);
          fbMatch = facebookByPhone.get(normalizedPhone);
          if (fbMatch) {
            matchMethod = 'phone';
            confidence = 0.95;
          }
        }

        // Strategy 2: Exact email match (high confidence)
        if (!fbMatch && phoneContact.email) {
          fbMatch = facebookByEmail.get(phoneContact.email.toLowerCase());
          if (fbMatch) {
            matchMethod = 'email';
            confidence = 0.90;
          }
        }

        // Strategy 3: Name matching with fuzzy logic (medium confidence)
        if (!fbMatch && phoneContact.name) {
          const phoneContactName = this.normalizeName(phoneContact.name);
          
          // Try exact name match first
          fbMatch = facebookByName.get(phoneContactName);
          if (fbMatch) {
            matchMethod = 'name_exact';
            confidence = 0.75;
          } else {
            // Try fuzzy name matching
            const fuzzyMatch = this.findFuzzyNameMatch(phoneContactName, Array.from(facebookByName.keys()));
            if (fuzzyMatch.score > 0.8) {
              fbMatch = facebookByName.get(fuzzyMatch.name);
              matchMethod = 'name_fuzzy';
              confidence = fuzzyMatch.score * 0.7; // Reduce confidence for fuzzy matches
            }
          }
        }

        // If we found a match, enrich the contact with Facebook data
        if (fbMatch) {
          try {
            const enrichedContact = await this.enrichContactWithFacebookData(
              phoneContact, 
              fbMatch, 
              facebookToken,
              matchMethod,
              confidence
            );
            matchedContacts.push(enrichedContact);
          } catch (enrichmentError) {
            logger.warn('Failed to enrich contact with Facebook data', {
              contactName: phoneContact.name,
              facebookId: fbMatch.id,
              error: enrichmentError.message
            });
            
            // Add contact without enrichment but with match info
            matchedContacts.push({
              ...phoneContact,
              facebookMatch: {
                id: fbMatch.id,
                method: matchMethod,
                confidence: confidence,
                enrichmentFailed: true
              }
            });
          }
        } else {
          // No Facebook match found
          matchedContacts.push({
            ...phoneContact,
            facebookMatch: null
          });
        }
      }

      logger.info('Contact matching completed', {
        totalPhoneContacts: phoneContacts.length,
        matchedContacts: matchedContacts.filter(c => c.facebookMatch).length,
        matchMethods: this.getMatchMethodStats(matchedContacts)
      });

      return matchedContacts;

    } catch (error) {
      logger.error('Contact matching failed', {
        error: error.message,
        phoneContactsCount: phoneContacts?.length,
        facebookContactsCount: facebookContacts?.length
      });
      throw new Error(`Contact matching failed: ${error.message}`);
    }
  }

  /**
   * Enrich phone contact with detailed Facebook profile data
   * @param {Object} phoneContact - Original phone contact
   * @param {Object} facebookContact - Matched Facebook contact
   * @param {string} facebookToken - Access token for detailed profile access
   * @param {string} matchMethod - How the match was found
   * @param {number} confidence - Match confidence score
   * @returns {Object} Enriched contact with Facebook data
   */
  async enrichContactWithFacebookData(phoneContact, facebookContact, facebookToken, matchMethod, confidence) {
    try {
      // Get detailed Facebook profile data
      const axios = require('axios');
      
      const profileResponse = await axios.get(
        `https://graph.facebook.com/v19.0/${facebookContact.id}`,
        {
          params: {
            access_token: facebookToken,
            fields: 'id,name,email,location,hometown,work,education,picture.type(large),cover,about,birthday,interested_in,relationship_status,website'
          }
        }
      );

      const profileData = profileResponse.data;

      // Extract location information for Seattle travel use case
      const locationData = this.extractLocationData(profileData);
      
      // Generate tags from Facebook profile
      const facebookTags = this.generateTagsFromFacebookProfile(profileData);

      // Create enriched contact
      const enrichedContact = {
        // Original phone contact data
        ...phoneContact,
        
        // Facebook match information
        facebookMatch: {
          id: facebookContact.id,
          method: matchMethod,
          confidence: confidence,
          profileUrl: `https://facebook.com/${facebookContact.id}`
        },
        
        // Enriched data from Facebook
        facebookData: {
          name: profileData.name,
          email: profileData.email,
          profilePictureUrl: profileData.picture?.data?.url,
          coverPhotoUrl: profileData.cover?.source,
          about: profileData.about,
          website: profileData.website,
          relationshipStatus: profileData.relationship_status,
          birthday: profileData.birthday,
          interestedIn: profileData.interested_in
        },
        
        // Location data (key for Seattle travel use case)
        locationData: locationData,
        
        // Work information
        workHistory: this.extractWorkHistory(profileData.work),
        
        // Education information
        education: this.extractEducation(profileData.education),
        
        // Auto-generated tags for search
        tags: [
          ...phoneContact.tags || [],
          ...facebookTags
        ],
        
        // Last enriched timestamp
        lastEnriched: new Date().toISOString(),
        enrichmentSource: 'facebook'
      };

      return enrichedContact;

    } catch (error) {
      logger.error('Facebook profile enrichment failed', {
        phoneContactName: phoneContact.name,
        facebookId: facebookContact.id,
        error: error.message,
        errorResponse: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Extract location data from Facebook profile for travel use cases
   * @param {Object} profileData - Facebook profile data
   * @returns {Object} Structured location information
   */
  extractLocationData(profileData) {
    const locationData = {
      currentLocation: null,
      hometown: null,
      cities: [],
      coordinates: null
    };

    // Current location
    if (profileData.location) {
      locationData.currentLocation = {
        name: profileData.location.name,
        id: profileData.location.id
      };
      locationData.cities.push(profileData.location.name);
    }

    // Hometown
    if (profileData.hometown) {
      locationData.hometown = {
        name: profileData.hometown.name,
        id: profileData.hometown.id
      };
      locationData.cities.push(profileData.hometown.name);
    }

    // Extract cities from work history
    if (profileData.work) {
      profileData.work.forEach(work => {
        if (work.location) {
          locationData.cities.push(work.location.name);
        }
      });
    }

    // Remove duplicates and clean up cities array
    locationData.cities = [...new Set(locationData.cities)].filter(city => city);

    return locationData;
  }

  /**
   * Generate searchable tags from Facebook profile
   * @param {Object} profileData - Facebook profile data
   * @returns {Array} Array of tags for search functionality
   */
  generateTagsFromFacebookProfile(profileData) {
    const tags = [];

    // Location tags
    if (profileData.location) {
      tags.push(`location:${this.slugify(profileData.location.name)}`);
      // Extract city from location
      const city = profileData.location.name.split(',')[0].trim();
      tags.push(`city:${this.slugify(city)}`);
    }

    if (profileData.hometown) {
      tags.push(`hometown:${this.slugify(profileData.hometown.name)}`);
    }

    // Work tags
    if (profileData.work && profileData.work.length > 0) {
      profileData.work.forEach(work => {
        if (work.employer) {
          tags.push(`company:${this.slugify(work.employer.name)}`);
        }
        if (work.position) {
          tags.push(`position:${this.slugify(work.position.name)}`);
        }
      });
    }

    // Education tags
    if (profileData.education && profileData.education.length > 0) {
      profileData.education.forEach(edu => {
        if (edu.school) {
          tags.push(`education:${this.slugify(edu.school.name)}`);
        }
        if (edu.type) {
          tags.push(`education-type:${this.slugify(edu.type)}`);
        }
      });
    }

    // Relationship status tags
    if (profileData.relationship_status) {
      tags.push(`relationship:${this.slugify(profileData.relationship_status)}`);
    }

    return tags;
  }

  /**
   * Extract work history from Facebook profile
   * @param {Array} workData - Facebook work data
   * @returns {Array} Structured work history
   */
  extractWorkHistory(workData) {
    if (!workData || !Array.isArray(workData)) return [];

    return workData.map(work => ({
      employer: work.employer?.name,
      position: work.position?.name,
      location: work.location?.name,
      startDate: work.start_date,
      endDate: work.end_date,
      description: work.description
    }));
  }

  /**
   * Extract education from Facebook profile
   * @param {Array} educationData - Facebook education data
   * @returns {Array} Structured education history
   */
  extractEducation(educationData) {
    if (!educationData || !Array.isArray(educationData)) return [];

    return educationData.map(edu => ({
      school: edu.school?.name,
      type: edu.type,
      year: edu.year?.name,
      concentration: edu.concentration?.map(c => c.name),
      degree: edu.degree?.name
    }));
  }

  /**
   * Normalize phone number for matching
   * @param {string} phoneNumber - Phone number to normalize
   * @returns {string} Normalized phone number
   */
  normalizePhoneNumber(phoneNumber) {
    if (!phoneNumber) return '';
    
    // Remove all non-digit characters
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    
    // Handle US numbers - add country code if missing
    if (digitsOnly.length === 10) {
      return `1${digitsOnly}`;
    }
    
    return digitsOnly;
  }

  /**
   * Normalize name for matching
   * @param {string} name - Name to normalize
   * @returns {string} Normalized name
   */
  normalizeName(name) {
    if (!name) return '';
    
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Find fuzzy name match using Levenshtein distance
   * @param {string} targetName - Name to find match for
   * @param {Array} nameList - List of names to search through
   * @returns {Object} Best match with score
   */
  findFuzzyNameMatch(targetName, nameList) {
    let bestMatch = { name: null, score: 0 };
    
    for (const name of nameList) {
      const score = this.calculateNameSimilarity(targetName, name);
      if (score > bestMatch.score) {
        bestMatch = { name, score };
      }
    }
    
    return bestMatch;
  }

  /**
   * Calculate name similarity using simple string comparison
   * @param {string} name1 - First name
   * @param {string} name2 - Second name
   * @returns {number} Similarity score (0-1)
   */
  calculateNameSimilarity(name1, name2) {
    const words1 = name1.split(' ');
    const words2 = name2.split(' ');
    
    let matchCount = 0;
    let totalWords = Math.max(words1.length, words2.length);
    
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1 === word2) {
          matchCount++;
          break;
        }
      }
    }
    
    return matchCount / totalWords;
  }

  /**
   * Convert string to slug format for tags
   * @param {string} text - Text to slugify
   * @returns {string} Slugified text
   */
  slugify(text) {
    if (!text) return '';
    
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
  }

  /**
   * Get statistics about match methods used
   * @param {Array} matchedContacts - Array of matched contacts
   * @returns {Object} Statistics about matching methods
   */
  getMatchMethodStats(matchedContacts) {
    const stats = {};
    
    matchedContacts.forEach(contact => {
      if (contact.facebookMatch) {
        const method = contact.facebookMatch.method;
        stats[method] = (stats[method] || 0) + 1;
      }
    });
    
    return stats;
  }
}

module.exports = new ContactMatchingService();