# BeeTagged - Professional Contact Management Platform

A professional contact search application that integrates LinkedIn data with AI-powered natural language search.

## Current Status: Production Ready ✅

- **Backend**: Heroku hosting with 5433 contacts loaded
- **Database**: MongoDB Atlas connected and operational
- **Frontend**: Squarespace widget ready for deployment
- **Search**: Natural language queries working ("engineers at Google", "people in Austin")
- **Import**: LinkedIn CSV upload functional

## Quick Deployment

### Squarespace Integration
Copy the code from `SQUARESPACE-FINAL-WIDGET.html` into:
**Settings > Advanced > Code Injection > Footer**

### Features
- Smart contact search with natural language
- LinkedIn CSV import with duplicate detection
- Professional UI with responsive design
- Real-time backend connectivity

## Project Structure

```
├── index.js              # Main Express server
├── models/               # MongoDB schemas
├── routes/               # API endpoints
├── services/             # Business logic
├── src/                  # Frontend components
├── dist/                 # Build artifacts
└── SQUARESPACE-FINAL-WIDGET.html  # Ready-to-deploy widget
```

## Backend API

- **Health**: `GET /health` - Server status
- **Contacts**: `GET /api/contacts` - List all contacts
- **Search**: `GET /api/search/natural?q=query` - Natural language search
- **Import**: `POST /api/import/linkedin` - CSV upload

## Environment

- **Production URL**: https://beetagged-app-53414697acd3.herokuapp.com
- **Database**: MongoDB Atlas (5433 contacts)
- **CORS**: Configured for Squarespace domains