# BeeTagged Squarespace Integration Instructions

## Quick Setup for Squarespace

### Option 1: Full Page Widget (Recommended)
1. In Squarespace, create a new page
2. Add a **Code Block** 
3. Copy and paste the entire content from `SQUARESPACE-BEETAGGED-WIDGET.html`
4. Save and publish

### Option 2: Embedded Widget in Existing Page
1. Add a **Code Block** to any page
2. Copy and paste this shortened embed code:

```html
<div id="beetagged-widget">
    <iframe 
        src="https://beetagged-app-53414697acd3.herokuapp.com/widget" 
        width="100%" 
        height="800" 
        frameborder="0"
        style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    </iframe>
</div>
```

### Option 3: Inline Search Bar Only
For a minimal integration, use this search-only widget:

```html
<div style="max-width: 600px; margin: 20px auto; padding: 20px;">
    <div style="position: relative; margin-bottom: 15px;">
        <input 
            type="text" 
            id="beetagged-search" 
            placeholder="Search your network: 'engineers at Google', 'contacts in Austin'..."
            style="width: 100%; padding: 12px 15px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 16px;"
        />
    </div>
    <button 
        onclick="searchBeeTagged()"
        style="background: #3B82F6; color: white; padding: 10px 24px; border: none; border-radius: 6px; cursor: pointer;"
    >
        Search Network
    </button>
    <div id="beetagged-results" style="margin-top: 20px;"></div>
</div>

<script>
function searchBeeTagged() {
    const query = document.getElementById('beetagged-search').value;
    if (query.trim()) {
        const resultsDiv = document.getElementById('beetagged-results');
        resultsDiv.innerHTML = '<p style="color: #6B7280;">Searching...</p>';
        
        fetch(`https://beetagged-app-53414697acd3.herokuapp.com/api/search/natural?q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                const results = data.results || [];
                if (results.length === 0) {
                    resultsDiv.innerHTML = '<p style="color: #6B7280;">No contacts found. Try a different search.</p>';
                } else {
                    resultsDiv.innerHTML = results.map(contact => `
                        <div style="border: 1px solid #e5e7eb; padding: 15px; margin: 10px 0; border-radius: 6px;">
                            <h4 style="margin: 0 0 5px 0; font-weight: bold;">${contact.name}</h4>
                            ${contact.position && contact.company ? `<p style="margin: 0; color: #6B7280;">${contact.position} at ${contact.company}</p>` : ''}
                            ${contact.location ? `<p style="margin: 5px 0 0 0; font-size: 14px; color: #9CA3AF;">${contact.location}</p>` : ''}
                        </div>
                    `).join('');
                }
            })
            .catch(() => {
                resultsDiv.innerHTML = '<p style="color: #EF4444;">Search temporarily unavailable. Please try again.</p>';
            });
    }
}
</script>
```

## Features Included

✅ **AI-Powered Search**: Natural language queries like "engineers at Microsoft"
✅ **Real-time Results**: Instant search through your professional network
✅ **Responsive Design**: Works on desktop and mobile
✅ **Production Ready**: Connected to live Heroku backend
✅ **Professional UI**: Clean, modern interface with Tailwind CSS

## Pricing Integration

The widget includes pricing display ($0.99/month) and can be enhanced with:
- Stripe payment integration
- User authentication 
- Premium features unlock

## Backend Status

- **Production URL**: https://beetagged-app-53414697acd3.herokuapp.com
- **API Endpoints**: `/api/contacts`, `/api/search/natural`
- **Database**: MongoDB Atlas with 3 test contacts
- **Health Check**: `/health` endpoint for status monitoring

## Customization

You can customize:
- Colors by editing the Tailwind CSS classes
- Search placeholder text
- Branding and footer text
- Widget height and width
- API endpoints (for white-label versions)

## Support

For technical support or custom implementations, contact the BeeTagged development team.