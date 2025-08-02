# Connect Heroku to MongoDB Atlas

## Step 1: Get Your MongoDB Atlas Connection String

### From MongoDB Atlas Dashboard:
1. **Login to MongoDB Atlas** (cloud.mongodb.com)
2. **Click "Connect"** on your cluster
3. **Choose "Connect your application"**
4. **Copy the connection string** - looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<database>?retryWrites=true&w=majority
   ```

### Replace Placeholders:
- `<username>` → Your MongoDB user (not your Atlas login)
- `<password>` → Your MongoDB user password
- `<database>` → `beetagged` (your database name)

**Example Result:**
```
mongodb+srv://beetagged_user:mypassword123@cluster0.abc123.mongodb.net/beetagged?retryWrites=true&w=majority
```

## Step 2: Set Environment Variable in Heroku

```bash
# Set the MongoDB connection string
heroku config:set MONGODB_URI="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/beetagged?retryWrites=true&w=majority"

# Also set Node environment
heroku config:set NODE_ENV="production"

# Verify it was set correctly
heroku config
```

## Step 3: Restart and Test

```bash
# Restart Heroku app to pick up new environment variable
heroku restart

# Test the connection (should now show connected)
curl https://beetagged-app-53414697acd3.herokuapp.com/health
```

**Expected Result After Fix:**
```json
{
  "status": "healthy",
  "server": "BeeTagged", 
  "contacts": 5432,
  "mongodb": "connected",
  "mongoState": 1
}
```

## Troubleshooting

### If Connection Still Fails:

**Check Network Access in Atlas:**
1. Go to Network Access in MongoDB Atlas
2. Add IP Address: `0.0.0.0/0` (allow from anywhere)
3. Save changes

**Check Database User:**
1. Go to Database Access in MongoDB Atlas  
2. Ensure user has "Read and write to any database" permissions
3. Note the exact username/password

**Special Characters in Password:**
If password contains special characters, URL encode them:
- `@` becomes `%40`
- `#` becomes `%23` 
- `$` becomes `%24`

Once connected, all your API endpoints will work with the full contact database.