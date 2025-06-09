/**
 * Data Extraction Test Routes
 * Test endpoints to validate broad data extraction from Facebook and LinkedIn
 */

const express = require('express');
const router = express.Router();
const priorityDataExtractionService = require('../services/priority-data-extraction-service');
const authService = require('../services/auth-service');
const logger = require('../../utils/logger');

/**
 * Test Facebook data extraction breadth
 * POST /api/test/facebook-extraction
 */
router.post('/facebook-extraction', async (req, res) => {
  try {
    const { facebookToken, testContactData } = req.body;

    if (!facebookToken) {
      return res.status(400).json({
        success: false,
        message: 'Facebook token required for testing'
      });
    }

    // Test with sample Facebook data structure
    const mockFacebookData = testContactData || {
      id: "test123",
      name: "Test User",
      email: "test@example.com",
      location: { name: "Austin, TX" },
      hometown: { name: "Houston, TX" },
      work: [
        {
          employer: { name: "Google" },
          position: { name: "Software Engineer" },
          start_date: "2022-01-01",
          location: { name: "Mountain View, CA" }
        },
        {
          employer: { name: "Microsoft" },
          position: { name: "Junior Developer" },
          start_date: "2020-06-01",
          end_date: "2021-12-31",
          location: { name: "Seattle, WA" }
        }
      ],
      education: [
        {
          school: { name: "University of Texas" },
          degree: { name: "Bachelor of Science" },
          concentration: [{ name: "Computer Science" }],
          year: { name: "2020" }
        }
      ],
      interests: {
        data: [
          { name: "Programming", category: "technology" },
          { name: "Basketball", category: "sports" },
          { name: "Travel", category: "lifestyle" }
        ]
      }
    };

    // Extract priority data
    const priorityData = priorityDataExtractionService.extractPriorityFields({
      facebookData: mockFacebookData
    });

    // Generate searchable tags
    const tags = priorityDataExtractionService.generateSearchableTags(priorityData);

    res.json({
      success: true,
      message: 'Facebook data extraction test completed',
      data: {
        extractedFields: {
          location: priorityData.location,
          employment: priorityData.employment,
          education: priorityData.education,
          social: priorityData.social
        },
        generatedTags: tags,
        fieldCoverage: {
          hasCurrentLocation: !!priorityData.location.current,
          hasHometown: !!priorityData.location.hometown,
          hasCurrentEmployer: !!priorityData.employment.current.employer,
          hasJobFunction: !!priorityData.employment.current.jobFunction,
          hasEducation: priorityData.education.schools.length > 0,
          hasInterests: priorityData.social.interests.length > 0,
          hasWorkHistory: priorityData.employment.history.length > 0
        },
        rawFacebookData: mockFacebookData
      }
    });

  } catch (error) {
    logger.error('Facebook extraction test failed', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Facebook extraction test failed',
      error: error.message
    });
  }
});

/**
 * Test LinkedIn data extraction breadth
 * POST /api/test/linkedin-extraction
 */
router.post('/linkedin-extraction', async (req, res) => {
  try {
    const { linkedinToken, testContactData } = req.body;

    if (!linkedinToken) {
      return res.status(400).json({
        success: false,
        message: 'LinkedIn token required for testing'
      });
    }

    // Test with sample LinkedIn data structure
    const mockLinkedInData = testContactData || {
      id: "test456",
      firstName: "Test",
      lastName: "Professional",
      localizedFirstName: "Test",
      localizedLastName: "Professional",
      location: { name: "San Francisco, CA" },
      industry: "Technology",
      numConnections: 500,
      positions: {
        values: [
          {
            title: "Senior Product Manager",
            company: { name: "Meta" },
            isCurrent: true,
            startDate: { year: 2023, month: 3 },
            summary: "Leading product development for social platforms"
          },
          {
            title: "Product Manager",
            company: { name: "Uber" },
            startDate: { year: 2021, month: 1 },
            endDate: { year: 2023, month: 2 },
            summary: "Managed ride-sharing product features"
          }
        ]
      },
      educations: {
        values: [
          {
            schoolName: "Stanford University",
            degree: "MBA",
            fieldOfStudy: "Business Administration",
            startDate: { year: 2019 },
            endDate: { year: 2021 }
          },
          {
            schoolName: "UC Berkeley",
            degree: "Bachelor of Science",
            fieldOfStudy: "Engineering",
            startDate: { year: 2015 },
            endDate: { year: 2019 }
          }
        ]
      },
      skills: {
        values: [
          {
            skill: { name: "Product Management" },
            endorsements: { total: 45 }
          },
          {
            skill: { name: "Strategy" },
            endorsements: { total: 32 }
          },
          {
            skill: { name: "Analytics" },
            endorsements: { total: 28 }
          }
        ]
      },
      certifications: {
        values: [
          {
            name: "Certified Product Manager",
            authority: { name: "Product Management Institute" },
            startDate: { year: 2022 }
          }
        ]
      }
    };

    // Extract priority data
    const priorityData = priorityDataExtractionService.extractPriorityFields({
      linkedinData: mockLinkedInData
    });

    // Generate searchable tags
    const tags = priorityDataExtractionService.generateSearchableTags(priorityData);

    res.json({
      success: true,
      message: 'LinkedIn data extraction test completed',
      data: {
        extractedFields: {
          location: priorityData.location,
          employment: priorityData.employment,
          education: priorityData.education,
          social: priorityData.social
        },
        generatedTags: tags,
        fieldCoverage: {
          hasCurrentLocation: !!priorityData.location.current,
          hasCurrentEmployer: !!priorityData.employment.current.employer,
          hasJobFunction: !!priorityData.employment.current.jobFunction,
          hasEducation: priorityData.education.schools.length > 0,
          hasCertifications: priorityData.education.certifications.length > 0,
          hasSkills: priorityData.social.interests.filter(i => i.category === 'professional_skill').length > 0,
          hasWorkHistory: priorityData.employment.history.length > 0,
          hasConnectionCount: priorityData.social.connectionCount.linkedin > 0
        },
        rawLinkedInData: mockLinkedInData
      }
    });

  } catch (error) {
    logger.error('LinkedIn extraction test failed', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'LinkedIn extraction test failed',
      error: error.message
    });
  }
});

/**
 * Test combined platform data extraction
 * POST /api/test/combined-extraction
 */
router.post('/combined-extraction', async (req, res) => {
  try {
    const { facebookData, linkedinData } = req.body;

    if (!facebookData && !linkedinData) {
      return res.status(400).json({
        success: false,
        message: 'Either Facebook or LinkedIn data required for testing'
      });
    }

    // Create combined contact data
    const combinedContactData = {
      name: "Test Combined User",
      facebookData: facebookData,
      linkedinData: linkedinData
    };

    // Extract priority data from both platforms
    const priorityData = priorityDataExtractionService.extractPriorityFields(combinedContactData);

    // Generate comprehensive tags
    const tags = priorityDataExtractionService.generateSearchableTags(priorityData);

    // Analyze data overlap and conflicts
    const dataAnalysis = this.analyzeDataOverlap(priorityData, facebookData, linkedinData);

    res.json({
      success: true,
      message: 'Combined platform extraction test completed',
      data: {
        extractedFields: priorityData,
        generatedTags: tags,
        dataAnalysis: dataAnalysis,
        searchCapabilities: {
          canSearchByCompany: !!priorityData.employment.current.employer,
          canSearchByFunction: !!priorityData.employment.current.jobFunction,
          canSearchByLocation: !!priorityData.location.current,
          canSearchBySchool: priorityData.education.schools.length > 0,
          canSearchBySkills: priorityData.social.interests.length > 0,
          totalSearchableTags: tags.length
        }
      }
    });

  } catch (error) {
    logger.error('Combined extraction test failed', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Combined extraction test failed',
      error: error.message
    });
  }
});

/**
 * Get data extraction coverage report
 * GET /api/test/extraction-coverage
 */
router.get('/extraction-coverage', async (req, res) => {
  try {
    const coverageReport = {
      facebook: {
        priorityFields: [
          'Current Location',
          'Hometown', 
          'Current Employer',
          'Job Function',
          'Work History',
          'Education',
          'Interests',
          'Friend Count'
        ],
        availableFields: [
          'location', 'hometown', 'work', 'education', 'interests',
          'likes', 'groups', 'relationship_status', 'birthday',
          'about', 'website', 'friends'
        ],
        limitations: [
          'Friends list limited to mutual friends who use the app',
          'Some fields require additional permissions',
          'Privacy settings may restrict data access'
        ]
      },
      linkedin: {
        priorityFields: [
          'Current Position',
          'Job Title',
          'Company',
          'Work History',
          'Skills & Endorsements',
          'Education',
          'Certifications',
          'Connection Count',
          'Industry'
        ],
        availableFields: [
          'positions', 'educations', 'skills', 'certifications',
          'location', 'industry', 'numConnections', 'headline',
          'summary', 'publicProfileUrl'
        ],
        limitations: [
          'Connections API requires partnership status',
          'Some fields require specific OAuth scopes',
          'Rate limiting on API requests'
        ]
      },
      searchCapabilities: {
        companySearch: 'Who do I know at [Company]?',
        functionSearch: 'Who do I know in [Job Function]?',
        locationSearch: 'Who do I know in [City]?',
        schoolSearch: 'Who went to [University]?',
        skillSearch: 'Who knows [Skill/Technology]?',
        industrySearch: 'Who works in [Industry]?'
      }
    };

    res.json({
      success: true,
      message: 'Data extraction coverage report',
      data: coverageReport
    });

  } catch (error) {
    logger.error('Failed to generate coverage report', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to generate coverage report',
      error: error.message
    });
  }
});

/**
 * Analyze data overlap between platforms
 * @param {Object} priorityData - Extracted priority data
 * @param {Object} facebookData - Facebook raw data
 * @param {Object} linkedinData - LinkedIn raw data
 * @returns {Object} Data analysis
 */
function analyzeDataOverlap(priorityData, facebookData, linkedinData) {
  const analysis = {
    overlappingFields: [],
    conflictingData: [],
    platformStrengths: {
      facebook: [],
      linkedin: []
    },
    dataQuality: {
      facebook: 0,
      linkedin: 0,
      combined: 0
    }
  };

  // Check for overlapping location data
  if (priorityData.location.current) {
    if (facebookData?.location && linkedinData?.location) {
      analysis.overlappingFields.push('location');
      if (facebookData.location.name !== linkedinData.location.name) {
        analysis.conflictingData.push({
          field: 'location',
          facebook: facebookData.location.name,
          linkedin: linkedinData.location.name
        });
      }
    }
  }

  // Analyze platform strengths
  if (facebookData) {
    analysis.platformStrengths.facebook = [
      'Social interests and hobbies',
      'Personal relationships and hometown',
      'Groups and memberships',
      'Lifestyle preferences'
    ];
  }

  if (linkedinData) {
    analysis.platformStrengths.linkedin = [
      'Professional experience and skills',
      'Education and certifications', 
      'Industry connections',
      'Career progression'
    ];
  }

  // Calculate data quality scores (simplified)
  if (facebookData) {
    analysis.dataQuality.facebook = Object.keys(facebookData).length * 10;
  }
  
  if (linkedinData) {
    analysis.dataQuality.linkedin = Object.keys(linkedinData).length * 10;
  }

  analysis.dataQuality.combined = Math.max(
    analysis.dataQuality.facebook,
    analysis.dataQuality.linkedin
  );

  return analysis;
}

module.exports = router;