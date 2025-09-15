# 🚀 Heroku Deployment - Fix "Server Offline" Issue

## Problem
Squarespace shows "server offline" because Heroku server is missing updated code.

## Solution
Deploy these 2 files to Heroku:

### 1. Main Server File
**File: `index.js`**
- Copy the entire `index.js` from this Replit project
- This contains the new `/api/contacts` endpoint and LinkedIn upload fixes

### 2. Package Configuration  
**File: `package.json`**
- Copy content from `WORKING-PACKAGE.json` 
- Rename to `package.json` on Heroku

## Deployment Steps
1. Copy `index.js` → Upload to Heroku
2. Copy `WORKING-PACKAGE.json` → Rename to `package.json` → Upload to Heroku  
3. Deploy changes on Heroku
4. Restart Heroku dyno
5. Test: Visit `https://beetagged-app-53414697acd3.herokuapp.com/api/contacts`

## Expected Result
- Heroku server responds with contact data (not timeout)
- Squarespace shows "server online" 
- LinkedIn CSV upload works

## Files Ready in This Project
- ✅ `index.js` (1,379 lines with all updates)
- ✅ `WORKING-PACKAGE.json` (clean package.json for Heroku)