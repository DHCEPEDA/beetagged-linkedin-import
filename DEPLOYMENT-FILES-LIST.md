# Files to Deploy to Heroku

## Primary File to Upload:
✅ **`index.js`** - Main backend file with all updates

## What's in the Updated index.js:
1. **Fixed Email Extraction** - Michael Higgins emails will now appear
2. **Dual-File Upload Support** - Can handle both Connections + Contacts CSV
3. **Smart Contact Merging** - Matches contacts by name across files
4. **Enhanced Error Handling** - Better debugging and field detection
5. **Backward Compatibility** - Still works with single CSV uploads

## Supporting Files (already on Heroku):
- `package.json` - Dependencies (no changes needed)
- `Procfile` - Startup script (no changes needed)

## Deployment Process:
1. Upload the updated `index.js` file to Heroku
2. Heroku will automatically restart with the new code
3. Test with your LinkedIn CSV files

## Expected Results After Deployment:
- Michael Higgins will show email addresses in search results
- You can upload both LinkedIn Connections AND Contacts CSV files together
- Complete contact profiles with emails, companies, job titles, profile URLs
- Enhanced data extraction from all LinkedIn export formats

**Just the `index.js` file needs to be deployed - it contains everything.**