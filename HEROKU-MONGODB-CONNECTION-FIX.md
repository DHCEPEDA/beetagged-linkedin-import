# Fix Heroku MongoDB Connection Issue

## Problem Identified
Your Heroku backend is running but can't connect to MongoDB Atlas:
- Server Status: **LIVE** ✅
- MongoDB Status: **DISCONNECTED** ❌
- Contact Count: 0 (should be 5432)

## Fix: Set MongoDB Environment Variable

### Step 1: Check Current Config
```bash
# See what environment variables are set
heroku config
```

### Step 2: Set MongoDB URI
```bash
# Set your MongoDB Atlas connection string
heroku config:set MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/beetagged?retryWrites=true&w=majority"

# Also set these for completeness
heroku config:set NODE_ENV="production"
```

### Step 3: Restart Heroku App
```bash
# Restart the app to pick up new environment variable
heroku restart

# Check logs for connection status
heroku logs --tail
```

### Step 4: Verify Fix
```bash
# Test health endpoint - should show connected MongoDB
curl https://beetagged-app-53414697acd3.herokuapp.com/health

# Should return:
# {"status":"healthy","mongodb":"connected","contacts":5432}
```

## Common MongoDB Connection String Issues

### Format Check:
Your connection string should look like:
```
mongodb+srv://username:password@cluster.mongodb.net/beetagged?retryWrites=true&w=majority
```

### Troubleshooting:
1. **Special Characters**: URL-encode password if it contains special characters
2. **Database Name**: Ensure "beetagged" matches your actual database name
3. **Network Access**: Check MongoDB Atlas allows connections from 0.0.0.0/0
4. **User Permissions**: Verify database user has read/write access

### MongoDB Atlas Security Settings:
- Go to Network Access → Add IP Address → Allow access from anywhere (0.0.0.0/0)
- Go to Database Access → Ensure user has "Atlas admin" or "Read and write to any database" role

Once the MongoDB connection is fixed, all your API endpoints will work properly.