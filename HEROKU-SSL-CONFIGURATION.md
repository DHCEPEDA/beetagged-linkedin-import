# Heroku SSL Configuration Guide

## Automatic SSL (Recommended - Free)

Heroku provides automatic SSL certificates for all apps on paid dynos:

### Step 1: Enable Automatic SSL
```bash
# Enable automatic SSL certificates
heroku certs:auto:enable

# Check SSL status
heroku certs:auto
```

### Step 2: Verify SSL Configuration
```bash
# Check your app's SSL status
heroku certs

# Test your SSL endpoint
curl -I https://beetagged-app-53414697acd3.herokuapp.com/health
```

## Manual SSL Certificate (If Needed)

If you have a custom domain or need specific SSL configuration:

### Step 1: Add Custom Domain
```bash
# Add your custom domain
heroku domains:add yourdomain.com
heroku domains:add www.yourdomain.com

# Get DNS targets for your domain
heroku domains
```

### Step 2: Configure DNS
Update your domain's DNS records to point to Heroku:
- Create CNAME record: `www` → `your-heroku-app.herokuapp.com`
- Create ALIAS/ANAME record: `@` → `your-heroku-app.herokuapp.com`

### Step 3: Enable SSL for Custom Domain
```bash
# Enable SSL for custom domain
heroku certs:auto:enable --domain yourdomain.com
```

## Environment Configuration

Ensure your app is configured for HTTPS:

### Update Your Backend Code
```javascript
// In your Express app (index.js)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

### Set Environment Variables
```bash
heroku config:set NODE_ENV=production
heroku config:set FORCE_HTTPS=true
```

## Verification Steps

### 1. Test SSL Certificate
```bash
# Check SSL certificate details
openssl s_client -connect beetagged-app-53414697acd3.herokuapp.com:443 -servername beetagged-app-53414697acd3.herokuapp.com
```

### 2. Test HTTP to HTTPS Redirect
```bash
# This should redirect to HTTPS
curl -I http://beetagged-app-53414697acd3.herokuapp.com/health
```

### 3. Verify in Browser
- Visit: https://beetagged-app-53414697acd3.herokuapp.com/health
- Check for green lock icon in browser
- Verify certificate is valid

## Common SSL Issues

### Issue: "SSL Unavailable"
**Solution**: SSL requires a paid Heroku dyno (Eco, Basic, or higher)
```bash
heroku ps:scale web=1:eco
```

### Issue: Mixed Content Warnings
**Solution**: Ensure all API calls use HTTPS in your frontend
```javascript
// Update your React app to use HTTPS
export const BACKEND_URL = 'https://beetagged-app-53414697acd3.herokuapp.com';
```

### Issue: Certificate Not Trusted
**Solution**: Wait 24-48 hours for SSL certificate provisioning, or check domain configuration

## Security Headers (Optional)

Add security headers to your Express app:
```javascript
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});
```

Your BeeTagged app will have full SSL protection once configured!