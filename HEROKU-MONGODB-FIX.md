# Fix Heroku MongoDB Connection

## Problem
The Heroku app shows `"database":"disconnected"` because the MongoDB environment variable isn't configured in Heroku.

## Solution: Add MongoDB Environment Variable to Heroku

### Important: First Check Your App Name
The URL you tested (beetagged-c81cb6aef2da.herokuapp.com) shows "No such app". Make sure you're using the correct Heroku app name from your deployment.

### Step 1: Get Your MongoDB Connection String
From your Replit secrets, you have a `MONGODB_URI`. You need to add this to Heroku.

### Step 2: Add Environment Variable to Heroku

**Method 1: Using Heroku CLI**
```bash
# First, check your app name
heroku apps

# Then add the MongoDB URI (replace YOUR_MONGODB_URI with your actual connection string)
heroku config:set MONGODB_URI="YOUR_MONGODB_URI" --app your-actual-app-name
```

**Method 2: Using Heroku Dashboard**
1. Go to https://dashboard.heroku.com
2. Click on your app
3. Go to Settings tab
4. Click "Reveal Config Vars"
5. Add:
   - Key: `MONGODB_URI`
   - Value: Your MongoDB connection string (starts with `mongodb+srv://`)

### Step 3: Restart Your App
```bash
heroku restart --app your-app-name
```

### Step 4: Test the Connection
```bash
# Replace your-actual-app-name with your real Heroku app name
curl https://your-actual-app-name.herokuapp.com/health
```

You should see:
```json
{
  "status": "healthy",
  "database": "connected",
  "version": "2.1.0"
}
```

## Your MongoDB Connection String Format
It should look like:
```
mongodb+srv://username:password@cluster.mongodb.net/beetagged?retryWrites=true&w=majority
```

## After Adding the Environment Variable
Your Heroku app will automatically restart and connect to MongoDB. The health check will show `"database":"connected"` and all search and import functionality will work.

## Test Search Functionality
Once connected, test the natural language search:
```bash
curl "https://your-actual-app-name.herokuapp.com/api/search-natural?q=engineers%20at%20Google"
```

This will return your contact data from MongoDB Atlas.

## Troubleshooting

**If you see "No such app":**
1. Check your app name: `heroku apps`
2. Make sure you deployed to the correct app
3. The URL format is: `https://your-app-name.herokuapp.com`

**If database still shows "disconnected":**
1. Verify the MONGODB_URI is correctly set: `heroku config --app your-app-name`
2. Check the MongoDB connection string format
3. Restart the app: `heroku restart --app your-app-name`
4. Check logs: `heroku logs --tail --app your-app-name`