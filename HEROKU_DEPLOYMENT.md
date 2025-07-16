# BeeTagged Heroku Production Deployment

## Quick Deploy to Heroku

### 1. Create Heroku App
```bash
heroku create your-beetagged-app
```

### 2. Add MongoDB Atlas Database
```bash
heroku addons:create mongolab:sandbox
# OR set your own MongoDB URI:
heroku config:set MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/beetagged"
```

### 3. Set Environment Variables
```bash
heroku config:set NODE_ENV=production
heroku config:set OPENAI_API_KEY=your_openai_key_here
```

### 4. Deploy
```bash
git add .
git commit -m "Production deployment"
git push heroku main
```

### 5. Open Your App
```bash
heroku open
```

## Your App URLs
- **Main App**: `https://your-beetagged-app.herokuapp.com/`
- **LinkedIn Import**: `https://your-beetagged-app.herokuapp.com/squarespace-linkedin-import`
- **Health Check**: `https://your-beetagged-app.herokuapp.com/health`

## Production Features
✅ **MongoDB Atlas Integration** - Persistent contact storage
✅ **Compression Enabled** - Faster loading times
✅ **Production Error Handling** - Graceful failure recovery
✅ **Heroku Optimized** - Proper port binding and process management
✅ **CSV Import** - LinkedIn connections import working
✅ **React Build** - Webpack production build included

## Environment Variables Required
- `MONGODB_URI` - MongoDB connection string
- `NODE_ENV` - Set to "production"
- `OPENAI_API_KEY` - For AI-powered tag generation (optional)

## Post-Deployment
1. Test the health endpoint: `curl https://your-app.herokuapp.com/health`
2. Upload a LinkedIn CSV to test imports
3. Update your Squarespace widget with the new Heroku URLs
4. Monitor logs: `heroku logs --tail`

## Database Schema
Contacts are stored in MongoDB with:
- `id` (Number) - Unique identifier
- `name` (String) - Contact name
- `email` (String) - Email address
- `company` (String) - Company name
- `position` (String) - Job title
- `location` (String) - Geographic location
- `tags` (Array) - Auto-generated tags
- `source` (String) - Import source (linkedin_csv)
- `createdAt` (Date) - Creation timestamp

## Monitoring
- Health check: `/health`
- Contact count: included in health response
- Database status: included in health response
- Uptime: included in health response