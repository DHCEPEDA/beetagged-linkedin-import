# CORS Security Enhancement

## Updated from Permissive to Secure Configuration

### Previous (Insecure):
```javascript
app.use(cors({ origin: '*' })); // Allows any domain
```

### New (Secure):
```javascript
const allowedOrigins = [
  'https://www.squarespace.com',
  'https://squarespace.com', 
  /\.squarespace\.com$/,
  'https://beetagged-app-53414697acd3.herokuapp.com',
  /\.replit\.dev$/,
  'http://localhost:3000', // Lovable development
  'http://localhost:5173'  // Vite development
];

app.use(cors({
  origin: function (origin, callback) {
    // Dynamic origin validation with allowlist
  }
}));
```

## Security Benefits:
- **Prevents unauthorized access** from random domains
- **Allows legitimate sources** (Squarespace, development environments)
- **Supports regex patterns** for subdomain matching
- **Maintains functionality** while improving security

## Allowed Origins:
1. **Production**: Squarespace domains and subdomains
2. **Backend**: Heroku app domain
3. **Development**: Replit, localhost for React development
4. **No Origin**: Mobile apps, curl requests (allowed)

## Deploy Command:
```bash
git add .
git commit -m "Implement secure CORS allowlist configuration"
git push heroku main:main
```

This maintains widget functionality while significantly improving backend security.