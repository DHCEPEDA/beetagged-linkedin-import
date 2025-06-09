/**
 * AI-Powered Tag Suggestion Service - Intelligent Profile Analysis Engine
 * 
 * HIGH-LEVEL FUNCTION: Uses OpenAI to analyze contact profiles and generate
 * intelligent, contextual tags that improve search relevance and discoverability
 * 
 * CORE CAPABILITIES:
 * 1. PROFILE ANALYSIS: Deep understanding of professional background and interests
 * 2. CONTEXTUAL TAGGING: Generates tags based on industry patterns and career paths
 * 3. SKILL INFERENCE: Identifies implied skills from job titles and experience
 * 4. RELATIONSHIP MAPPING: Suggests connection types and networking potential
 * 5. SEARCH OPTIMIZATION: Creates tags that enhance search query matching
 * 
 * AI INTEGRATION STRATEGY:
 * - Uses GPT-4o for advanced text analysis and pattern recognition
 * - Processes both structured data (job titles, companies) and unstructured (bio, interests)
 * - Generates tags in standardized categories for consistent search
 * - Learns from existing successful tag patterns
 * 
 * TAG CATEGORIES GENERATED:
 * - Professional: Job functions, industries, seniority levels
 * - Skills: Technical skills, soft skills, domain expertise
 * - Geographic: Work locations, regional networks
 * - Educational: Alumni networks, degree programs
 * - Interest-based: Hobbies, causes, professional interests
 * - Network-value: Referral potential, industry connections
 */

const OpenAI = require('openai');
const logger = require('../../utils/logger');

class AITagSuggestionService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    if (!process.env.OPENAI_API_KEY) {
      logger.warn('OpenAI API key not configured - AI tag suggestions disabled');
    }
  }

  /**
   * Generate AI-powered tag suggestions for a contact profile
   * @param {Object} contactData - Complete contact data with social media profiles
   * @returns {Object} Suggested tags with confidence scores and explanations
   */
  async generateTagSuggestions(contactData) {
    try {
      if (!process.env.OPENAI_API_KEY) {
        logger.warn('OpenAI not configured, returning empty suggestions');
        return {
          suggestedTags: [],
          confidence: 0,
          explanation: 'AI analysis not available - OpenAI key not configured'
        };
      }

      // Extract relevant profile information for analysis
      const profileSummary = this.buildProfileSummary(contactData);
      
      // Generate AI analysis prompt
      const analysisPrompt = this.buildAnalysisPrompt(profileSummary);
      
      // Get AI suggestions using GPT-4o
      const aiResponse = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: this.getSystemPrompt()
          },
          {
            role: "user",
            content: analysisPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3, // Lower temperature for more consistent tagging
        max_tokens: 1500
      });

      const aiAnalysis = JSON.parse(aiResponse.choices[0].message.content);
      
      // Process and validate AI suggestions
      const processedSuggestions = this.processAISuggestions(aiAnalysis, contactData);
      
      logger.info('AI tag suggestions generated successfully', {
        contactName: contactData.name,
        suggestedTagCount: processedSuggestions.suggestedTags.length,
        confidence: processedSuggestions.confidence
      });

      return processedSuggestions;

    } catch (error) {
      logger.error('AI tag suggestion generation failed', {
        contactName: contactData.name,
        error: error.message
      });
      
      // Fallback to basic suggestions if AI fails
      return this.generateFallbackSuggestions(contactData);
    }
  }

  /**
   * Build comprehensive profile summary for AI analysis
   * @param {Object} contactData - Contact data with social media profiles
   * @returns {Object} Structured profile summary
   */
  buildProfileSummary(contactData) {
    const summary = {
      basicInfo: {
        name: contactData.name,
        location: contactData.priorityData?.location?.current || contactData.locationData?.city,
        hometown: contactData.priorityData?.location?.hometown
      },
      employment: {
        currentEmployer: contactData.priorityData?.employment?.current?.employer,
        currentRole: contactData.priorityData?.employment?.current?.jobFunction,
        workHistory: contactData.priorityData?.employment?.history || [],
        linkedinHeadline: contactData.linkedinData?.headline,
        facebookWork: contactData.facebookData?.work?.data || []
      },
      education: {
        schools: contactData.priorityData?.education?.schools || [],
        degrees: contactData.priorityData?.education?.degrees || [],
        certifications: contactData.priorityData?.education?.certifications || []
      },
      skills: {
        linkedinSkills: contactData.linkedinData?.skills?.values || [],
        interests: contactData.priorityData?.social?.interests || [],
        hobbies: contactData.priorityData?.social?.hobbies || []
      },
      social: {
        facebookLikes: contactData.facebookData?.likes?.data || [],
        linkedinSummary: contactData.linkedinData?.summary,
        connectionCounts: contactData.priorityData?.social?.connectionCount || {}
      },
      existingTags: contactData.allTags || contactData.tags || []
    };

    return summary;
  }

  /**
   * Build analysis prompt for OpenAI
   * @param {Object} profileSummary - Structured profile data
   * @returns {string} Formatted prompt for AI analysis
   */
  buildAnalysisPrompt(profileSummary) {
    return `Analyze this professional contact profile and suggest intelligent tags for networking and search:

CONTACT PROFILE:
Name: ${profileSummary.basicInfo.name}
Location: ${profileSummary.basicInfo.location || 'Not specified'}
Current Role: ${profileSummary.employment.currentRole || 'Not specified'}
Current Company: ${profileSummary.employment.currentEmployer || 'Not specified'}
LinkedIn Headline: ${profileSummary.employment.linkedinHeadline || 'Not specified'}

WORK HISTORY:
${profileSummary.employment.workHistory.map(job => 
  `- ${job.jobFunction} at ${job.employer} (${job.startYear}-${job.endYear || 'present'})`
).join('\n') || 'No work history available'}

EDUCATION:
${profileSummary.education.schools.map(school => 
  `- ${school.name} (${school.type || 'School'})`
).join('\n') || 'No education data available'}

SKILLS & INTERESTS:
${profileSummary.skills.linkedinSkills.map(skill => 
  `- ${skill.skill?.name} (${skill.endorsements?.total || 0} endorsements)`
).join('\n') || 'No skills data available'}

EXISTING TAGS: ${profileSummary.existingTags.map(tag => tag.name || tag).join(', ') || 'None'}

Based on this profile, suggest relevant tags that would help users find this contact for:
1. Professional networking (job referrals, business opportunities)
2. Industry connections (finding experts in specific fields)
3. Geographic networking (local connections, travel contacts)
4. Skill-based searches (technical expertise, domain knowledge)
5. Educational networks (alumni connections, academic backgrounds)

Focus on actionable tags that enable queries like "Who do I know at [Company]?", "Who knows [Skill]?", "Who's in [Industry]?"`;
  }

  /**
   * Get system prompt for AI tag generation
   * @returns {string} System prompt
   */
  getSystemPrompt() {
    return `You are an expert professional networking analyst. Your job is to analyze contact profiles and suggest intelligent tags that make contacts discoverable for networking opportunities.

TAGGING PRINCIPLES:
1. Generate tags that enable useful searches ("Who works at Google?", "Who knows React?")
2. Focus on professional value (job referrals, business connections, expertise)
3. Include industry-standard terms and variations
4. Consider career progression and implied skills
5. Add geographic and educational networking tags
6. Suggest relationship types (mentor potential, peer connection, etc.)

TAG CATEGORIES TO GENERATE:
- Companies: Current and previous employers, variations of company names
- Roles: Job titles, functions, seniority levels (junior, senior, director, etc.)
- Industries: Specific industries and related sectors
- Skills: Technical skills, soft skills, domain expertise
- Locations: Cities, regions, countries for work and education
- Education: Universities, degree programs, alumni networks
- Networking Value: Connection types, referral potential, expertise areas

OUTPUT FORMAT: Respond with JSON containing:
{
  "suggestedTags": [
    {
      "name": "tag_name",
      "category": "professional|skill|location|education|industry|networking",
      "confidence": 0.1-1.0,
      "reasoning": "why this tag is valuable for networking"
    }
  ],
  "overallConfidence": 0.1-1.0,
  "analysisNotes": "key insights about this profile's networking value",
  "searchQueries": ["example queries this profile would match"]
}

Generate 15-25 high-quality tags. Prioritize tags that multiple users would find valuable for professional networking.`;
  }

  /**
   * Process and validate AI suggestions
   * @param {Object} aiAnalysis - Raw AI response
   * @param {Object} contactData - Original contact data
   * @returns {Object} Processed suggestions
   */
  processAISuggestions(aiAnalysis, contactData) {
    try {
      const processedTags = [];
      
      // Validate and clean each suggested tag
      if (aiAnalysis.suggestedTags && Array.isArray(aiAnalysis.suggestedTags)) {
        for (const tag of aiAnalysis.suggestedTags) {
          if (tag.name && tag.category && tag.confidence) {
            processedTags.push({
              name: this.cleanTagName(tag.name),
              category: tag.category,
              confidence: Math.min(1.0, Math.max(0.1, tag.confidence)),
              reasoning: tag.reasoning || 'AI-generated suggestion',
              source: 'ai_analysis',
              createdAt: new Date()
            });
          }
        }
      }

      // Remove duplicates and sort by confidence
      const uniqueTags = this.removeDuplicateTags(processedTags);
      const sortedTags = uniqueTags.sort((a, b) => b.confidence - a.confidence);

      return {
        suggestedTags: sortedTags.slice(0, 20), // Limit to top 20 suggestions
        confidence: aiAnalysis.overallConfidence || 0.7,
        analysisNotes: aiAnalysis.analysisNotes || 'AI analysis completed',
        searchQueries: aiAnalysis.searchQueries || [],
        aiModel: 'gpt-4o',
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Failed to process AI suggestions', {
        error: error.message
      });
      
      return this.generateFallbackSuggestions(contactData);
    }
  }

  /**
   * Generate fallback suggestions when AI analysis fails
   * @param {Object} contactData - Contact data
   * @returns {Object} Basic tag suggestions
   */
  generateFallbackSuggestions(contactData) {
    const fallbackTags = [];
    
    // Add basic company tags
    if (contactData.priorityData?.employment?.current?.employer) {
      fallbackTags.push({
        name: contactData.priorityData.employment.current.employer,
        category: 'professional',
        confidence: 0.9,
        reasoning: 'Current employer',
        source: 'fallback'
      });
    }

    // Add basic location tags
    if (contactData.priorityData?.location?.current) {
      fallbackTags.push({
        name: contactData.priorityData.location.current,
        category: 'location',
        confidence: 0.8,
        reasoning: 'Current location',
        source: 'fallback'
      });
    }

    // Add basic function tags
    if (contactData.priorityData?.employment?.current?.jobFunction) {
      fallbackTags.push({
        name: contactData.priorityData.employment.current.jobFunction,
        category: 'professional',
        confidence: 0.8,
        reasoning: 'Current job function',
        source: 'fallback'
      });
    }

    return {
      suggestedTags: fallbackTags,
      confidence: 0.5,
      analysisNotes: 'Fallback suggestions - AI analysis not available',
      searchQueries: [],
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Clean and standardize tag names
   * @param {string} tagName - Raw tag name
   * @returns {string} Cleaned tag name
   */
  cleanTagName(tagName) {
    return tagName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
      .replace(/\s+/g, ' ') // Normalize whitespace
      .slice(0, 50); // Limit length
  }

  /**
   * Remove duplicate tags based on name similarity
   * @param {Array} tags - Array of tag objects
   * @returns {Array} Deduplicated tags
   */
  removeDuplicateTags(tags) {
    const seen = new Set();
    return tags.filter(tag => {
      const normalizedName = tag.name.toLowerCase().replace(/\s+/g, '');
      if (seen.has(normalizedName)) {
        return false;
      }
      seen.add(normalizedName);
      return true;
    });
  }

  /**
   * Batch generate tag suggestions for multiple contacts
   * @param {Array} contacts - Array of contact objects
   * @returns {Array} Array of suggestion results
   */
  async batchGenerateTagSuggestions(contacts) {
    const results = [];
    
    // Process in batches to respect API rate limits
    const batchSize = 5;
    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize);
      
      const batchPromises = batch.map(contact => 
        this.generateTagSuggestions(contact).catch(error => ({
          contactId: contact._id,
          error: error.message,
          suggestedTags: []
        }))
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Rate limiting delay
      if (i + batchSize < contacts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }
}

module.exports = new AITagSuggestionService();