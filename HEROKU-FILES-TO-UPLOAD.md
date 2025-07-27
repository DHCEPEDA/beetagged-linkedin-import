# Files to Upload to Heroku

## Required Files for Heroku Deployment:

### 1. Main Application File
- **index.js** - Replace with `HEROKU-DEPLOYMENT-FINAL.js` content

### 2. Configuration Files
- **package.json** - Dependencies and scripts
- **Procfile** - Heroku process configuration

### 3. Optional Files
- **package-lock.json** - Dependency lock file (if available)

## Quick Deploy Commands:

```bash
# 1. Replace main file with fixed version
cp HEROKU-DEPLOYMENT-FINAL.js index.js

# 2. Ensure Procfile exists
echo "web: node index.js" > Procfile

# 3. Deploy to Heroku
git add index.js Procfile
git commit -m "Deploy fixed backend with MongoDB Atlas support"
git push heroku main
```

## Environment Variables to Set:
```bash
heroku config:set MONGODB_URI="your_mongodb_atlas_connection_string"
heroku config:set NODE_ENV=production
```

## After Deployment:
- Test: `curl https://beetagged-app-53414697acd3.herokuapp.com/health`
- Should return: `{"status":"healthy","contacts":X}`
- Then use Squarespace widget which points to this Heroku backend