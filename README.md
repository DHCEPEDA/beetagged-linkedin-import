# BeeTagged - Professional Contact Intelligence Platform

## Current Status
**Production Ready** - Fully functional contact management application with LinkedIn integration and natural language search.

## Core Files
- `index.js` - Main Express server with embedded React-like UI
- `index-heroku-clean.js` - Self-contained Heroku deployment version
- `package-deployment.json` - Clean package.json for Heroku (no build scripts)
- `Procfile` - Heroku startup configuration
- `replit.md` - Project documentation and architecture

## Features
- LinkedIn CSV import with intelligent tagging
- Natural language search ("Who works at Google?")
- MongoDB Atlas integration
- Responsive web interface
- Contact management and filtering

## Quick Start
1. Install dependencies: `npm install`
2. Set environment variables (see `.env`)
3. Run: `npm start`
4. Access at: `http://localhost:5000`

## Heroku Deployment
Use the files in the root directory:
- Copy `index-heroku-clean.js` as `index.js`
- Use `package-deployment.json` as `package.json`
- Deploy with `Procfile`

No build process required - fully self-contained application.