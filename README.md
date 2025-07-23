# 🐝 BeeTagged - Professional Contact Management Platform

## Overview

BeeTagged is a cutting-edge professional networking platform that leverages AI and smart data integration to transform contact management. It overlays LinkedIn profile data onto contacts and provides intelligent search capabilities with natural language queries.

## 🚀 Key Features

### **Enhanced Contact Import**
- **LinkedIn CSV Import**: Robust parsing with quoted field handling for complex company names
- **Facebook Integration**: OAuth-based friend import with privacy-compliant restrictions
- **Smart Field Mapping**: Handles multiple CSV export formats automatically

### **Intelligent Search & Tagging**
- **Natural Language Queries**: "Who works at Google?", "Marketing contacts in NYC"
- **AI-Powered Categorization**: Automatic industry, role, and location tagging
- **Smart Filters**: Company, industry, function, and geographic grouping

### **Professional Contact Management**
- **Comprehensive Profiles**: Name, email, phone, company, position, location
- **Source Tracking**: LinkedIn, Facebook, or manual entry identification
- **Relationship Context**: Notes on how you met and connection history

## 🛠 Technical Architecture

### **Backend (Node.js/Express)**
- **Database**: MongoDB Atlas cloud storage
- **File Processing**: Enhanced CSV parsing with quote handling
- **Social Integration**: Facebook SDK and LinkedIn data processing
- **Search Engine**: Tag-based filtering with natural language support

### **Frontend (React/TypeScript)**
- **Modern UI**: Shadcn/ui components with Lucide React icons
- **State Management**: React hooks with TypeScript interfaces
- **Responsive Design**: Mobile-optimized contact management interface

### **Deployment**
- **Platform**: Heroku cloud hosting with automatic scaling
- **Build System**: Webpack bundling with production optimization
- **Environment**: Node.js 18.x with npm dependency management

## 📋 Setup Instructions

### **Prerequisites**
- Node.js 18.x or higher
- npm 8.0.0 or higher
- MongoDB Atlas account (or local MongoDB)
- Facebook Developer Account (for social features)

### **Environment Variables**
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
NODE_ENV=production
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
```

### **Local Development**
```bash
# Clone repository
git clone <repository-url>
cd beetagged

# Install dependencies
npm install

# Start development server
npm run start

# Development build
npm run build:dev
```

### **Heroku Deployment**
```bash
# Set environment variables
heroku config:set MONGODB_URI="your_mongodb_connection_string"
heroku config:set NODE_ENV="production"

# Deploy to Heroku
git add .
git commit -m "Deploy BeeTagged"
git push heroku main
```

## 🔧 API Documentation

### **Contact Endpoints**

#### `GET /api/contacts`
Retrieve all contacts sorted by creation date
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@company.com",
    "company": "Tech Corp",
    "position": "Software Engineer",
    "tags": ["company:tech-corp", "industry:technology"],
    "source": "linkedin"
  }
]
```

#### `POST /api/import/csv`
Import contacts from LinkedIn CSV export
```json
{
  "success": true,
  "imported": 25,
  "contacts": [...]
}
```

#### `POST /api/import/facebook`
Import contacts from Facebook SDK
```json
{
  "success": true,
  "message": "Successfully imported 15 contacts",
  "contacts": [...]
}
```

### **Search Endpoints**

#### `GET /api/search`
Natural language contact search
```
Query: "Who works at Google?"
Response: Contacts with company:google tag
```

## 📊 Contact Data Structure

### **Required Fields**
- `name`: Full contact name
- `company`: Current employer
- `position`: Job title/role

### **Optional Fields**
- `email`: Primary email address
- `phone`: Primary phone number
- `location`: Geographic location
- `linkedinUrl`: LinkedIn profile URL
- `notes`: Relationship context

### **Auto-Generated Fields**
- `id`: Unique identifier
- `tags`: Smart categorization tags
- `source`: Import source (linkedin/facebook/manual)
- `createdAt`: Timestamp of creation

## 🏷 Smart Tagging System

### **Company Tags**
- `company:google` - Direct company association
- `industry:technology` - Industry classification
- `industry:finance` - Financial services

### **Role Tags**
- `function:engineering` - Technical roles
- `function:marketing` - Marketing positions
- `function:sales` - Sales roles
- `function:management` - Leadership positions

### **Location Tags**
- `city:san-francisco` - Geographic grouping
- `city:new-york` - Metropolitan areas
- `location:seattle` - City-based categorization

## 🔐 Security & Privacy

### **Data Protection**
- Secure MongoDB Atlas connection with authentication
- Environment variable configuration for sensitive data
- No client-side storage of authentication tokens

### **Facebook Integration**
- OAuth 2.0 compliant authentication
- Respects Facebook privacy restrictions on friend data
- Only imports contacts who have authorized your app

### **LinkedIn Data**
- CSV-based import (no API credentials required)
- User-controlled data export from LinkedIn
- Local processing without external API calls

## 🚦 Development Guidelines

### **Code Documentation**
- JSDoc comments for all functions
- Inline comments explaining business logic
- TypeScript interfaces for data structures

### **CSV Import Logic**
```javascript
/**
 * Enhanced CSV parsing handles:
 * - Quoted fields with embedded commas: "Company, Inc."
 * - Escaped quotes within fields: "Big ""Tech"" Corp"
 * - Multiple header format variations
 * - Data validation and cleaning
 */
```

### **Search Integration**
```javascript
/**
 * Natural language search processes:
 * 1. Query analysis for company/role/location intent
 * 2. Tag-based filtering with smart matching
 * 3. Relevance scoring and result ranking
 */
```

## 🎯 Monetization Strategy

- **Pricing**: $0.99 one-time purchase
- **Distribution**: Squarespace widget integration
- **Target**: Professional networking and contact management
- **Value Proposition**: LinkedIn data enhancement with AI-powered search

## 📞 Support

For setup assistance or feature requests, please refer to the comprehensive documentation in the codebase or contact the development team.

---

**Built with ❤️ for professional networking excellence**