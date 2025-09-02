# Heroku Git Upload Instructions

## Exact Files You Need to Upload

Create a new folder on your computer called `beetagged-heroku` and add these 3 files:

### 1. `index.js`
Copy the entire contents of `HEROKU-DEPLOYMENT-PACKAGE.js` from this Replit project and save it as `index.js`

### 2. `package.json` 
Copy the entire contents of `package-heroku.json` from this Replit project and save it as `package.json`

### 3. `Procfile` (no extension)
Copy the contents of `Procfile` from this Replit project (just contains: `web: node index.js`)

## Step-by-Step Heroku Deployment

### Step 1: Prepare Local Folder
```bash
# Create deployment folder
mkdir beetagged-heroku
cd beetagged-heroku

# Copy the 3 files above into this folder
# - index.js (from HEROKU-DEPLOYMENT-PACKAGE.js)
# - package.json (from package-heroku.json)  
# - Procfile (from Procfile)
```

### Step 2: Initialize Git
```bash
git init
git add .
git commit -m "Initial BeeTagged backend deployment"
```

### Step 3: Create Heroku App
```bash
# Create new app (Heroku will assign a unique name)
heroku create

# Or create with specific name (if available)
heroku create beetagged-backend-2025
```

### Step 4: Set Environment Variables
```bash
# Set your MongoDB connection string (REQUIRED)
heroku config:set MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/beetagged?retryWrites=true&w=majority"

# Set production environment
heroku config:set NODE_ENV="production"

# Set Facebook App ID (for authentication)
heroku config:set FACEBOOK_APP_ID="1222790436230433"
```

### Step 5: Deploy to Heroku
```bash
# Deploy your code
git push heroku main

# Check if it's running
heroku ps

# View logs to see if database connects
heroku logs --tail
```

### Step 6: Test Your Deployment
```bash
# Get your app URL
heroku info

# Test health endpoint (replace YOUR-APP-NAME)
curl https://YOUR-APP-NAME.herokuapp.com/health
```

## Expected Success Response

Once working, your health check should return:
```json
{
  "status": "healthy",
  "database": "connected",
  "version": "2.1.0",
  "timestamp": "2025-09-02T03:00:00.000Z"
}
```

## Files Summary

Your `beetagged-heroku` folder should contain exactly these 3 files:
- `index.js` (your backend server code)
- `package.json` (dependencies and scripts)
- `Procfile` (tells Heroku how to start your app)

That's it! No other files needed.

## Troubleshooting

If you see "database": "disconnected":
1. Check MongoDB Atlas username/password in MONGODB_URI
2. Verify IP whitelist includes 0.0.0.0/0 
3. Check Heroku logs: `heroku logs --tail`

The backend includes automatic retry logic and will keep attempting to connect to MongoDB.