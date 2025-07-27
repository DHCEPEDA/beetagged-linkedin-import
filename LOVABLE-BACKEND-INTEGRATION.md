# 🔗 BeeTagged Backend API for Lovable Frontend Integration

## Backend Services (Replit)
Your current Replit backend provides these API endpoints for your Lovable frontend:

### 🔌 API Endpoints Available

#### 1. Contact Management
```javascript
GET /api/contacts
// Returns all contacts for frontend display

GET /health  
// System status and contact count
```

#### 2. LinkedIn Integration
```javascript
POST /api/import/linkedin
// Body: FormData with 'linkedinCsv' file
// Returns: { success: true, count: number, message: string }
```

#### 3. Facebook Integration  
```javascript
POST /api/import/facebook
// Body: { contacts: Array<FacebookContact> }
// Returns: { success: true, contacts: Array<Contact> }
```

#### 4. Natural Language Search
```javascript
GET /api/search/natural?q=searchQuery
// Returns: { results: Array<Contact> }
// Supports queries like "Who works at Google?"
```

### 🎯 Contact Data Schema
```javascript
{
  id: Number,
  name: String,
  email: String, 
  company: String,
  position: String,
  location: String,
  tags: Array<String>,
  source: String, // 'linkedin', 'facebook', 'manual'
  createdAt: Date
}
```

## Frontend Integration (Lovable)

### React Hooks for API Integration
```javascript
// Custom hook for contact management
const useContacts = () => {
  const [contacts, setContacts] = useState([]);
  
  const loadContacts = async () => {
    const response = await fetch(`${BACKEND_URL}/api/contacts`);
    const data = await response.json();
    setContacts(data);
  };
  
  return { contacts, loadContacts };
};

// Search hook with debouncing
const useContactSearch = () => {
  const [results, setResults] = useState([]);
  
  const search = async (query) => {
    const response = await fetch(
      `${BACKEND_URL}/api/search/natural?q=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    setResults(data.results);
  };
  
  return { results, search };
};
```

### Environment Configuration
```javascript
// In your Lovable .env
VITE_BACKEND_URL=https://your-replit-app.repl.co
```

### File Upload Component
```javascript
const LinkedInImport = () => {
  const handleFileUpload = async (file) => {
    const formData = new FormData();
    formData.append('linkedinCsv', file);
    
    const response = await fetch(`${BACKEND_URL}/api/import/linkedin`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    if (result.success) {
      // Refresh contacts in your frontend
      onImportSuccess(result);
    }
  };
  
  return (
    <input 
      type="file" 
      accept=".csv"
      onChange={(e) => handleFileUpload(e.target.files[0])}
    />
  );
};
```

## 🚀 Current Backend Status

✅ **Running**: Server active on port 5000  
✅ **MongoDB**: Connected to Atlas cloud database  
✅ **CSV Import**: Enhanced LinkedIn parsing working  
✅ **Search**: Natural language queries with Enter key support  
✅ **CORS**: Configured for cross-origin requests  
✅ **Error Handling**: Comprehensive API error responses  

## 🔧 Backend URL for Frontend
```
https://d49cd8c1-1139-4a7e-96a2-5d125f417ecd-00-3ftoc46fv9y6p.riker.replit.dev
```

## 📋 Next Steps for Integration

1. **Lovable Frontend**: Build React components that call these APIs
2. **State Management**: Use the contact data from backend responses  
3. **Real-time Updates**: Frontend calls `/api/contacts` after imports
4. **Search Interface**: Connect search input to `/api/search/natural`
5. **File Uploads**: Use FormData for LinkedIn CSV imports

Your backend is fully operational and ready to support your Lovable frontend development!