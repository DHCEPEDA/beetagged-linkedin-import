# Fix MongoDB Connection on Heroku

## Current Status: DISCONNECTED
Your Heroku app shows: `"mongodb":"disconnected","mongoState":0`

## Fix Commands (Run These in Order):

### 1. Check Current Environment Variables
```bash
heroku config
```
*This shows what environment variables are currently set*

### 2. Set MongoDB URI Environment Variable
```bash
# Replace with your actual MongoDB Atlas connection string
heroku config:set MONGODB_URI="mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/beetagged?retryWrites=true&w=majority"

# Example format:
# heroku config:set MONGODB_URI="mongodb+srv://beetagged_user:mypassword123@cluster0.abc123.mongodb.net/beetagged?retryWrites=true&w=majority"
```

### 3. Restart Heroku App
```bash
heroku restart
```

### 4. Check Logs for Connection Status
```bash
heroku logs --tail
```
*Watch for MongoDB connection messages*

### 5. Test Connection
```bash
curl https://beetagged-app-53414697acd3.herokuapp.com/health
```

## Expected Result After Fix:
```json
{
  "status": "healthy",
  "server": "BeeTagged",
  "contacts": 5432,
  "mongodb": "connected",
  "mongoState": 1,
  "environment": "production"
}
```

## Get Your MongoDB Connection String:

### From MongoDB Atlas:
1. Go to cloud.mongodb.com
2. Click your cluster name
3. Click "Connect" button
4. Choose "Connect your application"
5. Copy the connection string
6. Replace `<username>`, `<password>`, and `<dbname>` with actual values

### Connection String Format:
```
mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/DATABASE?retryWrites=true&w=majority
```

**Important:** 
- USERNAME = Your MongoDB database user (not Atlas login)
- PASSWORD = Your MongoDB database user password
- CLUSTER = Your cluster address (like cluster0.abc123)
- DATABASE = beetagged

## If Still Not Working:

### Check MongoDB Atlas Settings:
1. **Network Access**: Add IP address `0.0.0.0/0` (allow from anywhere)
2. **Database Access**: Ensure user has "Read and write to any database" role

Run these commands and your MongoDB connection should work!