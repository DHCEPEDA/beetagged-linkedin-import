# BeeTagged Squarespace Widget Overview

## Latest Widget: SQUARESPACE-DUAL-IMPORT.html

### Features
- **Dual CSV Upload**: Supports both LinkedIn contacts.csv and connections.csv
- **Drag & Drop Interface**: Visual upload zones with file validation
- **Duplicate Detection**: Smart matching algorithm using:
  - Exact name matches
  - Email address matches  
  - Name similarity + company matches (80% threshold)
- **User Decision Prompts**: Modal interface with three options:
  - Consolidate duplicates (merge profiles)
  - Keep separate (import all)
  - Review individually (future feature)
- **Baseball Card Views**: Detailed contact modals with professional avatars
- **Natural Language Search**: AI-powered queries like "Google employees"
- **Real-time Status**: Processing indicators and success/error messages

### How to Use
1. Copy the entire SQUARESPACE-DUAL-IMPORT.html content
2. In Squarespace: Settings > Advanced > Code Injection > HEADER
3. Paste the code and save
4. Widget appears on your site with full functionality

### Backend Integration
- Uses production Heroku backend: https://beetagged-app-53414697acd3.herokuapp.com
- MongoDB Atlas database with 5433+ contacts
- RESTful API endpoints for import, search, and duplicate resolution

### Import Process Flow
1. User uploads contacts.csv and/or connections.csv files
2. Files are sent to `/api/import/linkedin` endpoint
3. Backend processes files and detects duplicates
4. If duplicates found: Shows modal with consolidation options
5. If no duplicates: Direct import with success message
6. Duplicate resolution via `/api/import/resolve-duplicates` endpoint

### Technical Implementation
- Pure JavaScript (no external dependencies)
- Responsive design with CSS Grid and Flexbox
- Modal system for interactions
- FormData API for file uploads
- Fetch API for backend communication
- Error handling and user feedback

### Alternative Widgets Available
- **SQUARESPACE-BASEBALL-CARDS.html**: Focus on detailed contact views
- **SQUARESPACE-HEADER-CENTERED.html**: Centered layout version  
- **SQUARESPACE-HEADER-PRODUCTION.html**: Original simple version

The dual import widget represents the most complete implementation with both import and search functionality combined in a single interface.