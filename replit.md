# BeeTagged - Professional Contact Management Platform

## Overview

BeeTagged is a professional networking and contact management platform designed to help users organize and manage their professional relationships. The application integrates with social media platforms (particularly Facebook and LinkedIn) to import and consolidate contact information, providing AI-powered contact intelligence and tagging capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend Architecture
The application uses a **Node.js/Express server** with the following key components:

**Problem**: Need a scalable web server that can handle file uploads, social media integrations, and database operations.
**Solution**: Express.js server with middleware for CORS, compression, and file handling.
**Rationale**: Express provides a lightweight, flexible framework with extensive middleware ecosystem.

### Frontend Architecture
The application employs a **hybrid approach** combining:

1. **React-based SPA** for the main application interface
2. **Static HTML pages** for standalone features and testing
3. **Progressive Web App (PWA)** capabilities for mobile experience

**Problem**: Need both rich interactive features and simple standalone pages.
**Solution**: Webpack-bundled React app with static HTML fallbacks.
**Pros**: Flexibility, faster development, easier testing
**Cons**: Slightly more complex deployment

### Data Storage
**Database**: MongoDB Atlas (cloud-hosted)
**Problem**: Need flexible schema for diverse contact data from multiple sources.
**Solution**: MongoDB with Mongoose ODM for schema validation.
**Rationale**: NoSQL flexibility handles varying contact formats from different social platforms.

## Key Components

### Contact Management System
- **Contact Schema**: Flexible MongoDB schema supporting multiple data sources
- **CSV Import**: Multer-based file upload for LinkedIn CSV imports
- **Data Consolidation**: Logic to merge contacts from multiple sources
- **Search & Filtering**: Contact search with tagging capabilities

### Social Media Integration
- **Facebook OAuth**: JavaScript SDK integration for user authentication
- **LinkedIn Import**: CSV-based contact import (OAuth implementation in development)
- **Multi-source Consolidation**: Merges contacts from different platforms

### Authentication System
- **Facebook Login**: Client-side OAuth using Facebook JavaScript SDK
- **Session Management**: Basic session handling for social logins
- **User Profile**: Stores user data from social platforms

### File Processing
- **CSV Parser**: Processes LinkedIn connection exports
- **File Upload**: Handles contact data file uploads
- **Data Validation**: Validates and cleans imported contact data

## Data Flow

1. **User Authentication**: Users authenticate via Facebook OAuth
2. **Contact Import**: Users upload LinkedIn CSV files or connect Facebook
3. **Data Processing**: Server processes and validates contact data
4. **Database Storage**: Cleaned contact data stored in MongoDB
5. **Contact Display**: React frontend displays consolidated contact list
6. **Search & Filter**: Users can search and tag contacts

## External Dependencies

### Third-Party Services
- **MongoDB Atlas**: Cloud database hosting
- **Facebook Graph API**: Social login and contact access
- **LinkedIn**: CSV export processing (OAuth in development)

### Core Libraries
- **Express.js**: Web server framework
- **Mongoose**: MongoDB object modeling
- **React**: Frontend UI framework
- **Multer**: File upload handling
- **CSV-Parser**: LinkedIn data processing
- **Compression**: Response compression middleware

### Build Tools
- **Webpack**: Module bundling and build process
- **Babel**: JavaScript transpilation for React
- **CSS-Loader**: Stylesheet processing

## Deployment Strategy

### Platform
**Heroku Cloud Platform** with Node.js buildpack

**Problem**: Need reliable cloud hosting with easy deployment.
**Solution**: Heroku with Git-based deployment.
**Pros**: Easy deployment, managed infrastructure, environment variables
**Cons**: Limited free tier, potential cold starts

### Environment Configuration
- **Production**: NODE_ENV=production with MongoDB Atlas
- **Development**: Local MongoDB or cloud connection
- **Build Process**: Webpack production build during deployment

### Static Assets
- **Bundled Assets**: Webpack generates bundle.js and bundle.css
- **Public Files**: Static HTML pages served directly
- **Images**: SVG icons and logos served from public directory

### Scaling Considerations
- **Database**: MongoDB Atlas handles scaling automatically
- **File Storage**: Currently using server storage (could migrate to cloud storage)
- **Session Management**: Basic in-memory sessions (would need Redis for scaling)

The architecture prioritizes rapid development and deployment while maintaining flexibility for future enhancements like advanced OAuth integrations and real-time features.

## Recent Changes: Latest modifications with dates

### July 23, 2025 - Search Functionality Complete & Production Ready
- **Critical Fix**: Resolved search bar responsiveness and Enter key support
  - Enhanced natural language search API with broader keyword matching
  - Added Enter key event handling for immediate search triggering
  - Improved search patterns for queries like "basketball fans in Round Rock"
  - Fixed search connection between frontend and backend API
- **Search Improvements**: Advanced query processing capabilities
  - Multi-keyword search across all contact fields (name, company, position, location, email, tags)
  - Smart pattern matching for common queries (tech companies, roles, locations)
  - Comprehensive error handling with user feedback
  - Real-time and on-demand search functionality
- **Production Status**: Fully functional contact search application
  - LinkedIn CSV import working and tested
  - Search API returning accurate results for current database
  - All core features operational and ready for Heroku deployment
  - Facebook app settings documented for production domains
- **User Confirmation**: Search functionality tested and confirmed working for basic queries
  - Successfully finds contacts by company (Google, Microsoft, Apple)
  - Successfully finds contacts by role (Engineer, Manager, Designer)
  - Successfully finds contacts by name (John, Jane, Bob)
- **Next Step**: Transfer complete codebase to Lovable platform with updated package.json scripts
- **Package Update**: Added Vite build scripts and TypeScript support for Lovable compatibility
- **Code Transfer**: Complete BEETAGGED-LOVABLE-CODE.md created with all 1,075 lines of production code
- **Integration Strategy**: Backend (Replit) provides API endpoints, Frontend (Lovable) handles React UI
- **API Documentation**: LOVABLE-BACKEND-INTEGRATION.md created with all endpoint specifications
- **Major Architectural Restructuring**: Converted monolithic backend to professional modular structure
- **Created organized backend** with separate routes (contacts, linkedin, facebook, search, ranking), services (LinkedIn, search, OpenAI, Facebook), and utilities (data processing, validation)
- **Backend fully operational** with enhanced natural language search, LinkedIn CSV import, and contact management APIs ready for Lovable frontend integration
- **Production Integration**: Configured Replit environment to point to Heroku production URL (https://beetagged-app-53414697acd3.herokuapp.com) instead of development environment
- **Ready for deployment**: All documentation updated with production URLs for seamless Lovable frontend integration
- **Frontend Configuration Fix**: Identified critical issue - project was configured as Node.js backend instead of React frontend
- **Complete Frontend Package**: Created package-complete-frontend.json with React, Vite, TypeScript, Tailwind, shadcn/ui dependencies
- **Build Scripts Added**: Including missing "build:dev": "vite build --mode development" command
- **Configuration Files**: Created TypeScript, Tailwind, and PostCSS configurations for proper Lovable deployment
- **Static Site Deployment**: Created Heroku static site configuration with static.json and optimized package for frontend deployment
- **Deployment Options**: Provided both static Heroku deployment and separate platform strategies for frontend/backend architecture

### July 27, 2025 - MongoDB Integration Confirmed & Complete Frontend Package
- **MongoDB Credentials**: User provided MongoDB Service Account ID (mdb_sa_id_681007ec65f1474770824370)
- **Database Connection**: Verified MongoDB Atlas connection is operational with existing MONGODB_URI environment variable
- **Professional Schema**: Contact model with full-text search indexes across name, company, position, location fields
- **Complete Frontend Package**: Created package-complete-lovable.json with all shadcn/ui dependencies for new repository setup
- **Production Server**: Added Express server.js for frontend deployment with proper Vite build integration
- **Repository Documentation**: Complete FRONTEND-REPOSITORY-SETUP.md with step-by-step instructions for independent frontend deployment
- **All Dependencies Resolved**: Fixed TypeScript errors, installed React packages, generated working package-lock.json for Lovable compatibility

### July 27, 2025 - Frontend-Backend Connection Fixed & Squarespace Widget Complete
- **Critical Fix**: Resolved frontend pointing to Heroku instead of localhost during development
- **Connection Verified**: React app now properly connects to Express backend on port 5000
- **Search Functionality Confirmed**: All 3 test contacts (John Doe/Google, Jane Smith/Microsoft, Bob Johnson/Apple) accessible via search
- **Natural Language Search Working**: Queries like "Google", "Microsoft", "Apple", "john" return correct results
- **Squarespace Integration Complete**: Created SQUARESPACE-BEETAGGED-WIDGET.html with production-ready widget
- **Three Integration Options**: Full page widget, iframe embed, and inline search bar for Squarespace deployment
- **Production Ready**: Widget connects to live Heroku backend with $0.99 monetization display
- **User Confirmed**: Search functionality working and ready for Squarespace deployment