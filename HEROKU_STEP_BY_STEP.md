# BeeTagged Heroku Deployment - Step by Step Guide

## Step 1: Create Heroku Account and Install CLI

### Create Account
1. Go to https://heroku.com
2. Click "Sign up for free"
3. Enter your email, password, and verify account

### Install Heroku CLI
**Windows:**
- Download installer from https://cli.heroku.com/
- Run the downloaded .exe file

**Mac:**
```bash
brew tap heroku/brew && brew install heroku
```

**Linux:**
```bash
curl https://cli.heroku.com/install.sh | sh
```

## Step 2: Prepare Your Code for Deployment

The following files are already created for you:
- ✅ `Procfile` - Tells Heroku how to start your app
- ✅ `app.json` - Heroku app configuration
- ✅ `heroku-package.json` - Production dependencies
- ✅ Server code with Facebook API integration

## Step 3: Deploy to Heroku

### Login to Heroku
```bash
heroku login
```
This opens a browser window - log in with your Heroku credentials.

### Create New Heroku App
```bash
heroku create beetagged-app
```
(Replace "beetagged-app" with your preferred app name if taken)

### Set Environment Variables
```bash
heroku config:set NODE_ENV=production -a beetagged-app
heroku config:set MONGODB_URI="your-mongodb-connection-string" -a beetagged-app
heroku config:set FACEBOOK_APP_ID="your-facebook-app-id" -a beetagged-app
heroku config:set FACEBOOK_APP_SECRET="your-facebook-app-secret" -a beetagged-app
```

### Deploy Your Code

**First, fix the package.json issue:**

1. **Download the corrected package.json from Replit:**
   - In Replit, find the file `package-heroku.json`
   - Download it to your PC
   - Rename it to `package.json`

2. **Create a new folder on your PC for deployment:**
```bash
mkdir beetagged-deploy
cd beetagged-deploy
```

3. **Copy essential files to the deployment folder:**
   - Copy your corrected `package.json` 
   - Copy `index.js`
   - Copy `Procfile`
   - Copy the entire `server/` folder
   - Copy the entire `src/` folder  
   - Copy the entire `public/` folder
   - Copy `webpack.config.js`
   - Copy `.babelrc`

4. **Initialize git and deploy:**
```bash
git init
git add .
git commit -m "Initial BeeTagged deployment"

# Connect to Heroku and deploy
heroku git:remote -a beetagged-app
git push heroku main
```

**Alternative Method - Direct from Replit:**
If you prefer to deploy directly from Replit, run these commands in the Replit shell:

```bash
# Replace the problematic package.json
cp package-heroku.json package.json

# Deploy to Heroku
heroku git:remote -a beetagged-app
git add package.json
git commit -m "Fix package.json for Heroku deployment"
git push heroku main
```

## Step 4: Configure Custom Domain

### Add Your Domain to Heroku
```bash
heroku domains:add beetagged.com -a beetagged-app
heroku domains:add www.beetagged.com -a beetagged-app
```

### Get DNS Target
```bash
heroku domains -a beetagged-app
```
Copy the DNS target (looks like: abc123.herokudns.com)

### Update DNS Settings
In your domain registrar (GoDaddy, Namecheap, etc.):

**Option A: CNAME Records (Recommended)**
```
CNAME: www.beetagged.com → abc123.herokudns.com
CNAME: beetagged.com → abc123.herokudns.com
```

**Option B: A Records (if CNAME not supported for root domain)**
```
A: beetagged.com → [IP from DNS lookup of abc123.herokudns.com]
CNAME: www.beetagged.com → abc123.herokudns.com
```

### Enable SSL (Free)
```bash
heroku certs:auto:enable -a beetagged-app
```

## Step 5: Update Squarespace Embed Code

After deployment, update your Squarespace embed code:

```javascript
// Change this:
const BEETAGGED_SERVER = 'https://d49cd8c1-1139-4a7e-96a2-5d125f417ecd-00-3ftoc46fv9y6p.riker.replit.dev:5000';
const BEETAGGED_APP = 'https://beetagged.com';

// To this:
const BEETAGGED_SERVER = 'https://beetagged.com';
const BEETAGGED_APP = 'https://beetagged.com';
```

## Step 6: Test Your Deployment

### Check App Status
```bash
heroku ps -a beetagged-app
```

### View Logs
```bash
heroku logs --tail -a beetagged-app
```

### Test URLs
1. https://beetagged-app.herokuapp.com (should work immediately)
2. https://beetagged.com (works after DNS propagation, up to 24 hours)

## Step 7: Verify Facebook Integration

1. Test Facebook connect on your Squarespace page
2. Verify LinkedIn CSV import still works
3. Check that search functionality includes Facebook contacts

## Troubleshooting Commands

**Restart App:**
```bash
heroku restart -a beetagged-app
```

**Check Environment Variables:**
```bash
heroku config -a beetagged-app
```

**Scale App (if needed):**
```bash
heroku ps:scale web=1 -a beetagged-app
```

**Database Reset (if needed):**
```bash
heroku config:set RESET_DB=true -a beetagged-app
heroku restart -a beetagged-app
```

## Expected Results

✅ BeeTagged app running at https://beetagged.com
✅ Facebook API integration working
✅ LinkedIn CSV import functional
✅ Search system operational with both data sources
✅ Squarespace embed code connecting to production server
✅ SSL certificates automatically managed
✅ Custom domain fully functional

## Cost Information

- **Free Tier**: 550-1000 dyno hours/month (enough for development/testing)
- **Hobby Tier**: $7/month (24/7 uptime, custom domains, SSL)
- **Production Tier**: $25+/month (better performance, metrics)

Your app will work on the free tier initially, upgrade to Hobby when ready for production use.