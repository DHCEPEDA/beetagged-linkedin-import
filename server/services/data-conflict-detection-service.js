/**
 * Data Conflict Detection Service - Gamified Data Validation Engine
 * 
 * HIGH-LEVEL FUNCTION: Detects discrepancies between Facebook and LinkedIn data
 * to create gamified validation opportunities that improve data accuracy
 * 
 * CORE CAPABILITIES:
 * 1. CONFLICT DETECTION: Identifies inconsistencies between FB and LinkedIn profiles
 * 2. VALIDATION GAMES: Creates "Which is correct?" challenges for users
 * 3. SOURCE TRACKING: Labels all data with FB/LinkedIn source attribution
 * 4. CONFIDENCE SCORING: Assigns reliability scores to conflicting data points
 * 5. USER LEARNING: Tracks validation patterns to improve future suggestions
 * 
 * GAMIFICATION STRATEGY:
 * - Present conflicts as simple choice questions: "John works at Google (LinkedIn) or Meta (Facebook)?"
 * - Reward users for resolving conflicts with improved search accuracy
 * - Use validation history to build user expertise scores
 * - Create "data detective" achievements for frequent validators
 * 
 * CONFLICT TYPES DETECTED:
 * - Employment: Different current employers or job titles
 * - Location: Conflicting current cities or work locations  
 * - Education: Different schools or graduation years
 * - Timeline: Inconsistent employment start/end dates
 * - Personal: Conflicting relationship status, interests, etc.
 */

const logger = require('../../utils/logger');

class DataConflictDetectionService {
  constructor() {
    this.conflictTypes = {
      EMPLOYMENT_COMPANY: 'employment_company',
      EMPLOYMENT_TITLE: 'employment_title', 
      EMPLOYMENT_DATES: 'employment_dates',
      LOCATION_CURRENT: 'location_current',
      LOCATION_HOMETOWN: 'location_hometown',
      EDUCATION_SCHOOL: 'education_school',
      EDUCATION_DEGREE: 'education_degree',
      EDUCATION_YEAR: 'education_year',
      PERSONAL_STATUS: 'personal_status',
      CONTACT_INFO: 'contact_info'
    };
  }

  /**
   * Detect all conflicts between Facebook and LinkedIn data
   * @param {Object} facebookData - Complete Facebook profile
   * @param {Object} linkedinData - Complete LinkedIn profile
   * @param {string} contactName - Contact name for context
   * @returns {Array} Array of detected conflicts
   */
  detectAllConflicts(facebookData, linkedinData, contactName = 'Contact') {
    const conflicts = [];

    // Employment conflicts
    conflicts.push(...this.detectEmploymentConflicts(facebookData, linkedinData, contactName));
    
    // Location conflicts
    conflicts.push(...this.detectLocationConflicts(facebookData, linkedinData, contactName));
    
    // Education conflicts
    conflicts.push(...this.detectEducationConflicts(facebookData, linkedinData, contactName));
    
    // Personal information conflicts
    conflicts.push(...this.detectPersonalConflicts(facebookData, linkedinData, contactName));

    // Sort by priority (most important conflicts first)
    return this.prioritizeConflicts(conflicts);
  }

  /**
   * Detect employment-related conflicts
   * @param {Object} facebookData - Facebook profile data
   * @param {Object} linkedinData - LinkedIn profile data
   * @param {string} contactName - Contact name
   * @returns {Array} Employment conflicts
   */
  detectEmploymentConflicts(facebookData, linkedinData, contactName) {
    const conflicts = [];

    // Get current employment from both sources
    const fbCurrentJob = this.extractCurrentEmployment(facebookData);
    const liCurrentJob = this.extractCurrentEmployment(linkedinData);

    // Compare current employer
    if (fbCurrentJob.employer && liCurrentJob.employer && 
        !this.isSimilarCompanyName(fbCurrentJob.employer, liCurrentJob.employer)) {
      conflicts.push({
        type: this.conflictTypes.EMPLOYMENT_COMPANY,
        field: 'current_employer',
        question: `Where does ${contactName} currently work?`,
        options: [
          {
            value: fbCurrentJob.employer,
            source: 'facebook',
            confidence: 0.7,
            context: fbCurrentJob.title ? `as ${fbCurrentJob.title}` : ''
          },
          {
            value: liCurrentJob.employer,
            source: 'linkedin',
            confidence: 0.8, // LinkedIn typically more accurate for professional data
            context: liCurrentJob.title ? `as ${liCurrentJob.title}` : ''
          }
        ],
        priority: 'high',
        category: 'professional',
        validationReward: 10
      });
    }

    // Compare current job title
    if (fbCurrentJob.title && liCurrentJob.title && 
        !this.isSimilarJobTitle(fbCurrentJob.title, liCurrentJob.title)) {
      conflicts.push({
        type: this.conflictTypes.EMPLOYMENT_TITLE,
        field: 'current_title',
        question: `What is ${contactName}'s current job title?`,
        options: [
          {
            value: fbCurrentJob.title,
            source: 'facebook',
            confidence: 0.6,
            context: fbCurrentJob.employer ? `at ${fbCurrentJob.employer}` : ''
          },
          {
            value: liCurrentJob.title,
            source: 'linkedin',
            confidence: 0.9, // LinkedIn very reliable for job titles
            context: liCurrentJob.employer ? `at ${liCurrentJob.employer}` : ''
          }
        ],
        priority: 'high',
        category: 'professional',
        validationReward: 8
      });
    }

    return conflicts;
  }

  /**
   * Detect location-related conflicts
   * @param {Object} facebookData - Facebook profile data
   * @param {Object} linkedinData - LinkedIn profile data
   * @param {string} contactName - Contact name
   * @returns {Array} Location conflicts
   */
  detectLocationConflicts(facebookData, linkedinData, contactName) {
    const conflicts = [];

    const fbLocation = facebookData.location?.name;
    const liLocation = linkedinData.location?.name;

    // Compare current location
    if (fbLocation && liLocation && !this.isSimilarLocation(fbLocation, liLocation)) {
      conflicts.push({
        type: this.conflictTypes.LOCATION_CURRENT,
        field: 'current_location',
        question: `Where is ${contactName} currently located?`,
        options: [
          {
            value: fbLocation,
            source: 'facebook',
            confidence: 0.8, // Facebook good for personal location
            context: 'Personal profile location'
          },
          {
            value: liLocation,
            source: 'linkedin',
            confidence: 0.7, // LinkedIn might be work location
            context: 'Professional profile location'
          }
        ],
        priority: 'medium',
        category: 'location',
        validationReward: 5
      });
    }

    // Compare hometown (if available)
    const fbHometown = facebookData.hometown?.name;
    if (fbHometown && liLocation && !this.isSimilarLocation(fbHometown, liLocation)) {
      conflicts.push({
        type: this.conflictTypes.LOCATION_HOMETOWN,
        field: 'hometown_vs_current',
        question: `Is ${contactName} originally from ${fbHometown} but now in ${liLocation}?`,
        options: [
          {
            value: `Originally from ${fbHometown}, now in ${liLocation}`,
            source: 'both',
            confidence: 0.8,
            context: 'Combined Facebook hometown + LinkedIn current'
          },
          {
            value: `Lives in ${fbHometown}`,
            source: 'facebook',
            confidence: 0.6,
            context: 'Facebook location only'
          }
        ],
        priority: 'low',
        category: 'location',
        validationReward: 3
      });
    }

    return conflicts;
  }

  /**
   * Detect education-related conflicts
   * @param {Object} facebookData - Facebook profile data
   * @param {Object} linkedinData - LinkedIn profile data
   * @param {string} contactName - Contact name
   * @returns {Array} Education conflicts
   */
  detectEducationConflicts(facebookData, linkedinData, contactName) {
    const conflicts = [];

    const fbEducation = facebookData.education?.data || [];
    const liEducation = linkedinData.educations?.values || [];

    // Find conflicting schools
    const fbSchools = fbEducation.map(edu => edu.school?.name).filter(Boolean);
    const liSchools = liEducation.map(edu => edu.schoolName).filter(Boolean);

    // Check for different schools listed
    if (fbSchools.length > 0 && liSchools.length > 0) {
      const uniqueFbSchools = fbSchools.filter(school => 
        !liSchools.some(liSchool => this.isSimilarSchoolName(school, liSchool))
      );

      if (uniqueFbSchools.length > 0) {
        conflicts.push({
          type: this.conflictTypes.EDUCATION_SCHOOL,
          field: 'education_schools',
          question: `Which schools did ${contactName} attend?`,
          options: [
            {
              value: fbSchools.join(', '),
              source: 'facebook',
              confidence: 0.7,
              context: 'Facebook education history'
            },
            {
              value: liSchools.join(', '),
              source: 'linkedin',
              confidence: 0.8,
              context: 'LinkedIn education history'
            },
            {
              value: [...new Set([...fbSchools, ...liSchools])].join(', '),
              source: 'both',
              confidence: 0.9,
              context: 'Combined education from both sources'
            }
          ],
          priority: 'medium',
          category: 'education',
          validationReward: 6
        });
      }
    }

    return conflicts;
  }

  /**
   * Detect personal information conflicts
   * @param {Object} facebookData - Facebook profile data
   * @param {Object} linkedinData - LinkedIn profile data
   * @param {string} contactName - Contact name
   * @returns {Array} Personal conflicts
   */
  detectPersonalConflicts(facebookData, linkedinData, contactName) {
    const conflicts = [];

    // Name variations
    const fbName = `${facebookData.first_name || ''} ${facebookData.last_name || ''}`.trim();
    const liName = `${linkedinData.localizedFirstName || linkedinData.firstName || ''} ${linkedinData.localizedLastName || linkedinData.lastName || ''}`.trim();

    if (fbName && liName && fbName !== liName && !this.isSimilarName(fbName, liName)) {
      conflicts.push({
        type: this.conflictTypes.CONTACT_INFO,
        field: 'full_name',
        question: `What is the correct name for this contact?`,
        options: [
          {
            value: fbName,
            source: 'facebook',
            confidence: 0.8,
            context: 'Personal social profile'
          },
          {
            value: liName,
            source: 'linkedin',
            confidence: 0.9,
            context: 'Professional profile'
          }
        ],
        priority: 'high',
        category: 'personal',
        validationReward: 12
      });
    }

    return conflicts;
  }

  /**
   * Extract current employment from Facebook data
   * @param {Object} facebookData - Facebook profile data
   * @returns {Object} Current employment info
   */
  extractCurrentEmployment(facebookData) {
    if (!facebookData.work?.data) return {};
    
    const currentJob = facebookData.work.data.find(job => !job.end_date) || facebookData.work.data[0];
    return {
      employer: currentJob?.employer?.name,
      title: currentJob?.position?.name
    };
  }

  /**
   * Check if company names are similar (accounting for variations)
   * @param {string} name1 - First company name
   * @param {string} name2 - Second company name
   * @returns {boolean} Whether names are similar
   */
  isSimilarCompanyName(name1, name2) {
    if (!name1 || !name2) return false;
    
    const normalize = (name) => name.toLowerCase()
      .replace(/\b(inc|llc|corp|corporation|company|co|ltd|limited)\b/g, '')
      .replace(/[^\w\s]/g, '')
      .trim();
    
    const norm1 = normalize(name1);
    const norm2 = normalize(name2);
    
    return norm1 === norm2 || 
           norm1.includes(norm2) || 
           norm2.includes(norm1) ||
           this.calculateSimilarity(norm1, norm2) > 0.8;
  }

  /**
   * Check if job titles are similar
   * @param {string} title1 - First job title
   * @param {string} title2 - Second job title
   * @returns {boolean} Whether titles are similar
   */
  isSimilarJobTitle(title1, title2) {
    if (!title1 || !title2) return false;
    
    const normalize = (title) => title.toLowerCase()
      .replace(/\b(senior|sr|junior|jr|lead|principal|staff)\b/g, '')
      .replace(/[^\w\s]/g, '')
      .trim();
    
    return this.calculateSimilarity(normalize(title1), normalize(title2)) > 0.7;
  }

  /**
   * Check if locations are similar
   * @param {string} loc1 - First location
   * @param {string} loc2 - Second location
   * @returns {boolean} Whether locations are similar
   */
  isSimilarLocation(loc1, loc2) {
    if (!loc1 || !loc2) return false;
    
    const normalize = (loc) => loc.toLowerCase()
      .replace(/\b(city|county|state|province|country)\b/g, '')
      .replace(/[,.-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    const norm1 = normalize(loc1);
    const norm2 = normalize(loc2);
    
    return norm1.includes(norm2) || 
           norm2.includes(norm1) ||
           this.calculateSimilarity(norm1, norm2) > 0.6;
  }

  /**
   * Check if school names are similar
   * @param {string} school1 - First school name
   * @param {string} school2 - Second school name
   * @returns {boolean} Whether school names are similar
   */
  isSimilarSchoolName(school1, school2) {
    if (!school1 || !school2) return false;
    
    const normalize = (name) => name.toLowerCase()
      .replace(/\b(university|college|school|institute|academy)\b/g, '')
      .replace(/\b(of|the|and|&)\b/g, '')
      .replace(/[^\w\s]/g, '')
      .trim();
    
    return this.calculateSimilarity(normalize(school1), normalize(school2)) > 0.7;
  }

  /**
   * Check if names are similar (accounting for nicknames, middle names)
   * @param {string} name1 - First name
   * @param {string} name2 - Second name
   * @returns {boolean} Whether names are similar
   */
  isSimilarName(name1, name2) {
    if (!name1 || !name2) return false;
    
    const parts1 = name1.toLowerCase().split(/\s+/);
    const parts2 = name2.toLowerCase().split(/\s+/);
    
    // Check if first and last names match
    return parts1[0] === parts2[0] && 
           parts1[parts1.length - 1] === parts2[parts2.length - 1];
  }

  /**
   * Calculate string similarity using Levenshtein distance
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Similarity score (0-1)
   */
  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Edit distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Prioritize conflicts by importance for user validation
   * @param {Array} conflicts - Array of conflict objects
   * @returns {Array} Sorted conflicts by priority
   */
  prioritizeConflicts(conflicts) {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    
    return conflicts.sort((a, b) => {
      // Sort by priority first
      const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by validation reward
      return (b.validationReward || 0) - (a.validationReward || 0);
    });
  }

  /**
   * Generate gamification question for a conflict
   * @param {Object} conflict - Conflict object
   * @returns {Object} Formatted validation question
   */
  generateValidationQuestion(conflict) {
    return {
      id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'multiple_choice',
      question: conflict.question,
      options: conflict.options.map((option, index) => ({
        id: index,
        text: option.value,
        source: option.source,
        confidence: option.confidence,
        context: option.context,
        sourceLabel: option.source === 'facebook' ? 'FB' : 
                    option.source === 'linkedin' ? 'LI' : 
                    option.source === 'both' ? 'FB+LI' : option.source.toUpperCase()
      })),
      category: conflict.category,
      difficulty: conflict.priority === 'high' ? 'easy' : 
                 conflict.priority === 'medium' ? 'medium' : 'hard',
      points: conflict.validationReward,
      explanation: `This helps improve search accuracy for queries like "Who works at [company]?" or "Who's in [location]?"`
    };
  }
}

module.exports = new DataConflictDetectionService();