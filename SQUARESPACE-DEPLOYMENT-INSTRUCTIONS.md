# Squarespace Deployment Instructions

## What You Need to Update:

### 1. Deploy Backend First:
```bash
git add .
git commit -m "Fix CORS for Squarespace widget compatibility"
git push heroku main:main
```

### 2. Update Squarespace Code Block:
Replace your current Squarespace code block with the updated `SQUARESPACE-FINAL-WIDGET.html` file.

## Key Changes in New Widget:
- **CORS Headers Fixed**: Added proper `mode: 'cors'` and headers
- **Enhanced Logging**: Better error messages and debugging
- **Backend URL**: Points to working Heroku backend

## Steps to Update Squarespace:
1. Copy the entire contents of `SQUARESPACE-FINAL-WIDGET.html`
2. Go to your Squarespace page editor
3. Delete the old code block
4. Add new code block
5. Paste the updated widget code
6. Save and publish

## Expected Result:
- Widget shows: "Connected (6 contacts)"
- Search works for all contacts
- CSV import functional

## File Size:
The widget file is 442 lines - complete standalone HTML page.