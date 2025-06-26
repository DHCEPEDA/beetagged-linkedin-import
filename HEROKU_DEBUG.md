# HEROKU H10 DEBUG - Ultra Minimal Test

## Deploy This Minimal Server First

Download these files from Replit:
1. `index-debug.js` → rename to `index.js`
2. `package-debug.json` → rename to `package.json`
3. `Procfile`

## Deployment Commands
```bash
# Create fresh folder with only these 3 files
mkdir heroku-test
cd heroku-test
# Copy the 3 files above
git init
git add .
git commit -m "Debug server test"
heroku git:remote -a beetagged-app
git push heroku main
```

## Check Logs Immediately After Deploy
```bash
heroku logs --tail -a beetagged-app
```

## What to Look For in Logs
✅ **SUCCESS** - Look for: "SUCCESS: Server running on port XXXX"
❌ **FAILURE** - Look for error messages after the npm install

## This Debug Server
- Uses only Express (no other dependencies)
- Has extensive console logging
- Shows exactly where startup fails
- Handles all error conditions

## If This Works
Your app will show "BeeTagged Server Running!" at the URL.

## If This Fails
The logs will show the exact line where startup crashes.

This isolates whether it's a dependency issue, port binding issue, or code execution issue.