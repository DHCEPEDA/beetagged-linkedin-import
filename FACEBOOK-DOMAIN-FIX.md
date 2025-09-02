# Facebook Integration Domain Fix 🔧

## Problem
**Error**: "JSSDK Unknown Host domain - The Domain you are hosting the Facebook Javascript SDK is not in your app's Javascript SDK host domain list."

## Root Cause
The current domains being used by BeeTagged are not registered in the Facebook App's JavaScript SDK host domain list.

## Facebook App Configuration Required

### App ID: `1222790436230433`

### Domains to Add in Facebook Developer Console:

#### 1. Production Domain (Heroku)
- **Domain**: `beetagged-app-53414697acd3.herokuapp.com`
- **Purpose**: Production deployment backend

#### 2. Replit Development Domains
- **Domain**: `replit.dev` (covers all Replit subdomains)
- **Domain**: `repl.co` (covers all legacy Replit domains)
- **Purpose**: Development and testing

#### 3. Squarespace Deployment Domains
- **Domain**: Any Squarespace website domain where the widget is embedded
- **Examples**: `yoursite.squarespace.com`, `yourcustomdomain.com`
- **Purpose**: Widget hosting on customer sites

## Steps to Fix

### Step 1: Facebook Developer Console Setup
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Navigate to your app: `1222790436230433`
3. Go to **Settings** → **Basic**
4. Find **App Domains** section
5. Add these domains:
   ```
   beetagged-app-53414697acd3.herokuapp.com
   replit.dev
   repl.co
   squarespace.com
   localhost
   ```

### Step 2: JavaScript SDK Settings
1. In the same Facebook app settings
2. Go to **Products** → **Facebook Login** → **Settings**
3. In **Valid OAuth Redirect URIs**, add:
   ```
   https://beetagged-app-53414697acd3.herokuapp.com/api/facebook/callback
   https://*.replit.dev/api/facebook/callback
   https://*.repl.co/api/facebook/callback
   http://localhost:5000/api/facebook/callback
   ```

### Step 3: Site URL Configuration
1. In **Settings** → **Basic**
2. Set **Site URL** to: `https://beetagged-app-53414697acd3.herokuapp.com`
3. Set **Privacy Policy URL** (required for public apps)

## Current Backend Configuration ✅

The backend is correctly configured with dynamic domain detection:

```javascript
// Facebook OAuth initiation (index.js line ~1117)
app.get('/api/facebook/auth', (req, res) => {
  const fbAppId = process.env.FACEBOOK_APP_ID; // 1222790436230433
  const redirectUri = req.get('origin') + '/api/facebook/callback';
  
  const params = new URLSearchParams({
    client_id: fbAppId,
    redirect_uri: redirectUri,
    scope: 'public_profile,email,user_friends',
    response_type: 'code',
    state: 'beetagged_facebook_auth'
  });
  
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  res.json({ authUrl });
});
```

## Environment Variables ✅
```
FACEBOOK_APP_ID=1222790436230433
FACEBOOK_APP_SECRET=●●●●●●●● (configured)
```

## Testing After Fix
Once Facebook app domains are configured, test with:
```bash
curl -s "https://beetagged-app-53414697acd3.herokuapp.com/api/facebook/auth"
```

Should return a valid OAuth URL without domain errors.

## Alternative Solution (If Admin Access Unavailable)
If you don't have admin access to the Facebook app `1222790436230433`, create a new Facebook app with:
1. Same configuration
2. Your own domains pre-configured
3. Update `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET` environment variables

## Security Notes
- Keep `FACEBOOK_APP_SECRET` secure and never expose in client-side code
- Use HTTPS for all redirect URIs in production
- Regularly review and update authorized domains

**Status**: Backend correctly configured, requires Facebook app domain authorization