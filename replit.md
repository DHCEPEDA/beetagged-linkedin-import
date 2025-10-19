# Overview

BeeTagged is a professional contact management platform that uses AI-powered search capabilities to help users manage and search through their professional networks. The application combines React frontend components with an Express.js backend, featuring natural language search, LinkedIn CSV import functionality, and a comprehensive contact management system. The platform is production-ready and optimized for Heroku deployment with MongoDB Atlas integration.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The frontend is built with React 19 and TypeScript, using Vite as the build tool and development server. The architecture follows modern React patterns with:

- **Component-based Design**: Modular React components with TypeScript support for type safety
- **Styling Strategy**: TailwindCSS for utility-first styling combined with custom CSS for specific BeeTagged branding
- **Build System**: Vite for fast development and optimized production builds, configured to output to `dist-vite` directory
- **State Management**: React Query (@tanstack/react-query) for server state management and caching
- **Development Tools**: Hot module replacement and TypeScript compilation for improved developer experience

The frontend supports both development and production environments with automatic backend URL detection based on the deployment context.

## Backend Architecture

The backend is an Express.js application following RESTful API principles:

- **Framework**: Express.js with comprehensive middleware stack including Helmet for security, CORS for cross-origin requests, and rate limiting
- **File Processing**: Multer for file uploads with CSV parsing capabilities for LinkedIn data import
- **Database Layer**: Mongoose ODM for MongoDB interactions, providing schema validation and query abstraction
- **Security**: Multi-layer security with Helmet, rate limiting (1000 requests per 15 minutes), and CORS configuration
- **Logging**: Morgan for HTTP request logging and compression middleware for response optimization

## Data Storage

The application uses MongoDB as the primary database:

- **Database**: MongoDB with Mongoose ODM for schema management and data validation
- **Connection**: MongoDB Atlas cloud database with connection string stored in environment variables
- **Collections**: Contact management with support for LinkedIn data import and natural language search indexing
- **File Processing**: CSV data processing for LinkedIn Connections and Contacts import with data merging capabilities

## API Design

RESTful API structure with specialized endpoints:

- **Contact Management**: CRUD operations for contact data with pagination support
- **Search Functionality**: Natural language search endpoint with AI-powered query processing
- **Data Import**: LinkedIn CSV file processing with dual-file support (Connections and Contacts)
- **Health Monitoring**: Health check endpoints for deployment monitoring

# External Dependencies

## Core Framework Dependencies

- **React Ecosystem**: React 19, React DOM, and React Query for frontend state management
- **Node.js Backend**: Express.js with security middleware (Helmet, CORS, rate limiting)
- **Database**: MongoDB Atlas with Mongoose ODM for data persistence
- **Build Tools**: Vite for frontend bundling, TypeScript for type safety

## AI and Search Integration

- **OpenAI Integration**: OpenAI SDK for natural language processing and semantic search capabilities
- **Similarity Computing**: Cosine similarity computation for contact matching and search relevance

## File Processing and Data Import

- **File Upload**: Multer for handling multipart form data and file uploads
- **CSV Processing**: PapaParse for robust LinkedIn CSV data import with header detection and format flexibility
- **Format Support**: Handles both LinkedIn Connections export (First Name/Last Name columns) and Contacts export (single Name column)
- **Data Merging**: Intelligent name parsing and field mapping for various LinkedIn CSV formats

## Development and Production Tools

- **Security**: Helmet for HTTP security headers, express-rate-limit for API protection
- **Logging**: Morgan for HTTP request logging in production environments
- **Performance**: Compression middleware for response optimization
- **Styling**: TailwindCSS and PostCSS for responsive design and utility-first CSS

## Deployment Infrastructure

- **Primary Deployment**: Heroku for production backend hosting
- **Build Configuration**: Frontend pre-built in `dist-vite/`, dummy build script for Heroku compatibility
- **Environment Management**: dotenv for configuration management across environments
- **Session Management**: localStorage-based session persistence with automatic token generation

# Recent Updates (October 2025)

## CSV Import Enhancement
- **Date**: October 19, 2025
- **Change**: Replaced manual CSV parsing with PapaParse library for professional-grade CSV processing
- **Impact**: CSV imports now handle all LinkedIn export formats (Connections, Contacts), quoted fields, special characters, and various column name formats
- **Dependencies**: Added `papaparse` package

## Heroku Deployment Fix
- **Date**: October 19, 2025
- **Change**: Modified package.json build script to use dummy echo command instead of vite build
- **Reason**: Frontend is pre-built in `dist-vite/`, no need to rebuild on Heroku (avoids ES module errors)
- **Build Script**: `"build": "echo 'Skipping frontend build - using pre-built dist-vite'"`