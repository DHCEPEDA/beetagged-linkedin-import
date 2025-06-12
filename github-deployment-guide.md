# GitHub Pages Deployment for LinkedIn Import

## Step 1: Create Repository

1. Go to GitHub.com and sign in
2. Click "New repository" (green button)
3. Name it: `beetagged-linkedin-import`
4. Make it Public (required for free GitHub Pages)
5. Check "Add a README file"
6. Click "Create repository"

## Step 2: Upload Files

1. In your new repository, click "Add file" → "Upload files"
2. Upload these files from your Replit project:
   - `linkedin-import-direct.html` (main import page)
   - `public/linkedin-import-standalone.html` (backup version)

## Step 3: Enable GitHub Pages

1. In your repository, go to "Settings" tab
2. Scroll down to "Pages" section
3. Under "Source", select "Deploy from a branch"
4. Choose "main" branch and "/ (root)" folder
5. Click "Save"

## Step 4: Access Your Live Site

Your LinkedIn import will be available at:
`https://yourusername.github.io/beetagged-linkedin-import/linkedin-import-direct.html`

## Step 5: Link from BeeTagged

Use this URL in your BeeTagged website:
```html
<a href="https://yourusername.github.io/beetagged-linkedin-import/linkedin-import-direct.html" target="_blank">Import LinkedIn Connections</a>
```

## Benefits

- Permanent, reliable hosting
- HTTPS enabled by default
- Fast global CDN
- No server maintenance required
- Professional domain
- Version control for updates

## File Contents

The files work completely client-side:
- Process LinkedIn CSV files in browser
- Generate intelligent contact tags
- Create downloadable contact data
- Provide access codes for mobile app
- No backend server required