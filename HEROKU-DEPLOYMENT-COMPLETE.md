# BeeTagged Heroku Deployment Files

## Files to Upload to Heroku

### 1. Main Backend File: `index.js`
- Copy the entire contents of `backend-complete-fixed.js` to `index.js`
- This is your main server file with all endpoints

### 2. Package Configuration: `package.json`
```json
{
  "name": "beetagged-backend",
  "version": "1.0.0",
  "description": "BeeTagged Professional Contact Management Backend",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "multer": "^1.4.5",
    "csv-parser": "^3.0.0",
    "cors": "^2.8.5",
    "express-rate-limit": "^6.10.0",
    "helmet": "^7.0.0",
    "compression": "^1.7.4",
    "morgan": "^1.10.0",
    "axios": "^1.5.0"
  },
  "engines": {
    "node": "18.x"
  }
}
```

### 3. Environment Variables to Set in Heroku
```
MONGODB_URI=mongodb+srv://dhcepe:your-password@beetagged.your-cluster.mongodb.net/beetagged?retryWrites=true&w=majority
NODE_ENV=production
FACEBOOK_APP_ID=1222790436230433
FACEBOOK_APP_SECRET=your-facebook-app-secret
PORT=5000
```

### 4. Deployment Commands
```bash
# Initialize git repository
git init
git add .
git commit -m "Initial deployment"

# Create Heroku app
heroku create beetagged-backend-enhanced

# Set environment variables
heroku config:set MONGODB_URI="your-mongodb-uri"
heroku config:set FACEBOOK_APP_ID="1222790436230433"
heroku config:set FACEBOOK_APP_SECRET="your-facebook-secret"
heroku config:set NODE_ENV="production"

# Deploy
git push heroku main
```

## Files Structure for Heroku:
```
beetagged-heroku/
├── index.js (copy from backend-complete-fixed.js)
├── package.json
└── .env (for local testing only, not uploaded)
```