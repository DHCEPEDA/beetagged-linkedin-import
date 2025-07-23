# Quick Heroku Deployment Guide

## STEP 1: Copy Required Files

In your Heroku project directory, replace these files:

**package.json** ← Copy content from `package-deployment.json`
**index.js** ← Copy content from `index-heroku-clean.js`  
**Procfile** ← Keep existing: `web: node index.js`

## STEP 2: Set Environment Variables in Heroku

```bash
heroku config:set MONGODB_URI="mongodb+srv://dhcepeda:EXLqA9xeQGpIaN0N@clusterbeetagged.mpruwpw.mongodb.net/"
heroku config:set NODE_ENV="production"
```

## STEP 3: Deploy

```bash
git add .
git commit -m "Enhanced CSV parsing and Facebook integration"
git push heroku main
```

## STEP 4: Facebook App Setup

1. **Create Facebook App**: Go to https://developers.facebook.com/
2. **Add Facebook Login**: Select "Facebook Login" product
3. **Configure OAuth URIs**: 
   - Valid OAuth Redirect URIs: `https://your-app-name.herokuapp.com/`
   - Valid OAuth Logout URIs: `https://your-app-name.herokuapp.com/`
4. **Copy App ID**: You'll need this when testing Facebook import

## STEP 5: Test Features

### LinkedIn CSV Import:
- Export connections from LinkedIn
- Use "Import LinkedIn CSV" button  
- Upload your CSV file

### Facebook Import:
- Click "Import Facebook Contacts" button
- Enter your Facebook App ID
- Authenticate and import (note: limited to friends who also use your app)

## FEATURES NOW WORKING:

✅ **Enhanced CSV Parser**: Handles real LinkedIn exports with quoted fields
✅ **Facebook Integration**: Complete SDK integration with modal interface  
✅ **Smart Tagging**: AI-powered categorization by company, role, location
✅ **Natural Search**: Query like "Who works at Google?" or "Marketing contacts in NYC"
✅ **MongoDB Storage**: All contacts saved to cloud database

Your BeeTagged app is production-ready!