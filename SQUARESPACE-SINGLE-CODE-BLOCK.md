# Squarespace Integration: Single Code Block Required

## You Need Only ONE Code Block

### What You've Already Done:
✅ **Code Injection (Header & Footer)** - Contains all the JavaScript
✅ **Custom CSS** - Contains all the styling

### Final Step: Add ONE Code Block to Your Page

**Go to your Squarespace page editor:**

1. **Click Edit Page**
2. **Add Content Block** → **More** → **Code**
3. **Paste ONLY this HTML**:

```html
<div id="my-react-app-root"></div>
```

### That's All!

**Total Code Blocks Needed: 1**
**Content: Just the div container**

## Why Only One Block?

- **JavaScript**: Already loaded via Code Injection (site-wide)
- **CSS**: Already loaded via Custom CSS (site-wide) 
- **HTML Container**: Only needs the div element (page-specific)

## What Happens:

1. Page loads → Code Injection runs → React loads
2. React finds the div with id "my-react-app-root"
3. BeeTagged app renders inside that div
4. You see the full professional contact search interface

## Common Mistake to Avoid:
Don't add multiple code blocks or duplicate the JavaScript. Everything is already loaded site-wide through Code Injection.

Just add the single div container and your BeeTagged app will appear!