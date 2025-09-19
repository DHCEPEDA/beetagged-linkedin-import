# BeeTagged - Professional Contact Management Platform

## Overview
BeeTagged is a production-ready, AI-powered professional contact management platform. It facilitates multi-source data integration (LinkedIn CSV, Facebook OAuth), semantic search, and comprehensive contact management. The platform is deployed on Heroku and designed for scalability, privacy compliance, and efficient social contact architecture. Its core purpose is to provide intelligent contact insights and streamline professional networking through advanced data processing and AI capabilities.

## User Preferences
Preferred communication style: Simple, everyday language.
Always provide exact files and deployment locations after making changes.

## System Architecture

### Frontend Architecture
- **Framework**: React 19 with TypeScript and Vite.
- **Styling**: TailwindCSS for component styling.
- **Deployment**: Dual build system for standalone web app and Squarespace widget integration.
- **State Management**: React Query for server state management.
- **Build Tools**: Vite for development and Webpack for Squarespace bundle generation.
- **UI/UX**: Baseball card style detailed contact views with modal popups; dual CSV import with intelligent duplicate consolidation prompts.

### Backend Architecture
- **Framework**: Express.js with Node.js.
- **Database**: MongoDB with Mongoose ODM for contact data persistence.
- **Authentication**: Stateless design with Facebook, LinkedIn, and Gmail OAuth integrations.
- **API Design**: RESTful endpoints with CORS enabled, incorporating rate limiting and error handling.
- **File Processing**: Multer for CSV file uploads.
- **Security**: Helmet for security headers and HTTPS enforcement.

### Data Storage & Processing
- **Primary Database**: MongoDB Atlas for production contact storage.
- **Contact Schema**: Multi-modal contact model supporting social profiles, embeddings, and metadata.
- **Vector Search**: Text search indexes with semantic capabilities for natural language queries (OpenAI embedding-based).
- **Data Processing Pipeline**: Contact matching, enrichment (AI-powered skill extraction, career stage analysis), and vector embedding.
- **Contact Matching**: Primary identifiers (phone/email), social integration, fuzzy matching, and data enrichment.

### Search and AI Integration
- **Natural Language Search**: Semantic query processing with intent recognition and entity extraction.
- **AI-Powered Features**: OpenAI integration for contact ranking and relationship insights.
- **Vector Capabilities**: Text embeddings for similarity search.
- **Search Modes**: Dual modes supporting traditional text search with semantic search fallback.

### Import and Integration Systems
- **LinkedIn Import**: Enhanced CSV parsing with dual-file support (connections and contacts) and intelligent duplicate detection.
- **Contacts CSV Import**: Full support for generic "Contacts" CSV format with fields: source, firstname, lastname, companies, title, emails, phone numbers, created at, addresses, sites, instantmessagehandles, fullname, birthday, location, bookmarkedat, and profiles.
- **Multi-Format CSV Processing**: Automatic detection and handling of both LinkedIn and Contacts CSV formats with intelligent field mapping.
- **Facebook Integration**: OAuth flow and contact import capabilities with enhanced friend access (`user_friends` permission).
- **Authentication Integration**: Complete OAuth system for LinkedIn, Gmail, and Facebook with real-time status indicators.

## External Dependencies

### Core Services
- **MongoDB Atlas**: Cloud database service.
- **Heroku**: Primary hosting platform for backend API.
- **OpenAI API**: AI-powered search and contact ranking features.

### Third-Party APIs
- **LinkedIn**: Primarily via CSV exports (no direct API integration).
- **Facebook Graph API**: OAuth authentication and contact import.
- **Squarespace**: Widget embedding platform.

### Development and Build Tools
- **Vite**: Frontend build tool and development server.
- **Webpack**: Bundle generation for Squarespace widget.
- **TailwindCSS**: CSS framework.
- **TypeScript**: Language for type safety.

### Security and Performance
- **Helmet**: Security middleware.
- **CORS**: Cross-origin resource sharing.
- **Rate Limiting**: API request throttling.
- **Compression**: Response compression.