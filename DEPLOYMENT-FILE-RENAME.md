# 📁 File Renaming for Heroku Deployment

## Required File Renames:

### For Express Frontend Deployment:

```bash
# 1. Package configuration
frontend-package.json → package.json

# 2. Main server file  
frontend-server.js → server.js

# 3. Heroku process file
Procfile-frontend → Procfile

# 4. Keep as is
index.html (no rename needed)
static.json (if using static approach)
```

## Deployment Steps with Renames:

```bash
# Download files from Replit, then rename:
mv frontend-package.json package.json
mv frontend-server.js server.js
mv Procfile-frontend Procfile

# Deploy to Heroku
git add .
git commit -m "Deploy clean frontend with Express server"
git push heroku main
```

## Why These Names Matter:

- **`package.json`**: Heroku looks for this exact filename for dependencies
- **`server.js`**: Referenced in package.json "start" script  
- **`Procfile`**: Heroku process configuration (no extension)
- **`index.html`**: Vite build entry point (standard name)

## Alternative: Copy Commands
If you prefer copying instead of renaming:
```bash
cp frontend-package.json package.json
cp frontend-server.js server.js  
cp Procfile-frontend Procfile
```

The renamed files will give you a working React frontend deployment on Heroku with clean dependencies and proper Express server handling.