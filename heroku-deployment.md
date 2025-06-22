# BeeTagged Heroku Deployment Guide

## Step 1: Create Heroku Account & Install CLI

1. Go to https://heroku.com and create a free account
2. Install Heroku CLI:
   - **Windows**: Download from https://cli.heroku.com/
   - **Mac**: `brew tap heroku/brew && brew install heroku`
   - **Linux**: `curl https://cli.heroku.com/install.sh | sh`

## Step 2: Deploy BeeTagged

### Option A: One-Click Deploy (Easiest)
1. Click this button: [![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/yourusername/beetagged)
2. Fill in app name: `beetagged-app`
3. Add MongoDB connection string in MONGODB_URI field
4. Click "Deploy app"

### Option B: Manual Deploy
```bash
# Login to Heroku
heroku login

# Create new Heroku app
heroku create beetagged-app

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI="your-mongodb-connection-string"

# Deploy the code (from this Replit)
git init
git add .
git commit -m "Initial BeeTagged deployment"
heroku git:remote -a beetagged-app
git push heroku main
```

## Step 3: Configure Custom Domain

```bash
# Add your custom domain
heroku domains:add beetagged.com
heroku domains:add www.beetagged.com

# Get DNS target
heroku domains
```

## Step 4: Update DNS Settings

In your domain registrar (where you bought beetagged.com):

```
CNAME Record: www.beetagged.com → [heroku-dns-target]
CNAME Record: beetagged.com → [heroku-dns-target]
```

Or use A records if CNAME not supported for root domain.

## Step 5: Enable SSL (Free)

```bash
heroku certs:auto:enable
```

## Step 6: Verify Deployment

1. Visit https://beetagged-app.herokuapp.com
2. Test LinkedIn CSV import functionality
3. Verify search works with imported contacts
4. Check https://beetagged.com after DNS propagation (up to 24 hours)

## Environment Variables Needed

- `NODE_ENV=production`
- `MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/beetagged`

## Heroku App Features

- **Free tier**: 550-1000 dyno hours/month
- **Automatic SSL**: Free certificates for custom domains
- **Git deployment**: Push code changes easily
- **Add-ons**: MongoDB Atlas, Redis, etc.
- **Scaling**: Upgrade to paid plans as needed

## Troubleshooting

- **Build fails**: Check Node.js version compatibility
- **App crashes**: View logs with `heroku logs --tail`
- **Database issues**: Verify MongoDB connection string
- **Domain not working**: Check DNS propagation with `dig beetagged.com`

Your BeeTagged app will be live at both the Heroku URL and your custom domain with full LinkedIn import functionality.