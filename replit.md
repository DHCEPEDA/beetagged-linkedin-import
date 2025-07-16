# BeeTagged - Professional Contact Intelligence Platform

## Overview

BeeTagged is a professional contact intelligence platform that transforms phone contacts into searchable professional networks by overlaying Facebook and LinkedIn data. The application enables contextual contact searches like "Who do I know at Google?", "Who do I know in marketing?", and "Who do I know in Seattle?".

## System Architecture

### Backend Architecture
- **Framework**: Node.js with Express.js
- **Runtime Environment**: Replit with dual-port configuration (ports 3000 and 5000)
- **Database**: MongoDB Atlas for flexible social media data structures
- **Authentication**: OAuth 2.0 for Facebook Graph API and LinkedIn API integration
- **AI Integration**: OpenAI GPT-4 for intelligent tag generation and profile analysis

### Frontend Architecture
- **Framework**: React.js 18 with modern hooks and context API
- **Build System**: Webpack with Babel transpilation for ES6+ and JSX support
- **Styling**: CSS3 with CSS variables and responsive design patterns
- **Routing**: React Router DOM for single-page application navigation
- **Mobile Support**: Capacitor framework for cross-platform mobile deployment

### Database Design
- **Primary Database**: MongoDB chosen for handling varied, nested JSON structures from social media APIs
- **Schema Flexibility**: Accommodates frequently changing Facebook/LinkedIn data schemas
- **Collections**: Users, Contacts, Tags, and Social Integration data with embedded document patterns

## Key Components

### Contact Management System
- **Phone Contact Import**: Automated import from device contact lists
- **Social Media Matching**: Intelligent algorithms to match contacts with Facebook and LinkedIn profiles
- **Data Enrichment**: Automatic extraction of professional context (employer, job function, location, education)

### AI-Powered Tag System
- **Automated Tagging**: GPT-4 powered analysis generates contextual tags without manual input
- **Tag Categories**: Company, location, job function, industry, education, skills
- **Conflict Detection**: Cross-platform data validation and discrepancy identification
- **Quality Assurance**: Gamified validation system for improving tag accuracy

### Search Engine
- **Natural Language Processing**: Contextual search understanding ("traveling to Seattle" → location-based results)
- **Multi-dimensional Search**: Company, role, location, education, and skill-based queries
- **Intelligent Ranking**: PageRank-style algorithm based on relevance and user behavior patterns

### Social Integration Services
- **Facebook Service**: Comprehensive profile data extraction with privacy compliance
- **LinkedIn Service**: Professional data focus with rate-limited API usage
- **OAuth Flow**: Secure authentication and authorization handling

## Data Flow

1. **Contact Import**: Users import phone contacts or connect social media accounts
2. **Profile Matching**: System matches contacts with Facebook/LinkedIn profiles using multiple algorithms
3. **Data Extraction**: Comprehensive profile data extraction including work history, education, location
4. **AI Analysis**: OpenAI processes extracted data to generate intelligent, categorized tags
5. **Search Indexing**: Processed data is indexed for fast, contextual search capabilities
6. **User Interaction**: Real-time search with natural language processing and ranked results

## External Dependencies

### Social Media APIs
- **Facebook Graph API**: Profile data, friends list, work history, education background
- **LinkedIn API**: Professional profiles, connections, company information, skills

### AI and Analytics
- **OpenAI GPT-4**: Tag generation, profile analysis, conflict detection
- **Natural Language Processing**: Search query understanding and intent detection

### Infrastructure Services
- **MongoDB Atlas**: Cloud database with global distribution
- **Replit Hosting**: Development and deployment platform with built-in CI/CD
- **Capacitor**: Mobile app deployment for iOS and Android platforms

## Deployment Strategy

### Development Environment
- **Platform**: Replit with hot-reload capabilities
- **Dual-port Setup**: Port 5000 for main server, port 3000 for client development
- **Environment Variables**: Secure handling of API keys and database credentials

### Production Considerations
- **Heroku Ready**: Configured for Heroku deployment with `Procfile` and `app.json`
- **Development Environment**: Internal Heroku instance for troubleshooting and testing
- **Public Integration**: Squarespace widget code for embedding on customer-facing site
- **Mobile Deployment**: Android Studio project structure ready for Google Play Store

### Security Measures
- **JWT Authentication**: Secure token-based user sessions
- **Environment Variable Protection**: Sensitive credentials stored securely
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Social Auth Compliance**: OAuth 2.0 best practices implementation

## Recent Changes
- **July 16, 2025**: DEPLOYED TO HEROKU PRODUCTION - https://beetagged-app-53414697acd3.herokuapp.com/
- **July 16, 2025**: REACT APP NOW WORKING - Fixed bundle deployment and React app now serves properly with search functionality
- **July 16, 2025**: FIXED SEARCH FUNCTIONALITY - Added missing `/api/search/natural` endpoint for natural language contact search
- **July 16, 2025**: Updated Squarespace widget to proper "Request Access" email link instead of internal testing URLs
- **July 16, 2025**: Added "Import Contacts" navigation link to main app for easy access to LinkedIn import
- **July 16, 2025**: LinkedIn CSV import fully functional - successfully imported up to 9,077 contacts in production test
- **July 16, 2025**: Fixed `/squarespace-linkedin-import` route with embedded HTML page for reliable deployment
- **July 16, 2025**: Added auto-redirect after successful CSV upload to improve user experience
- **July 16, 2025**: CRITICAL - Fixed CORS dependency issue preventing Heroku deployment
- **June 26, 2025**: LinkedIn CSV import fully operational with successful test import of 5 contacts
- **June 26, 2025**: Enhanced CSV parser handles multiple LinkedIn export formats with flexible column mapping
- **June 26, 2025**: Intelligent tag generation working - automatically categorizes by company, location, position, industry

## User Preferences
```
Preferred communication style: Simple, everyday language.
```