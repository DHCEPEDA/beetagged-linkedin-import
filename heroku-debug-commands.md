# Heroku Debug Commands for BeeTagged

## Get Current Error Details
Run these commands to see the exact error:

```bash
# View recent build logs
heroku logs --tail -a beetagged-app

# Check app status
heroku ps -a beetagged-app

# View build logs specifically
heroku builds -a beetagged-app
heroku builds:output [BUILD_ID] -a beetagged-app
```

## Fix Common Issues

### 1. Clear and Reset Buildpack
```bash
heroku buildpacks:clear -a beetagged-app
heroku buildpacks:set heroku/nodejs -a beetagged-app
```

### 2. Fix Missing Dependencies
```bash
heroku config:set NPM_CONFIG_PRODUCTION=false -a beetagged-app
heroku config:set NODE_ENV=production -a beetagged-app
```

### 3. Force Rebuild
```bash
heroku repo:purge_cache -a beetagged-app
git commit --allow-empty -m "Force rebuild"
git push heroku main
```

### 4. Check Environment Variables
```bash
heroku config -a beetagged-app
```

## If Build Still Fails

Create a minimal test deployment:

1. Create new folder: `beetagged-minimal`
2. Copy only these files:
   - `package-heroku.json` (rename to `package.json`)
   - `index.js`
   - `Procfile`
   - Basic `server/` folder content

3. Deploy minimal version:
```bash
git init
git add .
git commit -m "Minimal BeeTagged deployment"
heroku git:remote -a beetagged-app
git push heroku main
```

## Debug on Heroku
If deployment succeeds but app crashes:
```bash
heroku run bash -a beetagged-app
# Then inside the dyno:
node index.js
```