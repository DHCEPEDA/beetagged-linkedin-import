# BeeTagged Architecture Documentation

## System Overview

**BeeTagged** is a professional contact intelligence platform that transforms phone contacts into searchable professional networks by overlaying Facebook and LinkedIn data.

## Core Mission
Enable contextual contact searches like:
- "Who do I know at Google?"
- "Who do I know in marketing?"
- "Who do I know in Seattle?"

## Technology Stack

### Backend Architecture
- **Framework**: Node.js with Express.js
- **Database**: MongoDB (chosen for flexible social media data structures)
- **Authentication**: OAuth 2.0 (Facebook Graph API, LinkedIn API)
- **Hosting**: Replit with dual-port configuration (3000, 5000)

### Frontend Architecture
- **Framework**: React.js with Webpack
- **Styling**: CSS3 with responsive design
- **Build System**: Webpack with Babel transpilation
- **Mobile**: Capacitor for cross-platform deployment

## Database Design

### MongoDB Schema Choice
**Why MongoDB over SQL:**
- Social media APIs return varied, nested JSON structures
- Facebook/LinkedIn data schemas change frequently
- Need to store unstructured data alongside structured search fields
- Easy horizontal scaling for large contact databases

### Core Collections

#### Contact Model (`server/models/Contact.js`)
```javascript
{
  // Basic contact info
  userId: String,
  name: String,
  phoneNumber: String,
  email: String,
  
  // Raw social media data
  facebookData: Object,
  linkedinData: Object,
  
  // Processed priority data for search
  priorityData: {
    location: { current, hometown, workLocations },
    employment: { current, history },
    education: { schools, degrees, certifications },
    social: { hobbies, interests, skills, connectionCount }
  },
  
  // Generated tags for fast search
  priorityTags: [TagSchema],
  allTags: [TagSchema],
  
  // Gamification data
  tagRankings: Map,
  validationHistory: [Object]
}
```

## Social Media Integration

### Facebook Integration (`server/services/facebook-service.js`)
**OAuth Flow:**
1. Generate authorization URL with required scopes
2. Handle callback and exchange code for access token
3. Retrieve profile data using Graph API

**Data Extracted:**
- Profile: Name, email, location, hometown
- Work: Employer, position, dates, location
- Education: Schools, degrees, years
- Social: Friends, likes, interests
- Network: Friend count (limited to app users)

**Graph API Endpoints:**
- `/me` - Basic profile
- `/me/work` - Employment history
- `/me/education` - Educational background
- `/me/friends` - Social connections
- `/me/likes` - Interests and pages

### LinkedIn Integration (`server/services/linkedin-service.js`)
**OAuth Flow:**
1. Generate authorization URL with professional scopes
2. Handle callback and exchange code for access token
3. Retrieve comprehensive profile using REST API

**Data Extracted:**
- Profile: Name, headline, industry, location
- Positions: Current job, company, work history
- Education: Schools, degrees, certifications
- Skills: Professional skills with endorsements
- Network: Connection count (when available)

**API Endpoints:**
- `/v2/people/~` - Basic profile
- `/v2/people/~/positions` - Work experience
- `/v2/people/~/educations` - Educational background
- `/v2/people/~/skills` - Professional skills

## Data Processing Pipeline

### Priority Data Extraction (`server/services/priority-data-extraction-service.js`)
**"Go Broad Before Deep" Strategy:**
1. Extract 10-20 most valuable fields from social profiles
2. Prioritize immediately searchable data over detailed analysis
3. Generate automated tags for instant search functionality

**Key Fields Extracted:**
- **Location**: Current city, hometown, work locations
- **Employment**: Current employer, job function, work history with tenure
- **Education**: Schools, degrees, certifications with years
- **Social**: Hobbies, interests, skills, professional memberships
- **Network**: Connection counts, relationship indicators

### Contact Enrichment Workflow (`server/routes/contact-enrichment-routes.js`)
**5-Step Process:**
1. **Import**: Accept phone contact lists from mobile devices
2. **Match**: Use Facebook/LinkedIn APIs to find social media profiles
3. **Extract**: Pull priority data (employer, location, job function, etc.)
4. **Tag**: Generate automated searchable tags without manual input
5. **Store**: Save enriched contacts to MongoDB for instant search

## Search Capabilities

### Intelligent Search Engine
**Company Search:** Find contacts by employer
- Query: `priorityData.employment.current.employer`
- Example: "Who works at Microsoft?"

**Professional Function Search:** Find contacts by job title/role
- Query: `priorityData.employment.current.jobFunction`
- Example: "Who's in product management?"

**Location-Based Search:** Find contacts by city/region
- Query: `priorityData.location.current`
- Example: "Who's in Austin?"

**Educational Background Search:** Find contacts by school/university
- Query: `priorityData.education.schools`
- Example: "Who went to Stanford?"

### Search Implementation
- **Indexing**: MongoDB compound indexes on priority fields
- **Tagging**: Automated tag generation for fast text search
- **Ranking**: Contact relevance scoring based on data quality

## API Endpoints

### Contact Enrichment
- `POST /api/contacts/import-and-enrich` - Main enrichment pipeline
- `GET /api/contacts/search/company/:company` - Company search
- `GET /api/contacts/search/location/:location` - Location search
- `GET /api/contacts/search/function/:jobTitle` - Function search

### Social Media Authentication
- `GET /api/linkedin/auth` - Initiate LinkedIn OAuth
- `GET /api/linkedin/callback` - Handle LinkedIn callback
- `POST /api/linkedin/profile` - Get LinkedIn profile data
- `POST /api/linkedin/enrich-contact` - Enrich contact with LinkedIn

### Testing and Validation
- `POST /api/test/facebook-extraction` - Test Facebook data extraction
- `POST /api/test/linkedin-extraction` - Test LinkedIn data extraction
- `GET /api/test/extraction-coverage` - Data coverage report

## Security and Privacy

### OAuth Security
- CSRF protection using state parameters
- Secure token storage and validation
- Proper scope management for data access

### Privacy Considerations
- Respects user privacy settings on both platforms
- Only accesses data with explicit user permission
- Follows Facebook and LinkedIn data use policies
- Implements data retention and deletion policies

## Performance Optimization

### Database Optimization
- Compound indexes on frequently searched fields
- Priority data structure for fast queries
- Tag-based search for text matching

### API Rate Limiting
- Implements proper rate limiting for social media APIs
- Handles token refresh and expiration
- Graceful degradation when APIs are unavailable

### Caching Strategy
- Caches social media data to reduce API calls
- Implements cache invalidation for stale data
- Uses in-memory caching for frequently accessed contacts

## Deployment Architecture

### Replit Configuration
- **Primary Server**: Port 5000 (main application)
- **Secondary Server**: Port 3000 (compatibility)
- **Environment Variables**: Facebook/LinkedIn credentials, MongoDB URI
- **Workflows**: Automated build and deployment pipeline

### Environment Setup
```bash
# Required Environment Variables
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
MONGODB_URI=your_mongodb_connection_string
```

## Development Workflow

### Key Development Principles
1. **Automation Over Manual Input**: Users validate only when automated data is incomplete
2. **Breadth Before Depth**: Capture all available fields before optimizing specific features
3. **Real Data Integration**: Use authentic API data, never mock or placeholder data
4. **Privacy First**: Respect user permissions and platform policies

### Testing Strategy
- Unit tests for data extraction services
- Integration tests for OAuth flows
- End-to-end tests for complete enrichment pipeline
- Performance tests for search functionality

This architecture enables BeeTagged to transform simple phone contacts into a powerful professional networking tool by leveraging the rich data available through social media platforms while maintaining user privacy and system performance.