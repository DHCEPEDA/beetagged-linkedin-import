# BeeTagged - Professional Contact Management Platform

## Overview

BeeTagged is a production-ready professional contact management platform deployed on Heroku with 5433 contacts. The system provides natural language search ("engineers at Google"), LinkedIn CSV import, and Squarespace widget integration. The backend uses MongoDB Atlas for contact storage and Express.js for API services.

## User Preferences

Preferred communication style: Simple, everyday language.

## Current Status (Updated: August 6, 2025)

- **Backend**: Production deployed on Heroku (5433 contacts loaded)
- **Database**: MongoDB Atlas operational
- **Frontend**: Multiple Squarespace widget versions ready
  - `SQUARESPACE-FINAL-WIDGET.html` - Clean white card design
  - `SQUARESPACE-ENHANCED-WIDGET.html` - Professional tabbed interface
  - `SQUARESPACE-GRADIENT-WIDGET.html` - Elegant gradient design
- **Search**: Natural language AI-powered search functional
- **Import**: LinkedIn CSV processing working with drag & drop
- **Build System**: All workflows operational
  - ViteDev - Development server running on port 3000
  - ViteBuildDev - Development build working
  - BuildDevScript - Alternative development build
  - BuildSquarespaceBundle - Webpack bundle generation
- **Project**: Cleaned up - removed 40+ outdated files and documentation

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
- **LinkedIn Import**: CSV parsing with dual-file support (connections and contacts)
- **Facebook Integration**: OAuth flow and contact import capabilities
- **Data Processing**: Intelligent field mapping and contact deduplication
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