# Heroku Deployment Commands - BeeTagged Fixed Backend

## Deploy the Fixed Backend to Heroku

### 1. Replace index.js with Fixed Version
```bash
# Copy the complete fixed backend
cp HEROKU-DEPLOYMENT-FINAL.js index.js
```

### 2. Commit and Deploy to Heroku
```bash
# Add all changes
git add .

# Commit with clear message
git commit -m "Fix CSV import and MongoDB schema issues - production ready"

# Deploy to Heroku
git push heroku main
```

### 3. Verify Environment Variables
```bash
# Check MongoDB URI is set
heroku config:get MONGODB_URI

# Set if missing
heroku config:set MONGODB_URI="your_mongodb_atlas_connection_string"

# Set production environment
heroku config:set NODE_ENV=production
```

### 4. Monitor Deployment
```bash
# Watch build logs
heroku logs --tail

# Check app status
heroku ps

# Test health endpoint
curl https://beetagged-app-53414697acd3.herokuapp.com/health
```

### 5. Test CSV Import
```bash
# Create test CSV
echo "First Name,Last Name,Email Address,Company,Position,Connected On
Test,User,test@example.com,TestCorp,Developer,01/01/2024" > test.csv

# Test upload
curl -X POST -F "linkedinCsv=@test.csv" https://beetagged-app-53414697acd3.herokuapp.com/api/import/linkedin
```

## What This Deployment Fixes:

✅ **MongoDB Schema Issues**: Removes problematic `id_1` index causing duplicate key errors  
✅ **CSV Import Format**: Proper LinkedIn CSV format support  
✅ **Timeout Protection**: All database operations have 5-second timeouts  
✅ **Error Handling**: Accurate success/failure feedback  
✅ **Production CORS**: Configured for Heroku and Squarespace domains  
✅ **Enhanced Search**: Natural language search with company/role patterns  

## Expected Results:

- Health check should return `"status":"healthy"` with contact count
- CSV import should work without E11000 duplicate key errors
- Search functionality should find contacts by company, name, role
- Squarespace widget should connect successfully

## Rollback Plan:

If deployment fails, rollback using:
```bash
heroku rollback
```

## Post-Deployment Verification:

1. Health check returns healthy status
2. CSV import accepts LinkedIn format files
3. Search returns results for existing contacts
4. No timeout errors in logs
5. Squarespace widget connects and functions properly