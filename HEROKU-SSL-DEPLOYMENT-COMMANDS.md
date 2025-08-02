# Complete Heroku SSL Deployment Commands

## Step 1: Deploy with SSL Configuration

```bash
# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI="your-mongodb-atlas-connection-string"

# Deploy to Heroku
git add .
git commit -m "SSL configuration and HTTPS redirect added"
git push heroku main:main
```

## Step 2: Enable Automatic SSL

```bash
# Enable automatic SSL certificates (free on paid dynos)
heroku certs:auto:enable

# Check SSL status
heroku certs:auto

# Verify SSL certificate
heroku certs
```

## Step 3: Test SSL Configuration

```bash
# Test HTTPS endpoint
curl -I https://beetagged-app-53414697acd3.herokuapp.com/health

# Test HTTP redirect (should redirect to HTTPS)
curl -I http://beetagged-app-53414697acd3.herokuapp.com/health
```

## Step 4: Verify Security Headers

```bash
# Check security headers
curl -I https://beetagged-app-53414697acd3.herokuapp.com/health
```

Should see headers like:
- `strict-transport-security: max-age=31536000; includeSubDomains`
- `x-content-type-options: nosniff`
- `x-frame-options: DENY`

## Important Notes:

1. **SSL requires paid dyno**: Free dynos don't support SSL
   ```bash
   heroku ps:scale web=1:eco  # Upgrade to Eco dyno ($5/month)
   ```

2. **SSL certificate provisioning**: Takes 24-48 hours for full activation

3. **Mixed content**: Ensure your React app uses HTTPS URLs (already configured)

Your BeeTagged backend will have full SSL protection once deployed!