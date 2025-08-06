# BeeTagged Squarespace Integration Troubleshooting

## Step-by-Step Debugging

### Step 1: Test Basic Code Injection
1. Copy code from `SQUARESPACE-DEBUG-SIMPLE.html`
2. Go to Squarespace: Settings > Advanced > Code Injection > Footer
3. Paste the code and save
4. Visit your site - you should see a red bordered box

**If you don't see the red box:**
- Code injection isn't working
- Try Header injection instead of Footer
- Your Squarespace plan might not support code injection

### Step 2: Check Browser Console
1. Right-click on your page > Inspect Element
2. Go to Console tab
3. Look for errors or "BeeTagged" messages

**Common errors:**
- CORS errors (backend issue)
- JavaScript errors (code problem)
- Network errors (Heroku down)

### Step 3: Alternative Methods

**Method A: Code Block**
1. Edit your Squarespace page
2. Add new block > Code
3. Paste widget code there

**Method B: Embed Block**
1. Add new block > Embed
2. Paste HTML code

**Method C: Header Injection**
1. Use `SQUARESPACE-ALTERNATIVE-METHODS.html`
2. Paste in Header instead of Footer

### Step 4: Squarespace Plan Check
Code injection requires:
- Business plan or higher
- Developer mode enabled

**If you have Basic/Personal plan:**
- Use Code Block method instead
- Or upgrade to Business plan

### Step 5: Backend Verification
Test your backend directly:
```
https://beetagged-app-53414697acd3.herokuapp.com/api/contacts?limit=3
```

Should return JSON with contact data.

## Current Status
- ✅ Backend working (5432 contacts)
- ✅ Search endpoint working (/api/search/natural)
- ❌ Widget not displaying in Squarespace

## Next Steps
1. Try the debug widget first
2. Check browser console for errors
3. Try alternative injection methods
4. Verify Squarespace plan supports code injection