# Deploy BeeTagged to Heroku - Complete Guide

## Prerequisites
1. Create account at https://heroku.com (free)
2. Install Heroku CLI from https://devcenter.heroku.com/articles/heroku-cli

## Quick Deploy Steps

### 1. Login and Create App
```bash
heroku login
heroku create beetagged-app
```

### 2. Set Environment Variables
```bash
heroku config:set NODE_ENV=production -a beetagged-app
heroku config:set MONGODB_URI="your-mongodb-connection-string" -a beetagged-app
```

### 3. Deploy Code
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Deploy BeeTagged to Heroku"

# Connect to Heroku
heroku git:remote -a beetagged-app

# Deploy
git push heroku main
```

### 4. Configure Custom Domain
```bash
# Add domains
heroku domains:add beetagged.com -a beetagged-app
heroku domains:add www.beetagged.com -a beetagged-app

# Get DNS target
heroku domains -a beetagged-app
```

### 5. Update DNS Settings
In your domain registrar, create these records:
```
CNAME: www.beetagged.com → [heroku-dns-target-from-step-4]
CNAME: beetagged.com → [heroku-dns-target-from-step-4]
```

### 6. Enable SSL
```bash
heroku certs:auto:enable -a beetagged-app
```

## Files Ready for Deployment
- `Procfile` - Tells Heroku how to start your app
- `heroku-package.json` - Production dependencies 
- `app.json` - Heroku app configuration
- `index.js` - Your updated server with LinkedIn import fixes

## After Deployment
1. App will be available at: https://beetagged-app.herokuapp.com
2. Custom domain will work at: https://beetagged.com (after DNS propagation)
3. LinkedIn CSV import will save contacts properly
4. Search will use your real imported contacts

## Troubleshooting
- View logs: `heroku logs --tail -a beetagged-app`
- Restart app: `heroku restart -a beetagged-app`
- Check status: `heroku ps -a beetagged-app`

Your BeeTagged app with working LinkedIn import will be live on Heroku with your custom domain.