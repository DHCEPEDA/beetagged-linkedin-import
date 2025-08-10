# BeeTagged Squarespace Deployment Files

## Widget Files for Squarespace

### 1. Enhanced Facebook Integration Widget: `SQUARESPACE-FACEBOOK-ENHANCED.html`
- Complete widget with enhanced Facebook integration
- Dual OAuth flow support
- Friend access capabilities
- Profile picture imports
- Ready for Header Code Injection

### 2. Production Widget with All Features: `SQUARESPACE-DUAL-WORKING.html`
- Previously tested and confirmed working
- LinkedIn CSV import with duplicate detection
- Natural language search
- Baseball card contact views

### 3. Simple Test Widget: `SQUARESPACE-WORKING-SIMPLE.html`
- Minimal version for basic functionality testing
- Good for initial setup verification

## Deployment Methods

### Method 1: Header Code Injection (RECOMMENDED)
1. Go to Squarespace → Settings → Advanced → Code Injection
2. Paste the complete HTML from `SQUARESPACE-FACEBOOK-ENHANCED.html` in Header section
3. Save and publish

### Method 2: Page HTML Block
1. Add HTML block to any page
2. Paste the widget code
3. May have some style limitations

### Method 3: Code Block (Premium Plans Only)
1. Add Code Block to page
2. Paste widget HTML
3. Full functionality available

## Backend Configuration

Update the BACKEND_URL in each Squarespace file:
```javascript
const BACKEND_URL = 'https://your-heroku-app.herokuapp.com';
```

Replace with your actual Heroku deployment URL.

## Facebook App Configuration

Make sure your Facebook App includes these settings:
- App ID: 1222790436230433
- Valid OAuth Redirect URIs:
  - https://your-heroku-app.herokuapp.com/api/facebook/callback
  - https://your-squarespace-site.com
- App Domains: your-squarespace-site.com
- Permissions: public_profile, email, user_friends

## Files to Use:

### For Full Enhanced Experience:
- `SQUARESPACE-FACEBOOK-ENHANCED.html` - Latest with Facebook friends integration

### For Tested Stable Version:
- `SQUARESPACE-DUAL-WORKING.html` - Proven working version with LinkedIn import

### For Simple Testing:
- `SQUARESPACE-WORKING-SIMPLE.html` - Basic functionality only