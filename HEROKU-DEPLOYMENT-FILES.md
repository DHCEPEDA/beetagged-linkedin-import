# BeeTagged Heroku Deployment Files

## CRITICAL FILES TO UPLOAD TO HEROKU

### 1. Copy these files to your Heroku project root:

**package.json** (copy from package-deployment.json):
```json
{
  "name": "beetagged-app",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "build:dev": "vite build --mode development",
    "preview": "vite preview",
    "start": "node index.js",
    "heroku-postbuild": "echo 'Build completed - using static files'"
  },
  "engines": {
    "node": "18.x || 20.x",
    "npm": ">=8.0.0"
  },
  "dependencies": {
    "compression": "^1.8.0",
    "cors": "^2.8.5",
    "csv-parser": "^3.2.0",
    "dotenv": "^16.5.0",
    "express": "^4.18.2",
    "mongoose": "^8.13.2",
    "multer": "^1.4.5-lts.2",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

**index.js** (copy from index-heroku-clean.js)
**Procfile** (already exists)

### 2. Environment Variables to Set in Heroku:

```
MONGODB_URI=mongodb+srv://dhcepeda:EXLqA9xeQGpIaN0N@clusterbeetagged.mpruwpw.mongodb.net/
NODE_ENV=production
```

### 3. Facebook App Setup:

1. Go to https://developers.facebook.com/
2. Create a new app
3. Add "Facebook Login" product
4. Configure these settings:
   - Valid OAuth Redirect URIs: https://your-heroku-app.herokuapp.com/
   - Valid OAuth Logout URIs: https://your-heroku-app.herokuapp.com/
5. Copy your App ID (you'll need this to test Facebook import)

### 4. Features Working:

✅ **LinkedIn CSV Import**: 
- Handles quoted fields properly
- Supports multiple LinkedIn export formats
- Enhanced error handling and logging

✅ **Facebook Import**: 
- Modal interface for App ID input
- Facebook SDK integration
- Contact import with friend restrictions noted

✅ **Search & Tagging**: 
- Natural language search
- AI-powered tag generation
- Company, role, location categorization

## DEPLOYMENT COMMAND:

```bash
# Copy files
cp package-deployment.json package.json
cp index-heroku-clean.js index.js

# Deploy
git add .
git commit -m "Deploy enhanced CSV parsing and Facebook integration"
git push heroku main
```

Your app will be live at: https://beetagged-app.herokuapp.com/