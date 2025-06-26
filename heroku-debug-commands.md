# Heroku Debug Commands - Run These on Your PC

## Get Error Details
```bash
heroku logs --tail -a beetagged-app
```

## Check App Status
```bash
heroku ps -a beetagged-app
```

## Common Runtime Issues & Fixes

### Issue 1: Missing Environment Variables
```bash
# Check current config
heroku config -a beetagged-app

# Add missing MongoDB connection
heroku config:set MONGODB_URI="your-mongodb-connection-string" -a beetagged-app
```

### Issue 2: Port Binding Error
The app might be trying to use the wrong port. Check if your `index.js` has:
```javascript
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
```

### Issue 3: Database Connection Failure
```bash
# Set MongoDB URI if missing
heroku config:set MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/beetagged" -a beetagged-app
```

### Issue 4: File Path Issues
Check if `server/` folder files are being found correctly.

## Restart App After Fixes
```bash
heroku restart -a beetagged-app
```

## View Real-time Logs
```bash
heroku logs --tail -a beetagged-app
```

Run the first command to see the actual error message, then we can fix it specifically.