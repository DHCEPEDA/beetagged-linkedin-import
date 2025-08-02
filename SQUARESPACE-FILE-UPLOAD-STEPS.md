# Exact Steps to Upload Files to Squarespace

## Method 1: Custom Files Upload (Most Common)

### Step 1: Access File Upload Area
1. **Log into your Squarespace account**
2. **Go to your site dashboard**
3. **Navigate to**: Design → Custom CSS
4. **Look for one of these options**:
   - "Manage Custom Files"
   - "Upload File" button
   - "File Manager" link
   - Small upload icon near the CSS text box

### Step 2: Upload JavaScript File
1. **Click the upload option**
2. **Select**: `dist/beetagged-app-bundle.js` from your computer
3. **Wait for upload to complete**
4. **Copy the URL** that appears (usually starts with `https://static1.squarespace.com/`)

## Method 2: Page Settings Upload

If Custom CSS doesn't have file upload:

1. **Go to Pages menu**
2. **Select the page** where you want BeeTagged
3. **Click the gear icon** (Page Settings)
4. **Go to Advanced tab**
5. **Look for "Page Header Code Injection"**
6. **Some versions have file upload here**

## Method 3: Site-Wide Code Injection

1. **Go to Settings → Advanced → Code Injection**
2. **Some Squarespace plans have file upload in this section**
3. **Upload your JavaScript file here**

## CSS Handling (No Upload Needed)

**For the CSS file** (`src/beetagged-styles.css`):
1. **Open the CSS file on your computer**
2. **Copy ALL the text** (Ctrl+A, Ctrl+C)
3. **Go to Design → Custom CSS in Squarespace**
4. **Paste the CSS directly** into the text box
5. **Save changes**

## If File Upload Is Not Available

Some Squarespace plans don't allow custom file uploads. Alternatives:

1. **Use a CDN service** like:
   - GitHub Pages (free)
   - Netlify (free tier)
   - Upload to any web hosting and get a public URL

2. **Or inline the JavaScript** (not recommended due to size)

## Verification Steps

After uploading:
1. **Visit the file URL directly** in your browser
2. **Should see JavaScript code** (not an error page)
3. **Copy this working URL** for your code block

Your JavaScript file URL will look like:
`https://static1.squarespace.com/static/[site-id]/t/[timestamp]/beetagged-app-bundle.js`