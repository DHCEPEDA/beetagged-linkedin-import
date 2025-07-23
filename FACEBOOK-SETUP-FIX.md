# 🔧 Facebook API Error Fix - Domain Authorization

## Current Error:
```
JSSDK Unknown Host domain
The Domain you are hosting the Facebook Javascript SDK is not in your app's Javascript SDK host domain list.
```

## Solution: Add Authorized Domains

You need to add these domains to your Facebook App settings:

### 1. Go to Facebook Developers Console
Visit: https://developers.facebook.com/apps/

### 2. Select Your App
Find your Facebook App ID and click on it

### 3. Add Authorized Domains
Go to **Settings** → **Basic** → **App Domains**

Add these domains:
```
replit.dev
replit.com
replit.app
beetagged.replit.app
localhost
127.0.0.1
```

### 4. Configure JavaScript SDK Settings
Go to **Products** → **Facebook Login** → **Settings**

**Valid OAuth Redirect URIs:**
```
https://beetagged.replit.app/
https://beetagged-app.replit.dev/
http://localhost:5000/
https://localhost:5000/
```

**Valid JavaScript SDK Domains:**
```
replit.dev
replit.com
replit.app
localhost
127.0.0.1
```

### 5. Save Changes
Click "Save Changes" at the bottom of each settings page.

## Additional Settings:
- **App Mode**: Set to "Live" (not Development)
- **Privacy Policy URL**: Add your app's privacy policy URL
- **Terms of Service URL**: Add your terms URL (optional but recommended)

## Important Notes:
- Changes may take 5-10 minutes to take effect
- Make sure your Facebook App ID is correct in the BeeTagged interface
- Facebook only allows access to friends who have also authorized your app (this is a Facebook limitation)

After making these changes, try the Facebook import again with your Facebook App ID!