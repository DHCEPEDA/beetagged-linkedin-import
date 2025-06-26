# FINAL HEROKU DEPLOYMENT - Step by Step

## The Problem
You're still using a package.json with webpack build scripts. The error shows:
```
> npm run build
> npx webpack --config webpack.heroku.config.js
```

This means you didn't use the simplified package.json I created.

## The Solution - Use NO BUILD Package

### Step 1: Use the Correct Package.json
Download `deploy-ready-package.json` from Replit and rename it to `package.json`. This file contains:

```json
{
  "name": "beetagged",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "engines": {
    "node": "18.x"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.2",
    "csv-parser": "^3.2.0",
    "mongoose": "^8.13.2",
    "dotenv": "^16.5.0",
    "compression": "^1.8.0",
    "axios": "^1.9.0"
  }
}
```

### Step 2: Essential Files Only
Create a new deployment folder with ONLY these files:
- `package.json` (the one above - NO webpack, NO build scripts)
- `index.js`
- `Procfile`
- `server/` folder (entire folder)
- `public/` folder (entire folder)

**DO NOT INCLUDE:**
- Any webpack files
- Any React build files
- Any babel configuration
- Any development dependencies

### Step 3: Deploy Commands
```bash
# Create completely fresh folder
mkdir beetagged-simple
cd beetagged-simple

# Copy ONLY the 5 items listed above
# Make sure package.json has NO build or webpack references

git init
git add .
git commit -m "Deploy BeeTagged server only - no webpack"
heroku git:remote -a beetagged-app
git push heroku main
```

## Critical: What the Package.json Must Look Like
Your package.json should have ONLY a "start" script - nothing else:
```json
"scripts": {
  "start": "node index.js"
}
```

NO "build", NO "heroku-postbuild", NO webpack references.

## Expected Result
- App deploys successfully to `https://beetagged-app.herokuapp.com`
- Server runs your Node.js code
- Facebook integration works at `/social-connect`
- LinkedIn import works at `/li-import`
- All API endpoints functional