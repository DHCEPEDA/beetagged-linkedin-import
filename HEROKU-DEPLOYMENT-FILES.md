# BeeTagged Heroku Deployment Files

## Essential Files for Heroku Upload

### Core Server Files
1. **index.js** - Main Express server with MongoDB connection
2. **package.json** - Dependencies and start script
3. **.env** - Environment variables (create new with your MongoDB URI)

### API Routes (routes/ folder)
- **contacts.js** - Contact management endpoints
- **search.js** - Natural language search functionality  
- **linkedin.js** - CSV import processing
- **facebook.js** - Facebook integration
- **ranking.js** - Contact ranking system

### Business Logic (services/ folder)
- **searchService.js** - Search algorithms and AI integration
- **linkedinService.js** - LinkedIn CSV processing
- **openaiService.js** - AI-powered search features
- **facebookService.js** - Facebook API integration

### Database Models (models/ folder)
- **Contact.js** - MongoDB contact schema

### Static Assets (dist/ folder)
- **beetagged-app-bundle.js** - Squarespace widget bundle
- **beetagged-app-bundle.js.LICENSE.txt** - License file

## Environment Variables Required

Create a `.env` file with:
```
MONGODB_URI=your_mongodb_atlas_connection_string
OPENAI_API_KEY=your_openai_api_key
NODE_ENV=production
PORT=5000
```

## Deployment Command
```bash
git add .
git commit -m "Updated BeeTagged backend"
git push heroku main
```

## Current Status
- Backend tested with 5433 contacts
- All API endpoints functional
- CORS configured for Squarespace integration
- Production-ready with security headers