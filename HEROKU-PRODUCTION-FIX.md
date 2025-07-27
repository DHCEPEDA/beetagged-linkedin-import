# Heroku Production Backend - MongoDB Atlas Connection Fix

## Deploying MongoDB Timeout Fixes to Production

Your Heroku app needs the updated `index.js` with MongoDB timeout protection. Here's how to deploy it:

### Method 1: Heroku CLI (Recommended)

```bash
# Install Heroku CLI if not installed
# Download from: https://devcenter.heroku.com/articles/heroku-cli

# Login and connect to your app
heroku login
heroku git:remote -a beetagged-app

# Copy the fixed code
cp DEPLOY-FIXED-CODE.js index.js

# Deploy the fix
git add index.js
git commit -m "Fix MongoDB Atlas timeout issues - add connection protection"
git push heroku main

# Monitor deployment
heroku logs --tail
```

### Method 2: GitHub Integration

If your Heroku app is connected to GitHub:

1. Push the `DEPLOY-FIXED-CODE.js` content to your GitHub repository as `index.js`
2. Heroku will automatically deploy from the connected branch

### Method 3: Manual File Upload

1. Go to https://dashboard.heroku.com/apps/beetagged-app
2. Navigate to "Deploy" tab
3. Use manual deploy or connect to GitHub repository

## What the Fix Includes

✅ **5-second timeout protection** for MongoDB operations
✅ **Connection state validation** before database queries  
✅ **Graceful error responses** with proper HTTP status codes
✅ **Enhanced MongoDB connection options** for Atlas compatibility
✅ **Detailed logging** for connection debugging

## Expected Results After Deployment

### Before Fix (Current Heroku State)
```bash
curl https://beetagged-app-53414697acd3.herokuapp.com/health
# Times out after 60 seconds
```

### After Fix (Target State)
```bash
curl https://beetagged-app-53414697acd3.herokuapp.com/health
# Returns immediately:
{
  "status": "healthy",
  "server": "BeeTagged",
  "contacts": 3,
  "mongodb": "connected"
}
```

## Test Commands Post-Deployment

```bash
# Health check - should return immediately
curl https://beetagged-app-53414697acd3.herokuapp.com/health

# Contacts API - should handle timeouts gracefully
curl https://beetagged-app-53414697acd3.herokuapp.com/api/contacts

# Search functionality
curl "https://beetagged-app-53414697acd3.herokuapp.com/api/search/natural?q=google"
```

## MongoDB Atlas Configuration Checklist

Ensure these settings in your MongoDB Atlas dashboard:

1. **Network Access**: 
   - IP Whitelist includes `0.0.0.0/0` (allow all)
   - Or specific Heroku IP ranges

2. **Database Access**:
   - User has `readWrite` permissions
   - Password doesn't contain special characters that need URL encoding

3. **Cluster Status**:
   - Cluster is running (not paused)
   - Using M0 Sandbox or higher tier

4. **Connection String**:
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/database`
   - Includes proper database name
   - Uses SRV connection format

## Deployment Priority

The production fix eliminates the 60-second timeout by:
- Adding timeout protection to all MongoDB operations
- Providing immediate feedback on connection status
- Graceful degradation when database is unavailable
- Proper HTTP status codes for different error conditions

This ensures your Squarespace widget will work reliably with the production Heroku backend.