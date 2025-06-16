# BeeTagged Mobile Testing Checklist

## Pre-Installation Setup
- [ ] Enable "Install apps from unknown sources" in Android Settings
- [ ] Ensure device has Android 5.0+ (API level 21+)
- [ ] Connect to stable internet connection
- [ ] Have LinkedIn CSV file ready for import testing

## Core Functionality Tests

### Authentication & Onboarding
- [ ] App launches successfully
- [ ] Registration with email works
- [ ] Login with credentials works
- [ ] Proper error handling for invalid credentials
- [ ] Auto-login on app restart

### Contact Search (Primary Feature)
- [ ] Search "Who works at Google?" returns John Smith and Sarah Chen
- [ ] Search "Marketing professionals" returns Michael Rodriguez
- [ ] Search "JavaScript" returns contacts with JavaScript skills
- [ ] Empty search shows all contacts
- [ ] Search results display properly formatted

### Contact Management
- [ ] View contact list
- [ ] Open individual contact details
- [ ] Add new contact manually
- [ ] Edit existing contact
- [ ] Delete contact

### Tag System
- [ ] Create new tag
- [ ] Apply tag to contact
- [ ] Remove tag from contact
- [ ] Delete unused tag
- [ ] Tag color picker works

### LinkedIn Integration
- [ ] Access LinkedIn import page
- [ ] Upload CSV file
- [ ] Process contacts successfully
- [ ] Auto-generated tags appear
- [ ] Download processed data

### Navigation & UI
- [ ] Bottom navigation works (Contact, Search, Rank)
- [ ] Back button functionality
- [ ] Menu options accessible
- [ ] Responsive design on different screen sizes

## Performance Tests
- [ ] App startup time under 3 seconds
- [ ] Search response time under 1 second
- [ ] Smooth scrolling in contact lists
- [ ] No crashes during normal usage
- [ ] Memory usage reasonable

## Network Tests
- [ ] Works on WiFi
- [ ] Works on mobile data
- [ ] Handles network disconnection gracefully
- [ ] Syncs data when connection restored

## Edge Cases
- [ ] Large contact lists (100+ contacts)
- [ ] Special characters in names/companies
- [ ] Empty search results
- [ ] App behavior with no contacts
- [ ] Background/foreground transitions

## Google Play Compatibility
- [ ] All required permissions granted
- [ ] Privacy policy accessible
- [ ] App info displays correctly
- [ ] No crashes on different Android versions
- [ ] Proper app icon and branding

## Test Credentials
Use any email/password combination for testing:
- Username: testuser
- Password: password123
- Email: test@example.com

## Expected Demo Data
After first search, the app should show:
1. John Smith - Software Engineer at Google
2. Sarah Chen - Product Manager at Google  
3. Michael Rodriguez - Marketing Director at Meta
4. Emily Wang - UX Designer at Apple

## Common Issues & Solutions
- **Search shows no results**: Try "Who works at Google?" exactly
- **Can't create tags**: Ensure proper network connection
- **LinkedIn import fails**: Check CSV file format
- **App crashes**: Restart and check device compatibility