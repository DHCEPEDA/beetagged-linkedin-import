# Simple Heroku Deployment - 3 Files Only

## Upload These 3 Files to Heroku:

### 1. index.js
Replace your current `index.js` with the content from `HEROKU-DEPLOYMENT-FINAL.js`

### 2. package.json  
Keep your existing `package.json` (already has all needed dependencies)

### 3. Procfile
Update to: `web: node index.js`

## Deploy Commands:
```bash
# Copy fixed backend
cp HEROKU-DEPLOYMENT-FINAL.js index.js

# Deploy to Heroku
git add index.js Procfile
git commit -m "Deploy fixed backend"  
git push heroku main
```

## Test After Deploy:
```bash
curl https://beetagged-app-53414697acd3.herokuapp.com/health
```
Should return: `{"status":"healthy","contacts":X}`

## Then Use Squarespace Widget:
Copy `SQUARESPACE-PRODUCTION-WIDGET.html` content into your Squarespace Code Block.

**That's it!** Widget will connect to your Heroku backend with MongoDB Atlas.