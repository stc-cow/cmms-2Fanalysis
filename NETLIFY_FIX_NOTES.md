# Netlify Deployment Fix

## Issues Fixed

### 1. **Base Path Configuration** (`vite.config.ts`)

- **Problem:** Base path was set to `/cmms-2Fanalysis/` for production, which is incompatible with Netlify root deployments
- **Fix:** Changed base path to `/` for all environments
- **Change:** Line 8 of `vite.config.ts`

### 2. **SPA Routing** (`netlify.toml`)

- **Problem:** Single Page Application (SPA) routes were not being redirected to `index.html`, causing 404 errors
- **Fix:** Added redirect rule to send all non-API requests to `index.html` for client-side routing
- **Change:** Added catch-all redirect in `netlify.toml`

### 3. **Build Command** (`netlify.toml`)

- **Problem:** Build command did not ensure dependencies were installed
- **Fix:** Updated command to explicitly run `pnpm install` before building
- **Change:** Updated build command in `netlify.toml`

## What Changed

### Files Modified:

1. **vite.config.ts** - Fixed base path
2. **netlify.toml** - Added SPA routing and improved build command

## Steps to Redeploy

### Option 1: Using Netlify CLI

```bash
# If you have Netlify CLI installed
netlify deploy --prod
```

### Option 2: Using Git Push

The simplest way is to push these changes to your Git repository:

```bash
git add vite.config.ts netlify.toml
git commit -m "Fix: Netlify deployment - base path and SPA routing"
git push origin main
```

Netlify will automatically detect the changes and redeploy.

### Option 3: Through Netlify Dashboard

1. Go to your Netlify site dashboard
2. Click "Deploys"
3. Click "Trigger deploy" → "Deploy site"

## Verification

After redeployment, verify:

1. ✅ Main page loads (not blank)
2. ✅ All dashboard tabs work
3. ✅ API routes respond (e.g., `/api/data/never-moved-cows`)
4. ✅ Navigation works (e.g., accessing different tabs doesn't show 404)

## Configuration Summary

**Base Path:** `/` (root, suitable for `sitename.netlify.app`)
**Build Command:** `pnpm install && pnpm run build:client`
**Publish Directory:** `dist/spa`
**Functions Directory:** `netlify/functions`

## API Routes

The following routes are configured:

- `/api/*` → `/.netlify/functions/api/*` (via serverless function)
- All other routes → `/index.html` (for SPA routing)
