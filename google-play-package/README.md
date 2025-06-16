# BeeTagged - Google Play Testing Package

## Quick Start for Mobile Testing

### APK Installation
1. Download `BeeTagged-Latest.apk` to your Android device
2. Enable "Install from unknown sources" in Android Settings > Security
3. Tap the APK file to install
4. Launch BeeTagged from your app drawer

### Test the Core Features

**Login/Registration**
- Use any email/password (e.g., test@example.com / password123)
- Registration creates new account, login authenticates existing

**Smart Contact Search**
- Try: "Who works at Google?" → Returns John Smith & Sarah Chen
- Try: "Marketing professionals" → Returns Michael Rodriguez  
- Try: "JavaScript" → Returns contacts with JavaScript skills

**Contact Management**
- View contact list with intelligent tags
- Add new contacts manually
- Create custom tags with colors
- Import LinkedIn CSV files

### Server Details
- Live server: https://d49cd8c1-1139-4a7e-96a2-5d125f417ecd-00-3ftoc46fv9y6p.riker.replit.dev
- Authentication: /api/auth/login, /api/auth/register
- Search: /api/search/natural
- Contacts: /api/contacts
- Tags: /api/tags

### Google Play Console Setup
1. Create new app in Google Play Console
2. Upload `BeeTagged-Latest.apk` to Internal Testing
3. Add tester email addresses
4. Use store listing content from `app-store-listing.md`
5. Complete testing checklist from `testing-checklist.md`

### Key Features Working
- Natural language contact search with proper filtering
- LinkedIn CSV import with auto-tagging  
- Contact and tag management
- Authentication system
- Social media integration interfaces
- Real-time search with relevance scoring

The app connects to the live server for all functionality. Demo data loads automatically for immediate testing of search features.