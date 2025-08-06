# BeeTagged Squarespace Deployment Guide

## Method 1: Header Injection (Recommended)

### Steps:
1. **Log into your Squarespace admin panel**
2. **Navigate to Settings**
   - Click "Settings" in the left sidebar
3. **Go to Advanced Settings**
   - Click "Advanced" 
   - Select "Code Injection"
4. **Add to Header**
   - Find the "HEADER" section (not Footer)
   - Copy the ENTIRE content from `SQUARESPACE-HEADER-POSITIONED.html`
   - Paste it into the Header code injection box
5. **Save Changes**
   - Click "Save" 
   - The widget will appear on your site

### Important Notes:
- Use the HEADER injection, not footer
- Copy the complete file content including `<script>` tags
- The widget will appear at the top of every page
- No additional CSS files needed (all styling is inline)

## Method 2: Code Block (Alternative)

### Steps:
1. **Edit any page where you want the widget**
2. **Add a Code Block**
   - Click the "+" to add content
   - Select "Code" block
3. **Paste Widget Code**
   - Copy content from `SQUARESPACE-HEADER-POSITIONED.html`
   - Paste into the code block
4. **Save and Publish**

### Limitations:
- Only appears on pages where you add it
- Some Squarespace plans restrict code blocks
- May have styling conflicts with page themes

## Method 3: Footer Injection (Backup)

### Steps:
1. **Same as Header method but use Footer section**
2. **Widget appears at bottom of pages**
3. **May be blocked by some themes**

## File Recommendations:

- **SQUARESPACE-HEADER-POSITIONED.html** - Best layout with positioned search
- **SQUARESPACE-DUAL-IMPORT.html** - Full-screen layout
- **Footer injection files** - Alternative placement options

## Troubleshooting:

### Widget Not Appearing:
- Check if code injection is enabled on your plan
- Verify you pasted the complete code including `<script>` tags
- Try refreshing the page after saving

### Styling Issues:
- All CSS is inline, so no external dependencies
- If conflicts occur, try the code block method instead

### Functionality Issues:
- Widget connects to: `https://beetagged-app-53414697acd3.herokuapp.com`
- Ensure your browser allows cross-origin requests
- Check browser console for any error messages

## Plan Requirements:

- **Personal Plan**: Limited code injection access
- **Business Plan**: Full code injection access
- **Commerce Plan**: Full access with e-commerce features

The Header Injection method works best for most Squarespace sites and provides the cleanest integration.