/**
 * Priority Data Extraction Service
 * Focuses on the 10-20 most important fields for BeeTagged search functionality
 */

const logger = require('../../utils/logger');

class PriorityDataExtractionService {

  /**
   * Extract priority data fields from social media profiles
   * @param {Object} contactData - Contact with social media data
   * @returns {Object} Structured priority data
   */
  extractPriorityFields(contactData) {
    const priorityData = {
      // Core location data
      location: {
        current: null,
        hometown: null,
        workLocations: []
      },
      
      // Employment data (current and historical)
      employment: {
        current: {
          employer: null,
          jobFunction: null,
          startYear: null,
          tenure: null
        },
        history: []
      },
      
      // Education data
      education: {
        schools: [],
        degrees: [],
        certifications: []
      },
      
      // Social and interest data
      social: {
        hobbies: [],
        interests: [],
        topicsLiked: [],
        memberships: [],
        connectionCount: {
          facebook: 0,
          linkedin: 0
        }
      }
    };

    // Extract Facebook data
    if (contactData.facebookData) {
      this.extractFacebookPriorityData(contactData.facebookData, priorityData);
    }

    // Extract LinkedIn data
    if (contactData.linkedinData) {
      this.extractLinkedInPriorityData(contactData.linkedinData, priorityData);
    }

    // Extract from work history if available
    if (contactData.workHistory) {
      this.processWorkHistory(contactData.workHistory, priorityData);
    }

    // Extract from education if available
    if (contactData.education) {
      this.processEducation(contactData.education, priorityData);
    }

    return priorityData;
  }

  /**
   * Extract priority data from Facebook profile
   * @param {Object} facebookData - Facebook profile data
   * @param {Object} priorityData - Priority data object to populate
   */
  extractFacebookPriorityData(facebookData, priorityData) {
    // 1. Current Location
    if (facebookData.location?.name) {
      priorityData.location.current = facebookData.location.name;
    }

    // 2. Hometown
    if (facebookData.hometown?.name) {
      priorityData.location.hometown = facebookData.hometown.name;
    }

    // 3. Current Employer & Job Function
    if (facebookData.work && Array.isArray(facebookData.work)) {
      const currentJob = facebookData.work.find(job => !job.end_date) || facebookData.work[0];
      
      if (currentJob) {
        if (currentJob.employer?.name) {
          priorityData.employment.current.employer = currentJob.employer.name;
        }
        if (currentJob.position?.name) {
          priorityData.employment.current.jobFunction = currentJob.position.name;
        }
        if (currentJob.start_date) {
          priorityData.employment.current.startYear = this.extractYear(currentJob.start_date);
          priorityData.employment.current.tenure = this.calculateTenure(currentJob.start_date, currentJob.end_date);
        }
        if (currentJob.location?.name) {
          priorityData.location.workLocations.push(currentJob.location.name);
        }
      }

      // 4. Ex-employers and Ex-job functions with years
      facebookData.work.forEach((job, index) => {
        if (index > 0 || job.end_date) { // Skip current job unless it has end date
          const historyEntry = {
            employer: job.employer?.name,
            jobFunction: job.position?.name,
            startYear: this.extractYear(job.start_date),
            endYear: this.extractYear(job.end_date),
            location: job.location?.name
          };
          
          if (historyEntry.employer || historyEntry.jobFunction) {
            priorityData.employment.history.push(historyEntry);
          }
          
          if (job.location?.name && !priorityData.location.workLocations.includes(job.location.name)) {
            priorityData.location.workLocations.push(job.location.name);
          }
        }
      });
    }

    // 5. Education & Degrees
    if (facebookData.education && Array.isArray(facebookData.education)) {
      facebookData.education.forEach(edu => {
        if (edu.school?.name) {
          priorityData.education.schools.push({
            name: edu.school.name,
            type: edu.type,
            year: edu.year?.name
          });
        }
        
        if (edu.degree?.name) {
          priorityData.education.degrees.push({
            degree: edu.degree.name,
            school: edu.school?.name,
            year: edu.year?.name
          });
        }
        
        if (edu.concentration && Array.isArray(edu.concentration)) {
          edu.concentration.forEach(conc => {
            if (conc.name) {
              priorityData.education.degrees.push({
                field: conc.name,
                school: edu.school?.name,
                year: edu.year?.name
              });
            }
          });
        }
      });
    }

    // 6. Hobbies & Interests
    if (facebookData.interests?.data && Array.isArray(facebookData.interests.data)) {
      facebookData.interests.data.forEach(interest => {
        if (interest.name) {
          priorityData.social.interests.push({
            name: interest.name,
            category: interest.category || 'interest',
            source: 'facebook'
          });
        }
      });
    }

    // 7. Topics Liked (from likes)
    if (facebookData.likes?.data && Array.isArray(facebookData.likes.data)) {
      facebookData.likes.data.forEach(like => {
        if (like.name) {
          priorityData.social.topicsLiked.push({
            name: like.name,
            category: like.category,
            source: 'facebook'
          });
        }
      });
    }

    // 8. Groups/Memberships
    if (facebookData.groups?.data && Array.isArray(facebookData.groups.data)) {
      facebookData.groups.data.forEach(group => {
        if (group.name) {
          priorityData.social.memberships.push({
            name: group.name,
            type: 'facebook_group',
            source: 'facebook'
          });
        }
      });
    }

    // 9. Number of Facebook Friends
    if (facebookData.friends?.summary?.total_count) {
      priorityData.social.connectionCount.facebook = facebookData.friends.summary.total_count;
    } else if (facebookData.mutual_friends) {
      // Estimate based on mutual friends (rough approximation)
      priorityData.social.connectionCount.facebook = facebookData.mutual_friends * 20;
    }
  }

  /**
   * Extract priority data from LinkedIn profile
   * @param {Object} linkedinData - LinkedIn profile data
   * @param {Object} priorityData - Priority data object to populate
   */
  extractLinkedInPriorityData(linkedinData, priorityData) {
    // 1. Current Location
    if (linkedinData.location?.name) {
      priorityData.location.current = linkedinData.location.name;
    }

    // 2. Current Employer & Job Function (from positions)
    if (linkedinData.positions?.values && Array.isArray(linkedinData.positions.values)) {
      const currentPosition = linkedinData.positions.values.find(pos => pos.isCurrent) || 
                             linkedinData.positions.values[0];
      
      if (currentPosition) {
        if (currentPosition.company?.name) {
          priorityData.employment.current.employer = currentPosition.company.name;
        }
        if (currentPosition.title) {
          priorityData.employment.current.jobFunction = currentPosition.title;
        }
        if (currentPosition.startDate) {
          priorityData.employment.current.startYear = currentPosition.startDate.year;
          priorityData.employment.current.tenure = this.calculateLinkedInTenure(
            currentPosition.startDate, 
            currentPosition.endDate
          );
        }
      }

      // 3. Ex-employers and Ex-job functions with years
      linkedinData.positions.values.forEach((position, index) => {
        if (index > 0 || position.endDate) { // Skip current unless ended
          const historyEntry = {
            employer: position.company?.name,
            jobFunction: position.title,
            startYear: position.startDate?.year,
            endYear: position.endDate?.year,
            description: position.summary
          };
          
          if (historyEntry.employer || historyEntry.jobFunction) {
            priorityData.employment.history.push(historyEntry);
          }
        }
      });
    }

    // 4. Skills (professional capabilities)
    if (linkedinData.skills?.values && Array.isArray(linkedinData.skills.values)) {
      linkedinData.skills.values.forEach(skill => {
        if (skill.skill?.name) {
          priorityData.social.interests.push({
            name: skill.skill.name,
            category: 'professional_skill',
            endorsements: skill.endorsements?.total || 0,
            source: 'linkedin'
          });
        }
      });
    }

    // 5. Education & Degrees
    if (linkedinData.educations?.values && Array.isArray(linkedinData.educations.values)) {
      linkedinData.educations.values.forEach(edu => {
        if (edu.schoolName) {
          priorityData.education.schools.push({
            name: edu.schoolName,
            type: 'university',
            startYear: edu.startDate?.year,
            endYear: edu.endDate?.year
          });
        }
        
        if (edu.degree) {
          priorityData.education.degrees.push({
            degree: edu.degree,
            school: edu.schoolName,
            field: edu.fieldOfStudy,
            year: edu.endDate?.year
          });
        }
      });
    }

    // 6. Certifications
    if (linkedinData.certifications?.values && Array.isArray(linkedinData.certifications.values)) {
      linkedinData.certifications.values.forEach(cert => {
        if (cert.name) {
          priorityData.education.certifications.push({
            name: cert.name,
            authority: cert.authority?.name,
            year: cert.startDate?.year,
            source: 'linkedin'
          });
        }
      });
    }

    // 7. Number of LinkedIn Connections
    if (linkedinData.numConnections) {
      priorityData.social.connectionCount.linkedin = linkedinData.numConnections;
    }

    // 8. Industry (as interest/specialization)
    if (linkedinData.industry) {
      priorityData.social.interests.push({
        name: linkedinData.industry,
        category: 'industry',
        source: 'linkedin'
      });
    }
  }

  /**
   * Process work history data
   * @param {Array} workHistory - Work history array
   * @param {Object} priorityData - Priority data object
   */
  processWorkHistory(workHistory, priorityData) {
    if (!workHistory || !Array.isArray(workHistory)) return;

    workHistory.forEach((job, index) => {
      if (index === 0 && !priorityData.employment.current.employer) {
        // First entry as current if not set
        priorityData.employment.current.employer = job.employer;
        priorityData.employment.current.jobFunction = job.position;
        priorityData.employment.current.startYear = this.extractYear(job.startDate);
        priorityData.employment.current.tenure = this.calculateTenure(job.startDate, job.endDate);
      } else {
        // Add to history
        priorityData.employment.history.push({
          employer: job.employer,
          jobFunction: job.position,
          startYear: this.extractYear(job.startDate),
          endYear: this.extractYear(job.endDate),
          location: job.location
        });
      }

      // Add work location
      if (job.location && !priorityData.location.workLocations.includes(job.location)) {
        priorityData.location.workLocations.push(job.location);
      }
    });
  }

  /**
   * Process education data
   * @param {Array} education - Education array
   * @param {Object} priorityData - Priority data object
   */
  processEducation(education, priorityData) {
    if (!education || !Array.isArray(education)) return;

    education.forEach(edu => {
      if (edu.school) {
        priorityData.education.schools.push({
          name: edu.school,
          type: edu.type,
          year: edu.year
        });
      }

      if (edu.degree) {
        priorityData.education.degrees.push({
          degree: edu.degree,
          school: edu.school,
          field: edu.concentration?.[0],
          year: edu.year
        });
      }
    });
  }

  /**
   * Generate searchable tags from priority data
   * @param {Object} priorityData - Extracted priority data
   * @returns {Array} Searchable tags
   */
  generateSearchableTags(priorityData) {
    const tags = [];

    // Location tags
    if (priorityData.location.current) {
      tags.push({
        value: priorityData.location.current,
        category: 'location',
        type: 'current_location',
        confidence: 0.9,
        priority: 'high'
      });
    }

    if (priorityData.location.hometown) {
      tags.push({
        value: priorityData.location.hometown,
        category: 'location', 
        type: 'hometown',
        confidence: 0.8,
        priority: 'high'
      });
    }

    // Current employment tags
    if (priorityData.employment.current.employer) {
      tags.push({
        value: priorityData.employment.current.employer,
        category: 'professional',
        type: 'current_employer',
        confidence: 0.95,
        priority: 'high',
        metadata: {
          tenure: priorityData.employment.current.tenure,
          startYear: priorityData.employment.current.startYear
        }
      });
    }

    if (priorityData.employment.current.jobFunction) {
      tags.push({
        value: priorityData.employment.current.jobFunction,
        category: 'professional',
        type: 'current_job_function',
        confidence: 0.95,
        priority: 'high'
      });
    }

    // Employment history tags
    priorityData.employment.history.forEach(job => {
      if (job.employer) {
        tags.push({
          value: job.employer,
          category: 'professional',
          type: 'previous_employer',
          confidence: 0.85,
          priority: 'medium',
          metadata: {
            startYear: job.startYear,
            endYear: job.endYear,
            jobFunction: job.jobFunction
          }
        });
      }

      if (job.jobFunction) {
        tags.push({
          value: job.jobFunction,
          category: 'professional',
          type: 'previous_job_function', 
          confidence: 0.85,
          priority: 'medium'
        });
      }
    });

    // Education tags
    priorityData.education.schools.forEach(school => {
      tags.push({
        value: school.name,
        category: 'education',
        type: 'school',
        confidence: 0.9,
        priority: 'high',
        metadata: { year: school.year }
      });
    });

    priorityData.education.degrees.forEach(degree => {
      tags.push({
        value: degree.degree,
        category: 'education',
        type: 'degree',
        confidence: 0.9,
        priority: 'high',
        metadata: { 
          school: degree.school,
          field: degree.field,
          year: degree.year
        }
      });
    });

    // Certification tags
    priorityData.education.certifications.forEach(cert => {
      tags.push({
        value: cert.name,
        category: 'skills',
        type: 'certification',
        confidence: 0.85,
        priority: 'medium',
        metadata: { authority: cert.authority }
      });
    });

    // Interest and hobby tags
    priorityData.social.interests.forEach(interest => {
      tags.push({
        value: interest.name,
        category: interest.category === 'professional_skill' ? 'skills' : 'interests',
        type: interest.category,
        confidence: 0.7,
        priority: 'medium',
        metadata: { 
          source: interest.source,
          endorsements: interest.endorsements
        }
      });
    });

    // Topics liked tags
    priorityData.social.topicsLiked.forEach(topic => {
      tags.push({
        value: topic.name,
        category: 'interests',
        type: 'topic_liked',
        confidence: 0.6,
        priority: 'low'
      });
    });

    // Membership tags
    priorityData.social.memberships.forEach(membership => {
      tags.push({
        value: membership.name,
        category: 'social',
        type: 'membership',
        confidence: 0.7,
        priority: 'medium'
      });
    });

    // Connection count tags (for social proof)
    if (priorityData.social.connectionCount.facebook > 0) {
      tags.push({
        value: `${priorityData.social.connectionCount.facebook}_facebook_friends`,
        category: 'social',
        type: 'social_proof',
        confidence: 1.0,
        priority: 'low'
      });
    }

    if (priorityData.social.connectionCount.linkedin > 0) {
      tags.push({
        value: `${priorityData.social.connectionCount.linkedin}_linkedin_connections`,
        category: 'social',
        type: 'social_proof',
        confidence: 1.0,
        priority: 'low'
      });
    }

    return tags;
  }

  /**
   * Extract year from date string or object
   * @param {string|Object} date - Date string or object
   * @returns {number} Year or null
   */
  extractYear(date) {
    if (!date) return null;
    
    if (typeof date === 'string') {
      const match = date.match(/\d{4}/);
      return match ? parseInt(match[0]) : null;
    }
    
    if (typeof date === 'object' && date.year) {
      return date.year;
    }
    
    return null;
  }

  /**
   * Calculate tenure from start and end dates
   * @param {string} startDate - Start date
   * @param {string} endDate - End date (null for current)
   * @returns {string} Tenure description
   */
  calculateTenure(startDate, endDate) {
    if (!startDate) return null;
    
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    const years = Math.floor((end - start) / (365.25 * 24 * 60 * 60 * 1000));
    const months = Math.floor(((end - start) % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));
    
    if (years > 0) {
      return months > 0 ? `${years}y ${months}m` : `${years}y`;
    } else if (months > 0) {
      return `${months}m`;
    } else {
      return '< 1m';
    }
  }

  /**
   * Calculate tenure from LinkedIn date objects
   * @param {Object} startDate - LinkedIn start date object
   * @param {Object} endDate - LinkedIn end date object
   * @returns {string} Tenure description
   */
  calculateLinkedInTenure(startDate, endDate) {
    if (!startDate) return null;
    
    const start = new Date(startDate.year, (startDate.month || 1) - 1);
    const end = endDate ? new Date(endDate.year, (endDate.month || 12) - 1) : new Date();
    
    return this.calculateTenure(start.toISOString(), endDate ? end.toISOString() : null);
  }
}

module.exports = new PriorityDataExtractionService();