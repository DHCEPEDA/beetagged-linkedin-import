# BeeTagged Backend API - Fixed Version

## 🎯 What Was Fixed

### Major Issues Resolved:
1. ✅ **Complete Multer Configuration** - Proper file upload handling with disk storage
2. ✅ **CSV Parsing** - Robust CSV parser that handles quoted fields and various formats
3. ✅ **File Upload Endpoint** - Working `/api/import/linkedin` endpoint
4. ✅ **Error Handling** - Comprehensive error handling for file uploads and parsing
5. ✅ **CORS Configuration** - Enhanced CORS for Squarespace integration
6. ✅ **File Cleanup** - Automatic cleanup of uploaded files after processing
7. ✅ **Database Operations** - Complete contact saving with duplicate detection
8. ✅ **Tag Generation** - Intelligent tag generation from contact data
9. ✅ **Widget Integration** - Working embeddable widget for Squarespace

## 🚀 Quick Setup for Replit

### 1. Create New Repl
- Go to [Replit.com](https://replit.com)
- Create a new "Node.js" Repl
- Name it "beetagged-backend"

### 2. Add Files
Replace your `index.js` with the fixed version and add `package.json`

### 3. Install Dependencies
In the Replit shell, run:
```bash
npm install
```

This will install:
- express (web server)
- mongoose (MongoDB)
- cors (cross-origin requests)
- multer (file uploads)
- helmet (security)
- compression (response compression)
- morgan (logging)
- express-rate-limit (rate limiting)

### 4. Set Environment Variables
In Replit, go to "Secrets" (lock icon) and add:

**Required:**
- `MONGODB_URI` - Your MongoDB Atlas connection string

**Optional:**
- `PORT` - Default is 5000
- `NODE_ENV` - Set to "production" for production
- `API_BASE_URL` - Your public Repl URL (e.g., https://your-repl.replit.dev)

### 5. Get MongoDB Atlas (Free)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account
3. Create a free cluster (M0)
4. Get your connection string
5. Replace `<password>` with your database user password
6. Add your connection string to Replit Secrets as `MONGODB_URI`

Example:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/beetagged?retryWrites=true&w=majority
```

### 6. Run the Server
Click the "Run" button in Replit or type:
```bash
npm start
```

You should see:
```
🐝 BeeTagged Server Started!
📍 Port: 5000
🌍 Environment: development
💾 MongoDB: Connected
```

## 📡 API Endpoints

### Upload LinkedIn CSV
**POST** `/api/import/linkedin`
- Accepts: multipart/form-data with `file` field
- Supports: .csv files up to 50MB
- Returns: Import statistics

Example response:
```json
{
  "success": true,
  "message": "Contacts imported successfully",
  "stats": {
    "totalProcessed": 150,
    "contactsInserted": 145,
    "duplicatesSkipped": 5,
    "errors": 0
  }
}
```

### Get All Contacts
**GET** `/api/contacts?page=1&limit=50`
- Returns: Paginated list of contacts

### Search Contacts
**GET** `/api/contacts/search?query=john&tag=company:Google`
- Returns: Filtered contacts

### Get Contact by ID
**GET** `/api/contacts/:id`
- Returns: Single contact

### Delete Contact
**DELETE** `/api/contacts/:id`
- Returns: Success message

### Health Check
**GET** `/health`
- Returns: Server and database status

### Widget (for Squarespace)
**GET** `/widget`
- Returns: Embeddable HTML widget

## 🌐 Integration with Squarespace

### Option 1: Embed Widget (Easiest)
1. Get your Replit URL (e.g., `https://your-repl.replit.dev`)
2. In Squarespace, add a "Code" block
3. Paste this code:

```html
<iframe 
  src="https://your-repl.replit.dev/widget" 
  width="100%" 
  height="700" 
  frameborder="0"
  style="border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
</iframe>
```

### Option 2: Custom Integration
Use the HTML file I provided earlier and point it to your backend:

```javascript
const API_BASE = 'https://your-repl.replit.dev';
```

## 📝 CSV Format Support

The API supports both formats:

### LinkedIn Connections.csv Format:
```csv
First Name,Last Name,Email Address,Company,Position,Connected On
John,Doe,john@example.com,Acme Inc,Engineer,01 Jan 2024
```

### LinkedIn Contacts.csv Format:
```csv
first name,last name,email,company,position,connected on
Jane,Smith,jane@example.com,Tech Corp,Manager,15 Feb 2024
```

## 🏷️ Automatic Tag Generation

The system automatically generates these tags:

- **Company tags**: `company:Google`, `company:Microsoft`
- **Role tags**: `role:engineer`, `role:founder`, `role:manager`, `role:director`, `role:vp`
- **Position tags**: `position:Software Engineer`
- **Connection year**: `connected:2024`
- **Source tag**: `source:linkedin`

## 🔒 Security Features

- ✅ Helmet.js for HTTP headers security
- ✅ Rate limiting (1000 requests per 15 minutes)
- ✅ CORS protection with whitelist
- ✅ File type validation (CSV only)
- ✅ File size limits (50MB max)
- ✅ Automatic file cleanup after processing

## 🐛 Troubleshooting

### "CORS blocked" error
- Add your Squarespace domain to the allowed origins in the CORS configuration
- The code already includes `.squarespace.com` domains

### "MongoDB connection error"
- Check your `MONGODB_URI` in Replit Secrets
- Ensure your IP is whitelisted in MongoDB Atlas (or use 0.0.0.0/0 for all IPs)
- Verify your database user has read/write permissions

### "File upload failed"
- Ensure file is .csv format
- Check file size is under 50MB
- Verify CSV has proper headers

### "No contacts found"
- Check CSV format matches LinkedIn export format
- Ensure CSV has at least 2 lines (header + data)
- Verify CSV is not empty

## 📊 Testing the API

### Using cURL:
```bash
curl -X POST \
  -F "file=@/path/to/Connections.csv" \
  https://your-repl.replit.dev/api/import/linkedin
```

### Using Postman:
1. Set method to POST
2. URL: `https://your-repl.replit.dev/api/import/linkedin`
3. Body: form-data
4. Key: `file` (type: File)
5. Value: Select your CSV file

## 💡 Next Steps

1. **Deploy to production** - Keep your Repl always on (Replit Hacker plan)
2. **Add authentication** - Protect your API with JWT tokens
3. **Add user accounts** - Support multiple users with their own contacts
4. **Add analytics** - Track import statistics and usage
5. **Add bulk operations** - Delete, export, or tag multiple contacts at once

## 🆘 Support

If you encounter issues:
1. Check the Replit console logs for errors
2. Verify all environment variables are set correctly
3. Test the `/health` endpoint to check server status
4. Ensure MongoDB connection is working

## 📄 License

MIT License - Feel free to use and modify!
