# BeeTagged.com Deployment Guide

## LinkedIn Import Fix Deployment

Your BeeTagged.com domain needs to be updated with the latest server code that includes the LinkedIn import data persistence fixes.

### Files Ready for Deployment

The `deploy-folder` contains your complete production-ready BeeTagged application:

- `beetagged-production.js` - Updated server with LinkedIn import fixes
- `bundle.js` - React application bundle
- `index.html` - Main application page
- `package.json` - Production dependencies
- `images/` - Application assets

### Deployment Options

#### Option 1: Replit Deployment (Recommended)
1. Use Replit's built-in deployment system
2. Set custom domain to beetagged.com in deployment settings
3. Deploy the current project with updated code

#### Option 2: Transfer to External Host
1. Upload all files from `deploy-folder` to your web hosting provider
2. Install Node.js dependencies: `npm install`
3. Start server: `npm start`
4. Point beetagged.com DNS to new server IP

#### Option 3: Update Existing Server
1. Replace server files on current beetagged.com hosting
2. Restart the application server
3. Verify LinkedIn import functionality

### DNS Configuration

Ensure beetagged.com points to the server running the updated code:

```
A Record: beetagged.com → [Server IP]
CNAME: www.beetagged.com → beetagged.com
```

### Verification Steps

After deployment, test:

1. Visit https://beetagged.com
2. Register/login to the application
3. Upload LinkedIn CSV file
4. Verify contacts are saved and searchable
5. Test search queries like "Who works at Google?"

### Environment Requirements

- Node.js 16+
- Port 5000 (or configured PORT environment variable)
- File upload permissions for CSV processing

The updated server includes all LinkedIn import fixes and will properly save imported contacts to the search system.