/**
 * Tag Gamification Service
 * Creates comparative questions to validate and rank tags through user gameplay
 */

const Contact = require('../models/Contact');
const logger = require('../../utils/logger');

class TagGamificationService {
  
  /**
   * Generate comparative questions for tag validation
   * @param {string} userId - User ID
   * @param {Object} options - Generation options
   * @returns {Object} Comparative question with contacts and tag category
   */
  async generateComparativeQuestion(userId, options = {}) {
    try {
      const { 
        category = null,           // Specific tag category to focus on
        excludeValidated = true,   // Skip already validated comparisons
        maxQuestions = 1          // Number of questions to generate
      } = options;

      // Get user's contacts with sufficient social media data
      const contacts = await Contact.find({
        userId: userId,
        $or: [
          { facebookData: { $exists: true, $ne: null } },
          { linkedinData: { $exists: true, $ne: null } }
        ]
      });

      if (contacts.length < 2) {
        return {
          success: false,
          message: 'Need at least 2 enriched contacts to generate questions'
        };
      }

      // Extract all available tag categories from social media data
      const tagCategories = this.extractTagCategories(contacts);
      
      // Select category for this question
      const selectedCategory = category || this.selectRandomCategory(tagCategories);
      
      if (!selectedCategory) {
        return {
          success: false,
          message: 'No suitable tag categories found for comparison'
        };
      }

      // Find contacts with data for this category
      const eligibleContacts = this.findContactsWithCategoryData(contacts, selectedCategory);
      
      if (eligibleContacts.length < 2) {
        return {
          success: false,
          message: `Not enough contacts with ${selectedCategory} data for comparison`
        };
      }

      // Generate the comparative question
      const question = await this.createComparativeQuestion(
        selectedCategory, 
        eligibleContacts, 
        userId,
        excludeValidated
      );

      return {
        success: true,
        question: question
      };

    } catch (error) {
      logger.error('Failed to generate comparative question', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Extract available tag categories from contacts' social media data
   * @param {Array} contacts - User's contacts
   * @returns {Array} Available tag categories
   */
  extractTagCategories(contacts) {
    const categories = new Set();

    contacts.forEach(contact => {
      // Location categories
      if (contact.locationData?.currentLocation || contact.location) {
        categories.add('location_knowledge');
      }

      // Professional categories
      if (contact.workHistory?.length > 0 || contact.company) {
        categories.add('professional_experience');
        categories.add('industry_expertise');
      }

      // Skills from LinkedIn or extracted from work
      if (contact.skills?.length > 0) {
        contact.skills.forEach(skill => {
          categories.add(`skill_${skill.toLowerCase().replace(/\s+/g, '_')}`);
        });
      }

      // Education categories
      if (contact.education?.length > 0) {
        categories.add('education_background');
      }

      // Interest categories from Facebook
      if (contact.facebookData?.interests?.length > 0) {
        contact.facebookData.interests.forEach(interest => {
          categories.add(`interest_${interest.toLowerCase().replace(/\s+/g, '_')}`);
        });
      }

      // Gaming/hobby categories
      if (contact.tags?.some(tag => tag.includes('poker'))) {
        categories.add('poker_skill');
      }
      if (contact.tags?.some(tag => tag.includes('programming'))) {
        categories.add('programming_experience');
      }
    });

    return Array.from(categories);
  }

  /**
   * Create a comparative question for tag validation
   * @param {string} category - Tag category
   * @param {Array} contacts - Eligible contacts
   * @param {string} userId - User ID
   * @param {boolean} excludeValidated - Skip validated comparisons
   * @returns {Object} Comparative question
   */
  async createComparativeQuestion(category, contacts, userId, excludeValidated) {
    // Randomly select two contacts for comparison
    const shuffled = contacts.sort(() => 0.5 - Math.random());
    const contactA = shuffled[0];
    const contactB = shuffled[1];

    // Check if this comparison has already been validated
    if (excludeValidated) {
      const existingComparison = await this.checkExistingComparison(
        userId, 
        category, 
        contactA._id, 
        contactB._id
      );
      
      if (existingComparison) {
        // Try with different contacts
        if (contacts.length > 2) {
          const remainingContacts = contacts.filter(c => 
            c._id.toString() !== contactA._id.toString() && 
            c._id.toString() !== contactB._id.toString()
          );
          if (remainingContacts.length > 0) {
            return this.createComparativeQuestion(
              category, 
              [contactA, remainingContacts[0]], 
              userId, 
              excludeValidated
            );
          }
        }
      }
    }

    // Generate question text based on category
    const questionText = this.generateQuestionText(category, contactA, contactB);
    
    // Extract relevant data for each contact
    const contactAData = this.extractRelevantData(contactA, category);
    const contactBData = this.extractRelevantData(contactB, category);

    return {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      category: category,
      questionText: questionText,
      contacts: [
        {
          id: contactA._id,
          name: contactA.name,
          profilePictureUrl: contactA.profilePictureUrl || contactA.facebookData?.profilePictureUrl,
          relevantData: contactAData
        },
        {
          id: contactB._id,
          name: contactB.name,
          profilePictureUrl: contactB.profilePictureUrl || contactB.facebookData?.profilePictureUrl,
          relevantData: contactBData
        }
      ],
      createdAt: new Date(),
      userId: userId
    };
  }

  /**
   * Generate human-readable question text
   * @param {string} category - Tag category
   * @param {Object} contactA - First contact
   * @param {Object} contactB - Second contact
   * @returns {string} Question text
   */
  generateQuestionText(category, contactA, contactB) {
    const questionTemplates = {
      'poker_skill': `Who is better at poker - ${contactA.name} or ${contactB.name}?`,
      'programming_experience': `Who has more programming experience - ${contactA.name} or ${contactB.name}?`,
      'location_knowledge': `Who knows ${this.extractLocationForQuestion(contactA, contactB)} better - ${contactA.name} or ${contactB.name}?`,
      'professional_experience': `Who has more experience in ${this.extractIndustryForQuestion(contactA, contactB)} - ${contactA.name} or ${contactB.name}?`,
      'industry_expertise': `Who is more knowledgeable about ${this.extractIndustryForQuestion(contactA, contactB)} - ${contactA.name} or ${contactB.name}?`,
      'education_background': `Who has a stronger educational background - ${contactA.name} or ${contactB.name}?`
    };

    // Handle skill-specific questions
    if (category.startsWith('skill_')) {
      const skill = category.replace('skill_', '').replace(/_/g, ' ');
      return `Who is better at ${skill} - ${contactA.name} or ${contactB.name}?`;
    }

    // Handle interest-specific questions
    if (category.startsWith('interest_')) {
      const interest = category.replace('interest_', '').replace(/_/g, ' ');
      return `Who is more into ${interest} - ${contactA.name} or ${contactB.name}?`;
    }

    return questionTemplates[category] || `Who would you choose for ${category.replace(/_/g, ' ')} - ${contactA.name} or ${contactB.name}?`;
  }

  /**
   * Extract relevant data for display in the question
   * @param {Object} contact - Contact object
   * @param {string} category - Tag category
   * @returns {Object} Relevant data for the category
   */
  extractRelevantData(contact, category) {
    const data = {};

    switch (category) {
      case 'location_knowledge':
        data.currentLocation = contact.locationData?.currentLocation?.name || contact.location;
        data.hometown = contact.locationData?.hometown?.name;
        data.workLocations = contact.workHistory?.map(w => w.location).filter(l => l);
        break;

      case 'professional_experience':
        data.currentJob = contact.workHistory?.[0];
        data.totalWorkExperience = contact.workHistory?.length || 0;
        data.companies = contact.workHistory?.map(w => w.employer).filter(e => e);
        break;

      case 'programming_experience':
        data.programmingSkills = contact.skills?.filter(s => 
          s.toLowerCase().includes('programming') ||
          s.toLowerCase().includes('coding') ||
          s.toLowerCase().includes('javascript') ||
          s.toLowerCase().includes('python') ||
          s.toLowerCase().includes('java')
        );
        data.techCompanies = contact.workHistory?.filter(w => 
          w.employer && (
            w.employer.toLowerCase().includes('tech') ||
            w.employer.toLowerCase().includes('software') ||
            w.employer.toLowerCase().includes('engineering')
          )
        );
        break;

      case 'education_background':
        data.education = contact.education;
        data.degrees = contact.education?.map(e => e.degree).filter(d => d);
        data.schools = contact.education?.map(e => e.school).filter(s => s);
        break;

      default:
        // For skill or interest categories
        if (category.startsWith('skill_')) {
          const skillName = category.replace('skill_', '').replace(/_/g, ' ');
          data.hasSkill = contact.skills?.some(s => 
            s.toLowerCase().includes(skillName.toLowerCase())
          );
          data.relatedWork = contact.workHistory?.filter(w => 
            w.position && w.position.toLowerCase().includes(skillName.toLowerCase())
          );
        }
        break;
    }

    return data;
  }

  /**
   * Process user's answer to a comparative question
   * @param {string} userId - User ID
   * @param {string} questionId - Question ID
   * @param {string} selectedContactId - ID of selected contact
   * @param {string} category - Tag category
   * @returns {Object} Result of processing the answer
   */
  async processComparativeAnswer(userId, questionId, selectedContactId, category) {
    try {
      // Store the user's validation in database
      const validation = {
        userId: userId,
        questionId: questionId,
        selectedContactId: selectedContactId,
        category: category,
        answeredAt: new Date()
      };

      // Update tag rankings based on the answer
      await this.updateTagRankings(userId, selectedContactId, category, 'win');
      
      // Find the other contact in the comparison and update their ranking
      const question = await this.getQuestionById(questionId);
      if (question) {
        const otherContactId = question.contacts.find(c => 
          c.id.toString() !== selectedContactId.toString()
        )?.id;
        
        if (otherContactId) {
          await this.updateTagRankings(userId, otherContactId, category, 'loss');
        }
      }

      // Calculate user's gamification score
      const userScore = await this.calculateUserGamificationScore(userId);

      logger.info('Comparative answer processed', {
        userId,
        questionId,
        selectedContactId,
        category,
        newUserScore: userScore
      });

      return {
        success: true,
        message: 'Answer processed successfully',
        userScore: userScore,
        validation: validation
      };

    } catch (error) {
      logger.error('Failed to process comparative answer', {
        userId,
        questionId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Update tag rankings for a contact based on comparative validation
   * @param {string} userId - User ID
   * @param {string} contactId - Contact ID
   * @param {string} category - Tag category
   * @param {string} result - 'win' or 'loss'
   */
  async updateTagRankings(userId, contactId, category, result) {
    const scoreChange = result === 'win' ? 1 : -0.5;
    
    await Contact.findOneAndUpdate(
      { _id: contactId, userId: userId },
      {
        $inc: { [`tagRankings.${category}`]: scoreChange },
        $set: { lastTagUpdate: new Date() }
      },
      { upsert: true }
    );
  }

  /**
   * Get personalized search rankings based on validated tags
   * @param {string} userId - User ID
   * @param {string} category - Tag category to search
   * @param {Array} contacts - Contacts to rank
   * @returns {Array} Ranked contacts
   */
  async getPersonalizedRankings(userId, category, contacts) {
    // Sort contacts by their validated tag rankings for this category
    return contacts.sort((a, b) => {
      const aRanking = a.tagRankings?.[category] || 0;
      const bRanking = b.tagRankings?.[category] || 0;
      return bRanking - aRanking; // Higher ranking first
    });
  }

  /**
   * Calculate user's overall gamification score
   * @param {string} userId - User ID
   * @returns {number} User's gamification score
   */
  async calculateUserGamificationScore(userId) {
    // This would query a UserValidations collection in a real implementation
    // For now, we'll calculate based on contact tag rankings
    const contacts = await Contact.find({ userId: userId });
    
    let totalValidations = 0;
    contacts.forEach(contact => {
      if (contact.tagRankings) {
        totalValidations += Object.keys(contact.tagRankings).length;
      }
    });

    return totalValidations * 10; // 10 points per validation
  }

  /**
   * Find contacts with data for specific category
   * @param {Array} contacts - All contacts
   * @param {string} category - Category to check
   * @returns {Array} Contacts with relevant data
   */
  findContactsWithCategoryData(contacts, category) {
    return contacts.filter(contact => {
      switch (category) {
        case 'location_knowledge':
          return contact.locationData || contact.location;
        case 'professional_experience':
          return contact.workHistory?.length > 0 || contact.company;
        case 'programming_experience':
          return contact.skills?.some(s => 
            s.toLowerCase().includes('programming') ||
            s.toLowerCase().includes('coding') ||
            ['javascript', 'python', 'java', 'react', 'node'].some(tech => 
              s.toLowerCase().includes(tech)
            )
          );
        case 'poker_skill':
          return contact.tags?.some(tag => tag.toLowerCase().includes('poker'));
        default:
          return true;
      }
    });
  }

  /**
   * Select random category for question generation
   * @param {Array} categories - Available categories
   * @returns {string} Selected category
   */
  selectRandomCategory(categories) {
    if (categories.length === 0) return null;
    
    // Prioritize certain categories for better user engagement
    const priorityCategories = [
      'poker_skill',
      'programming_experience', 
      'location_knowledge',
      'professional_experience'
    ];
    
    const availablePriority = categories.filter(c => priorityCategories.includes(c));
    
    if (availablePriority.length > 0) {
      return availablePriority[Math.floor(Math.random() * availablePriority.length)];
    }
    
    return categories[Math.floor(Math.random() * categories.length)];
  }

  /**
   * Extract location for question text
   * @param {Object} contactA - First contact
   * @param {Object} contactB - Second contact
   * @returns {string} Location name
   */
  extractLocationForQuestion(contactA, contactB) {
    // Find common location or use the most specific one
    const locationA = contactA.locationData?.currentLocation?.name || contactA.location;
    const locationB = contactB.locationData?.currentLocation?.name || contactB.location;
    
    if (locationA && locationB) {
      // Extract city from full location string
      const cityA = locationA.split(',')[0].trim();
      const cityB = locationB.split(',')[0].trim();
      
      if (cityA === cityB) return cityA;
      return `${cityA}/${cityB}`;
    }
    
    return locationA || locationB || 'their area';
  }

  /**
   * Extract industry for question text
   * @param {Object} contactA - First contact
   * @param {Object} contactB - Second contact
   * @returns {string} Industry name
   */
  extractIndustryForQuestion(contactA, contactB) {
    const industryA = contactA.workHistory?.[0]?.employer || contactA.company;
    const industryB = contactB.workHistory?.[0]?.employer || contactB.company;
    
    if (industryA && industryB) {
      // Try to find common industry keywords
      const commonTerms = ['tech', 'finance', 'marketing', 'sales', 'engineering'];
      for (const term of commonTerms) {
        if (industryA.toLowerCase().includes(term) && industryB.toLowerCase().includes(term)) {
          return term;
        }
      }
    }
    
    return industryA || industryB || 'their field';
  }

  /**
   * Check if comparison already exists
   * @param {string} userId - User ID
   * @param {string} category - Category
   * @param {string} contactAId - First contact ID
   * @param {string} contactBId - Second contact ID
   * @returns {boolean} Whether comparison exists
   */
  async checkExistingComparison(userId, category, contactAId, contactBId) {
    // In a real implementation, this would check a UserValidations collection
    // For MVP, we'll skip this check and allow repeat questions
    return false;
  }

  /**
   * Get question by ID (placeholder for MVP)
   * @param {string} questionId - Question ID
   * @returns {Object} Question object
   */
  async getQuestionById(questionId) {
    // In a real implementation, this would fetch from a Questions collection
    // For MVP, we'll return null
    return null;
  }
}

module.exports = new TagGamificationService();