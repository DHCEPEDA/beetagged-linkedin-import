# Squarespace BeeTagged Widget Setup

## 📋 Copy This Code for Squarespace

1. **In Squarespace**: Add a "Code Block" element
2. **Paste the entire content** from `squarespace-beetagged-widget.html`
3. **Replace this line** in the code:
   ```javascript
   const API_BASE = 'https://your-heroku-app.herokuapp.com';
   ```
   With your actual Heroku app URL:
   ```javascript
   const API_BASE = 'https://beetagged-contacts.herokuapp.com';
   ```

4. **Also replace** this line:
   ```html
   <a href="https://your-heroku-app.herokuapp.com/api/csv-template" class="import-btn" download>
   ```
   With your actual Heroku app URL:
   ```html
   <a href="https://beetagged-contacts.herokuapp.com/api/csv-template" class="import-btn" download>
   ```

## ✨ Features Included:

### **Professional Design:**
- Gradient background and clean layout
- Responsive design for mobile/desktop
- Hover animations and smooth transitions

### **Complete Functionality:**
- **Natural Language Search**: "Who works at Google?"
- **LinkedIn CSV Import**: File upload with progress indicators
- **Facebook Contact Import**: Modal with App ID input
- **CSV Template Download**: Sample file for users
- **Real-time Results**: Live contact display with tags

### **Import Methods:**
1. **LinkedIn**: Upload CSV file directly
2. **Facebook**: Enter App ID and authenticate
3. **Template**: Download sample CSV format

## 🔧 Setup Requirements:

1. **Deploy to Heroku** with the files I provided
2. **Setup Facebook App** with your Heroku URL as redirect URI
3. **Update the API_BASE URLs** in the widget code
4. **Embed in Squarespace** as a Code Block

The widget will connect to your Heroku backend and provide full BeeTagged functionality directly on your Squarespace site!

## 📱 Mobile Optimized:
- Responsive layout
- Touch-friendly buttons
- Optimized for all screen sizes
- Progressive web app capabilities