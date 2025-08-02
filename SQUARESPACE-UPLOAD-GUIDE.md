# Complete Squarespace Upload & Integration Guide

## Step 1: Upload Files to Squarespace

### Upload beetagged-app-bundle.js (12.9KB)
1. **Log into your Squarespace account**
2. **Go to Design → Custom CSS**
3. **Click "Manage Custom Files"** (or similar option)
4. **Upload `dist/beetagged-app-bundle.js`**
   - Browse and select the file from your computer
   - Wait for upload to complete
   - **Copy the public URL** Squarespace provides (usually ends with `.js`)

### Upload beetagged-styles.css
1. **In the same Custom Files section**
2. **Upload `src/beetagged-styles.css`**
   - Browse and select the CSS file
   - Wait for upload to complete  
   - **Copy the public URL** Squarespace provides (usually ends with `.css`)

## Step 2: Get Your URLs

After uploading, you'll have two URLs that look like:
```
https://static1.squarespace.com/static/[your-site-id]/t/[timestamp]/beetagged-app-bundle.js
https://static1.squarespace.com/static/[your-site-id]/t/[timestamp]/beetagged-styles.css
```

**Write these URLs down - you'll need them for the next step.**

## Step 3: Add Code Block to Your Page

1. **Edit the page** where you want BeeTagged to appear
2. **Add a Code Block**:
   - Click "+" to add content
   - Select "Code" from the menu
   - Choose "Code Block" (not "Markdown")

3. **Paste this code** (replace the URLs with your actual Squarespace URLs):

```html
<!-- BeeTagged Professional Contact Search -->
<div id="my-react-app-root" style="min-height: 400px;"></div>

<!-- React Dependencies -->
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

<!-- Your Uploaded Files (REPLACE THESE URLs) -->
<link rel="stylesheet" href="REPLACE_WITH_YOUR_CSS_URL">
<script src="REPLACE_WITH_YOUR_JS_URL"></script>

<style>
#my-react-app-root {
  width: 100%;
  margin: 20px 0;
}
</style>
```

## Step 4: Replace URL Placeholders

In the code above, replace:
- `REPLACE_WITH_YOUR_CSS_URL` → Your actual beetagged-styles.css URL
- `REPLACE_WITH_YOUR_JS_URL` → Your actual beetagged-app-bundle.js URL

**Example after replacement:**
```html
<link rel="stylesheet" href="https://static1.squarespace.com/static/abc123/t/1234567/beetagged-styles.css">
<script src="https://static1.squarespace.com/static/abc123/t/1234567/beetagged-app-bundle.js"></script>
```

## Step 5: Save and Test

1. **Save the code block**
2. **Preview your page** to see BeeTagged loading
3. **Publish your changes**

## Step 6: Deploy Backend (Required)

The frontend will try to connect to your backend. You need to:

1. **Deploy backend to Heroku/Vercel/Netlify**
2. **Test the connection** by visiting your Squarespace page
3. **If you see connection errors**, the backend needs to be publicly accessible

## Troubleshooting Tips

### If BeeTagged doesn't appear:
- Check browser console (F12) for JavaScript errors
- Verify file URLs are accessible by visiting them directly
- Ensure code block is set to "Code" not "Markdown"

### If you see "Backend connection failed":
- Your backend needs to be deployed publicly
- Local backend (localhost:5000) won't work from Squarespace

### File Upload Alternatives:
If Custom CSS doesn't have file upload:
- Try **Settings → Advanced → Code Injection**
- Use **Page Settings → Advanced → Page Header Code Injection**

Your BeeTagged app will be live on Squarespace once the files are uploaded and the backend is deployed!