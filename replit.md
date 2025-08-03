# BeeTagged - Professional Contact Management Platform

## Overview
BeeTagged is a professional networking and contact management platform. Its main purpose is to help users organize and manage their professional relationships by integrating with social media platforms (primarily Facebook and LinkedIn) to import and consolidate contact information. It features AI-powered contact intelligence and tagging capabilities. The business vision is to provide a comprehensive solution for managing professional networks efficiently, with market potential in professional services, sales, and networking-intensive industries. The project aims to become a leading platform for intelligent contact management.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The application combines a React-based Single Page Application (SPA) for the main interface with static HTML pages for standalone features. It also incorporates Progressive Web App (PWA) capabilities for an enhanced mobile experience. The design prioritizes flexibility and rapid development.

### Technical Implementations
The backend is built on **Node.js/Express**, chosen for its scalability and extensive middleware ecosystem, handling file uploads, social media integrations, and database operations. The frontend leverages **React** for rich interactive features, bundled with Webpack, and supports TypeScript for development.

### Feature Specifications
- **Contact Management System**: Features a flexible MongoDB schema to support diverse contact data sources, CSV import capabilities (specifically for LinkedIn), LLM-powered duplicate detection and merging, "baseball card" style detailed contact views, data consolidation logic to merge contacts from multiple sources, and robust search and filtering with tagging.
- **Social Media Integration**: Includes Facebook OAuth integration using the JavaScript SDK, and CSV-based LinkedIn contact import. The system is designed for multi-source contact consolidation.
- **Authentication System**: Utilizes Facebook Login for client-side OAuth and basic session management. User profile data is stored from social platforms.
- **File Processing**: Handles CSV parsing for LinkedIn connection exports, manages file uploads for contact data, and includes data validation and cleaning for imported information.

### System Design Choices
- **Data Storage**: **MongoDB Atlas** (cloud-hosted) is used as the NoSQL database due to its flexible schema, which accommodates varying contact formats from different social platforms. Mongoose ODM is used for schema validation.
- **Data Flow**: The typical data flow involves user authentication via Facebook OAuth, contact import via LinkedIn CSV or Facebook connection, server-side data processing and validation, storage in MongoDB, and display of consolidated contacts via the React frontend. Users can then search and tag contacts.
- **Deployment Strategy**: **Heroku-exclusive deployment** for all environments. No Replit server dependencies. Backend uses Node.js buildpack on Heroku. Frontend bundles connect directly to Heroku APIs. All production and pre-production builds target Heroku infrastructure exclusively.
- **Production Status**: Backend deployed successfully to Heroku at https://beetagged-app-53414697acd3.herokuapp.com with MongoDB Atlas connected. Squarespace integration completed using Code Injection method for JavaScript and Custom CSS for styling.
- **Latest Update**: 
  - **LLM-Powered Duplicate Detection**: Added OpenAI GPT-4o integration to identify and merge similar contacts with shared data (same email/company)
  - **Baseball Card Contact Details**: Click any contact to view comprehensive profile with full name, email, company, location, interests, profile links, and all available fields
  - **Dual-file LinkedIn CSV merging**: Enhanced email extraction and smart contact matching system implemented
  - **Configuration Fixed**: Resolved TypeScript build issues and created Vite development workflows
  - **Production Ready**: Complete system with enhanced backend and updated Squarespace bundle prepared for deployment

## External Dependencies

### Third-Party Services
- **MongoDB Atlas**: Cloud database hosting service.
- **Facebook Graph API**: Used for social login and access to contact data.
- **LinkedIn**: Primarily used for CSV export processing, with OAuth integration planned for future development.

### Core Libraries
- **Express.js**: Core web server framework.
- **Mongoose**: Object Data Modeling (ODM) library for MongoDB.
- **React**: Frontend UI library.
- **Multer**: Middleware for handling `multipart/form-data`, primarily used for file uploads.
- **CSV-Parser**: Library for parsing CSV data, specifically used for LinkedIn connection exports.
- **Compression**: Middleware for response compression.

### Build Tools
- **Webpack**: Module bundler used for building the frontend.
- **Babel**: JavaScript compiler for transpiling modern JavaScript (e.g., React JSX).
- **Vite**: Modern frontend build tool, utilized for development builds and potentially production.
- **CSS-Loader**: Loader for Webpack to interpret `@import` and `url()` like `import/require()` and resolve them.