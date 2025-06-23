# Facebook API Integration for BeeTagged

## How to Connect Facebook to BeeTagged

Your BeeTagged app now includes Facebook API integration to import your first-degree connections directly into the search system.

### Quick Setup Steps

1. **Access Social Connect Page**
   - Navigate to `/social-connect` in your BeeTagged app
   - Or add a link to this page in your main navigation

2. **Connect Facebook Account**
   - Click "Connect Facebook" button
   - Authorize BeeTagged to access your profile and friends
   - Grant permissions for: profile, friends, work history, education

3. **Import Process**
   - Your Facebook friends will be automatically imported
   - Work history and education data will be extracted
   - Automatic tags will be created for companies, locations, schools

4. **Search Your Facebook Contacts**
   - Use natural language queries like "Who works at Google from Facebook?"
   - Search by company, education, location from Facebook data
   - All imported contacts appear in main search results

### What Gets Imported

**From Your Facebook Profile:**
- Name, profile picture, email
- Current workplace and position
- Education background
- Location information

**From Your Facebook Friends:**
- Basic profile information (limited by Facebook API)
- Work history where available
- Education background
- Location data

**Facebook Business Pages:**
- Pages you manage as business contacts
- Page categories as industry tags
- Business information

### Important Facebook API Limitations

Facebook heavily restricts friend data access since API v2.0. Only friends who have also authorized your app through Facebook Login will appear in the friends list. This is a Facebook policy limitation, not a BeeTagged limitation.

### API Endpoints Added

- `GET /api/facebook/auth-url` - Get Facebook OAuth URL
- `GET /api/facebook/callback` - Handle OAuth callback
- `POST /api/facebook/import` - Import contacts with access token

### Search Integration

Once imported, Facebook contacts are fully integrated into BeeTagged's search system:

- Natural language queries work with Facebook data
- Company filtering includes Facebook workplace data
- Location searches include Facebook location info
- Tag system automatically organizes Facebook contacts

### Privacy & Security

- OAuth 2.0 secure authentication
- Data stored locally in your BeeTagged instance
- No data sharing with third parties
- Disconnect anytime through the social connect page

Your Facebook contacts will now appear in search results alongside LinkedIn imports and manual contacts, giving you a comprehensive view of your professional network.