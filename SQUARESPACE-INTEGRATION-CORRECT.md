# Squarespace Integration - Correct Method

## Problem: No File Upload in Custom CSS
Squarespace doesn't allow JavaScript file uploads in the Custom CSS section.

## Solution: Use External Hosting + Code Injection

### Method 1: Host JS File Externally (Recommended)

#### Step 1: Upload to External Host
Upload `dist/beetagged-app-bundle.js` to any of these:
- **GitHub Pages** (free)
- **Netlify** (free tier)
- **Vercel** (free tier)
- **Your own web hosting**

#### Step 2: Add to Squarespace via Code Injection
1. Go to **Settings** → **Advanced** → **Code Injection**
2. In **Header** section, add:
```html
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
```

3. In **Footer** section, add:
```html
<script src="YOUR_EXTERNAL_JS_URL/beetagged-app-bundle.js"></script>
```

#### Step 3: Add CSS to Custom CSS
Go to **Design** → **Custom CSS** and paste contents of `src/beetagged-styles.css`

#### Step 4: Add Code Block to Page
Add a **Code Block** to your page content:
```html
<div id="my-react-app-root"></div>
```

---

### Method 2: Inline the JavaScript (Alternative)

If you prefer not to use external hosting, we can inline the small 12.9KB bundle directly:

#### Step 1: Get Inline Code
```html
<div id="my-react-app-root"></div>
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script>
// Inline the contents of beetagged-app-bundle.js here
</script>
```

---

## Recommended: GitHub Pages Method

The easiest approach is to host your JS file on GitHub Pages:

1. Create a new GitHub repository
2. Upload `beetagged-app-bundle.js` 
3. Enable GitHub Pages
4. Use the GitHub Pages URL in Squarespace

Which method would you prefer to use?