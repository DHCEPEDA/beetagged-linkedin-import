# 🚀 Facebook App Settings for Heroku Production

## Production URLs for Facebook App Configuration

### Your Heroku App URLs:
```
https://your-heroku-app-name.herokuapp.com
https://your-heroku-app-name.herokuapps.com
```

### Facebook App Settings Configuration:

#### 1. App Domains (Settings → Basic)
```
herokuapp.com
herokuapps.com
replit.app
replit.dev
localhost
```

#### 2. Website URL (Settings → Basic)
```
https://your-heroku-app-name.herokuapp.com
```

#### 3. Privacy Policy URL (Settings → Basic - Required for Live Apps)
```
https://your-heroku-app-name.herokuapp.com/privacy
```

#### 4. Facebook Login Settings (Products → Facebook Login → Settings)

**Valid OAuth Redirect URIs:**
```
https://your-heroku-app-name.herokuapp.com/
https://your-heroku-app-name.herokuapps.com/
https://beetagged.replit.app/
http://localhost:5000/
```

**Valid JavaScript SDK Domains:**
```
your-heroku-app-name.herokuapp.com
herokuapp.com
herokuapps.com
replit.app
replit.dev
localhost
127.0.0.1
```

#### 5. App Review Settings
- **App Mode**: Set to "Live" (not Development)
- **Category**: Business
- **Subcategory**: Productivity

## Replace "your-heroku-app-name" with your actual Heroku app name

Example: If your Heroku app is named "beetagged-contacts", use:
- `https://beetagged-contacts.herokuapp.com`
- `beetagged-contacts.herokuapp.com`

## Important Notes:
- Save each section after making changes
- Changes take 5-10 minutes to take effect
- Your app must be in "Live" mode for public use
- Privacy Policy is required for live Facebook apps

After deployment to Heroku, update these URLs with your actual Heroku app name!