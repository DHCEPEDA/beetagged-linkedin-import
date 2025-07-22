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