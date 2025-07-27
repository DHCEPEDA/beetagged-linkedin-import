#!/bin/bash

# Heroku Deployment Script for MongoDB Timeout Fix
# Run this script to deploy the fixed backend to Heroku

echo "🚀 Deploying MongoDB timeout fix to Heroku..."

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI not found. Please install it first:"
    echo "   https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Login check
echo "📋 Checking Heroku authentication..."
if ! heroku auth:whoami &> /dev/null; then
    echo "🔐 Please login to Heroku:"
    heroku login
fi

# Set up git remote
echo "🔗 Setting up Heroku git remote..."
heroku git:remote -a beetagged-app

# Copy fixed code
echo "📄 Copying fixed backend code..."
cp DEPLOY-FIXED-CODE.js index.js

# Check if there are changes
if ! git diff --quiet index.js; then
    echo "✅ Changes detected in index.js"
    
    # Add and commit changes
    echo "📝 Committing MongoDB timeout fixes..."
    git add index.js
    git commit -m "Fix MongoDB Atlas timeout issues

- Add 5-second timeout protection for database operations
- Implement connection state validation
- Add graceful error handling with proper HTTP status codes
- Enhanced MongoDB connection options for Atlas compatibility
- Detailed logging for connection debugging

Resolves: 60-second timeout issues on /health and /api/contacts endpoints"

    # Deploy to Heroku
    echo "🚀 Deploying to Heroku..."
    git push heroku main

    # Wait for deployment
    echo "⏳ Waiting for deployment to complete..."
    sleep 10

    # Test the fix
    echo "🧪 Testing deployed fixes..."
    echo "Health check:"
    curl -m 5 -s "https://beetagged-app-53414697acd3.herokuapp.com/health" || echo "Still timing out"
    
    echo -e "\nContacts API:"
    curl -m 5 -s "https://beetagged-app-53414697acd3.herokuapp.com/api/contacts" | head -20

    echo -e "\n✅ Deployment complete!"
    echo "🔗 App URL: https://beetagged-app-53414697acd3.herokuapp.com"
    echo "📊 Monitor logs: heroku logs --tail --app beetagged-app"
    
else
    echo "ℹ️  No changes detected. Backend is already up to date."
fi