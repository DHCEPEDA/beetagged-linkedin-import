# Squarespace CSS Integration - Correct Method

## Step 1: Copy CSS to Squarespace Custom CSS

Since Squarespace doesn't allow separate CSS file uploads, paste the CSS directly:

1. **Go to Design → Custom CSS** in Squarespace
2. **Copy the entire contents** of `src/beetagged-styles.css`
3. **Paste it into the Custom CSS box**
4. **Save the changes**

## Step 2: Upload Only the JavaScript Bundle

1. **In Design → Custom CSS**, look for **"Manage Custom Files"** or similar
2. **Upload only**: `dist/beetagged-app-bundle.js` (12.9KB)
3. **Copy the public URL** for the JavaScript file

## Step 3: Updated Code Block

Use this simplified code for your Squarespace code block:

```html
<!-- BeeTagged Contact Search -->
<div id="my-react-app-root"></div>

<!-- React Dependencies -->
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

<!-- Your JavaScript Bundle (replace with actual Squarespace URL) -->
<script src="YOUR_SQUARESPACE_JS_URL_HERE"></script>
```

**Note**: No CSS link needed since it's now in Custom CSS!

## Benefits of This Approach:
- **Faster Loading**: CSS loads with the page immediately
- **Better Integration**: Follows Squarespace's design system
- **Easier Updates**: Modify CSS directly in Squarespace interface
- **Single File Upload**: Only need to upload the JavaScript bundle

This is actually the preferred method for Squarespace integration!