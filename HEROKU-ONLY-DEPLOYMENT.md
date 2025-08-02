# Heroku-Only Deployment Configuration

## Deployment Strategy: Heroku Exclusive

All production and pre-production deployments now target Heroku exclusively. No Replit server dependencies remain.

### Backend Configuration:
- **Production**: https://beetagged-app-53414697acd3.herokuapp.com
- **Development**: Uses same Heroku backend (no local dependencies)
- **APIs**: All endpoints served from Heroku exclusively

### Heroku Deployment Commands:

#### Initial Setup:
```bash
# Configure environment variables
heroku config:set MONGODB_URI="mongodb+srv://your-atlas-connection"
heroku config:set NODE_ENV="production"
heroku config:set SESSION_SECRET="your-session-secret"

# Deploy to Heroku
git add .
git commit -m "Heroku-only deployment configuration"
git push heroku main:main
```

#### Verify Deployment:
```bash
# Test all endpoints
curl https://beetagged-app-53414697acd3.herokuapp.com/health
curl https://beetagged-app-53414697acd3.herokuapp.com/api/contacts
curl "https://beetagged-app-53414697acd3.herokuapp.com/api/search/natural?q=Google"
```

### Frontend Configuration:
- React bundle configured to use Heroku backend exclusively
- No localhost or Replit server references
- Squarespace integration points to Heroku APIs only

### Build Process:
1. **BuildSquarespaceBundle**: Creates production bundle for Heroku backend
2. **Upload to Squarespace**: Bundle connects directly to Heroku
3. **No Local Dependencies**: Complete cloud-based architecture

### Environment Variables Required on Heroku:
- `MONGODB_URI`: MongoDB Atlas connection string
- `NODE_ENV`: Set to "production"
- `SESSION_SECRET`: For user sessions (if implementing auth)

All systems now exclusively use Heroku infrastructure.