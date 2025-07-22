# BeeTagged Heroku Deployment Guide

## Files Needed for Deployment

**ONLY upload these 3 files to Heroku:**

1. **index.js** - Complete self-contained application
2. **package-heroku-final.json** - Rename to `package.json` 
3. **Procfile** - Contains `web: node index.js`

## Critical: Remove Webpack Files

**DO NOT upload these files to Heroku:**
- webpack.config.js
- webpack.production.config.js  
- webpack.heroku.config.js
- Any files in `src/` folder
- Any files in `public/` folder (except index.js if needed)

## Environment Variables

Set these in Heroku Dashboard → Settings → Config Vars:

```
NODE_ENV = production
MONGODB_URI = mongodb+srv://dhcepeda:EXLqA9xeQGpIaN0N@clusterbeetagged.mpruwpw.mongodb.net/?retryWrites=true&w=majority&appName=ClusterBeeTagged
```

## Deployment Steps

1. Create new Heroku app or clear existing one
2. Upload ONLY the 3 files listed above
3. Set environment variables in Heroku Dashboard
4. Deploy: `git push heroku main`

## Why This Works

- No webpack build process
- No missing source files
- Complete UI embedded in index.js
- Minimal dependencies
- MongoDB Atlas connection ready

The app will start immediately without any build steps.