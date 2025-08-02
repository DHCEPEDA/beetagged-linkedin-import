# Deploy CORS Fix to Heroku

## No Separate File Needed
The CORS fix is already built into your `index.js` file. You just need to deploy the updated code.

## How to Deploy the Fix:

### Method 1: Git Push (Recommended)
```bash
git add index.js
git commit -m "Fix CORS for Squarespace"
git push heroku main
```

### Method 2: Heroku CLI
```bash
heroku builds:create
```

### Method 3: Manual Upload
If you don't have Git access:
1. Go to your Heroku dashboard
2. Find your app "beetagged-app"
3. Go to Deploy tab
4. Upload the updated `index.js` file

## What Gets Updated:
- Your `index.js` file with the new CORS settings
- Heroku automatically restarts your app
- The backend will now accept connections from Squarespace

## After Deployment:
1. Wait 2-3 minutes for Heroku to restart
2. Test: `curl https://beetagged-app-53414697acd3.herokuapp.com/health`
3. Refresh your Squarespace page
4. Should show "Connected" instead of "Backend Offline"

## Current Status:
- ✅ CORS fix applied to code
- ⏳ Needs deployment to Heroku
- ✅ Squarespace bundle ready

The fix is already in your code, it just needs to go live on Heroku!