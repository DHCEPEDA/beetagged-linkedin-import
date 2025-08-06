# BeeTagged - Professional Contact Management Platform

## Overview

BeeTagged is a production-ready professional contact management platform deployed on Heroku with 5433 contacts. The system provides natural language search ("engineers at Google"), LinkedIn CSV import, and Squarespace widget integration. The backend uses MongoDB Atlas for contact storage and Express.js for API services.

## User Preferences

Preferred communication style: Simple, everyday language.

## Current Status (Updated: August 6, 2025)

- **Backend**: Production ready with MongoDB Atlas (5433 contacts loaded)
- **Database**: MongoDB Atlas operational - **FIXED deprecated connection warnings**
- **Frontend**: **DEPLOYED AND WORKING** on Squarespace
  - `SQUARESPACE-DUAL-IMPORT.html` - **LATEST VERSION** with dual CSV upload and duplicate detection
  - `SQUARESPACE-BASEBALL-CARDS.html` - Baseball card profiles with clickable contact details
  - `SQUARESPACE-HEADER-CENTERED.html` - Previous centered version
  - `SQUARESPACE-HEADER-PRODUCTION.html` - Original working version (top of page)
  - Search functionality confirmed working by user (includes Google search fix)
  - Widget displays sample contacts and processes natural language queries
  - Baseball card style detailed contact views with modal popups
  - **NEW**: Dual CSV import with intelligent duplicate consolidation prompts
  - Other versions: Footer injection (blocked), Code block (plan restrictions)
- **Search**: Natural language AI-powered search **CONFIRMED WORKING** in production
- **Import**: **ENHANCED** LinkedIn CSV processing with dual file support and duplicate detection
  - Supports both contacts.csv and connections.csv files simultaneously
  - Intelligent duplicate detection using name, email, and company matching
  - User choice prompts for consolidation vs separate import
- **Build System**: All workflows operational
  - ViteDev - Frontend development server running on port 3000
  - Backend - Express API server running on port 5000
  - ViteBuildDev - Development build working
  - BuildDevScript - Alternative development build
  - BuildSquarespaceBundle - Webpack bundle generation
- **Deployment**: Working in Replit (port 5000) and ready for Heroku
- **Project**: Enhanced with duplicate detection and consolidation features

## Setup Requirements

### Critical Manual Fixes Required (Read-Only Files)

#### 1. Package.json Scripts (REQUIRED FOR BUILD)
The package.json file is missing required scripts. Add these to the "scripts" section:

```json
{
  "scripts": {
    "start": "node index.js",
    "heroku-postbuild": "echo 'No build step required - using static files'",
    "dev": "vite",
    "build": "vite build", 
    "build:dev": "vite build --mode development",
    "preview": "vite preview"
  }
}
```

#### 2. Build System Status
✅ **TypeScript Configuration**: tsconfig.node.json updated with enhanced bundler mode settings
✅ **Vite Configuration**: vite.config.js exists and is properly configured
❌ **Package Scripts**: Missing required "dev" script causing build failures

#### 3. Current Workaround Status
- Backend server runs successfully on port 5000
- Squarespace widget works with production backend
- Frontend development server needs manual package.json fix
- All webpack builds for Squarespace are working

### Facebook OAuth Configuration
For Facebook import functionality to work:

1. **Facebook App Setup**: 
   - Replace `YOUR_FACEBOOK_APP_ID` in components with actual Facebook App ID
   - Configure redirect URLs in Facebook Developer Console
   - Set up proper app permissions for contact access

2. **Required Backend Endpoints**:
   - `/api/facebook/exchange-token` - Exchange OAuth code for access token
   - `/api/facebook/profile` - Get user profile information
   - `/api/facebook/import` - Import Facebook contacts

3. **Environment Variables**:
   - `FACEBOOK_APP_ID` - Available in secrets
   - `FACEBOOK_APP_SECRET` - Available in secrets

## Build System Status

### Working Components
✅ **Backend API**: Express server running on port 5000 with all endpoints
✅ **Database**: MongoDB Atlas with 5433 contacts loaded
✅ **Squarespace Builds**: Webpack bundles generating successfully
✅ **Production Widget**: SQUARESPACE-DUAL-IMPORT.html working with backend
✅ **Search**: Natural language search confirmed working
✅ **Import**: Dual CSV upload with duplicate detection operational

### Known Issues
❌ **Vite Dev Server**: Requires manual package.json script addition
❌ **Frontend Development**: Limited until package.json is manually updated

### Immediate Workaround
The core functionality is working through:
1. Backend API server (port 5000)
2. Squarespace widget deployment
3. Production Heroku backend

Development workflow can continue using the working components while package.json is updated manually.

## System Architecture

### Frontend Architecture
- **Framework**: React 19 with TypeScript and Vite for development
- **Styling**: TailwindCSS with custom component styling
- **Deployment**: Dual build system supporting both standalone web app and Squarespace widget integration
- **State Management**: React Query for server state management
- **Build Tools**: Webpack configuration for Squarespace bundle generation

### Backend Architecture
- **Framework**: Express.js with Node.js
- **Database**: MongoDB with Mongoose ODM for contact data persistence
- **Authentication**: Stateless design with optional user ID filtering
- **API Design**: RESTful endpoints with CORS enabled for cross-origin requests
- **File Processing**: Multer for CSV file uploads and processing
- **Security**: Helmet for security headers, rate limiting, and HTTPS enforcement

### Data Storage Solutions
- **Primary Database**: MongoDB Atlas for production contact storage
- **Contact Schema**: Comprehensive contact model with fields for personal info, professional details, rankings, and metadata
- **Indexing Strategy**: Text search indexes and compound indexes for performance optimization
- **Data Processing**: Smart tag generation system for enhanced search capabilities

### Search and AI Integration
- **Natural Language Search**: Enhanced pattern matching with keyword analysis
- **AI-Powered Features**: OpenAI integration for semantic search and contact ranking
- **Search Types**: Multiple search endpoints including natural language and AI-assisted queries
- **Performance**: Optimized queries with proper indexing and result limiting

### Import and Integration Systems
- **LinkedIn Import**: Enhanced CSV parsing with dual-file support (connections and contacts)
  - Intelligent duplicate detection using name, email, and company matching
  - User choice prompts for consolidation vs separate import
  - Support for multiple LinkedIn export formats
- **Facebook Integration**: OAuth flow and contact import capabilities (requires setup)
- **Data Processing**: Intelligent field mapping and contact deduplication with LLM assistance
- **File Handling**: Memory-based file storage with comprehensive CSV parsing

## External Dependencies

### Core Services
- **MongoDB Atlas**: Cloud database service for contact data storage
- **Heroku**: Primary hosting platform for backend API
- **OpenAI API**: AI-powered search and contact ranking features

### Third-Party APIs
- **LinkedIn**: Contact export via CSV files (no direct API integration)
- **Facebook Graph API**: OAuth authentication and contact import
- **Squarespace**: Widget embedding platform for client sites

### Development and Build Tools
- **Vite**: Modern frontend build tool and development server
- **Webpack**: Bundle generation for Squarespace widget deployment
- **TailwindCSS**: Utility-first CSS framework for responsive design
- **TypeScript**: Type safety and enhanced development experience

### Security and Performance
- **Helmet**: Security middleware for HTTP headers
- **CORS**: Cross-origin resource sharing for frontend-backend communication
- **Rate Limiting**: API request throttling for abuse prevention
- **Compression**: Response compression for improved performance