# Heroku Deployment - Required Files

## **Essential Files for Production Deployment:**

### **1. Backend Core (MUST UPLOAD):**
- ✅ **`index.js`** - Enhanced server with LLM features, duplicate detection, baseball card details
- ✅ **`package.json`** - Dependencies and build scripts
- ✅ **`Procfile`** - Heroku process definition

### **2. Model Definitions:**
- ✅ **`models/Contact.js`** - MongoDB contact schema (if exists)
- ✅ Any other model files in `/models/` directory

### **3. Utility Files:**
- ✅ **`utils/`** - Any utility functions used by the backend
- ✅ **`routes/`** - Additional route definitions (if separated)
- ✅ **`services/`** - Service layer files (if exists)

### **4. Configuration Files:**
- ✅ **`.env`** - Environment variables (contains secrets)
- ✅ **`package-lock.json`** - Exact dependency versions

## **Files NOT Needed for Heroku:**

### **Frontend Build Files (Already Bundled):**
- ❌ `src/` - React components (compiled into bundle)
- ❌ `dist/` - Build output (not used on server)
- ❌ `node_modules/` - Auto-installed by Heroku
- ❌ TypeScript config files - Not needed for production
- ❌ Vite config files - Frontend build tool only

## **Critical Files Status:**

### **`index.js` - ⭐ PRIORITY 1**
Contains these enhanced features:
- LLM-powered duplicate detection endpoints
- Baseball card contact detail API
- Enhanced LinkedIn CSV processing  
- Fixed email extraction (Michael Higgins)
- Improved error handling and timeouts

### **`package.json` - ⭐ PRIORITY 2**
Includes all required dependencies:
```json
"openai": "^5.10.2",
"mongoose": "^8.16.4", 
"express": "^4.21.2",
"multer": "^1.4.5-lts.2"
```

### **`Procfile` - ⭐ PRIORITY 3**
Should contain:
```
web: node index.js
```

## **Environment Variables (Set in Heroku Dashboard):**
- `MONGODB_URI` - MongoDB Atlas connection
- `OPENAI_API_KEY` - For LLM duplicate detection
- `NODE_ENV=production`
- Any other secrets from `.env`

## **Git Upload Command:**
```bash
git add index.js package.json Procfile models/ utils/ routes/ services/
git commit -m "Deploy enhanced BeeTagged with LLM features"
git push heroku main
```

## **Deployment Order:**
1. Upload `index.js` (contains all new features)
2. Upload `package.json` (dependencies)
3. Upload `Procfile` (process definition)
4. Upload any model/utility files
5. Set environment variables in Heroku dashboard
6. Deploy to Heroku

The enhanced backend will immediately activate:
- Fixed CSV uploads in Squarespace
- LLM-powered duplicate detection
- Baseball card contact details
- Better LinkedIn CSV processing