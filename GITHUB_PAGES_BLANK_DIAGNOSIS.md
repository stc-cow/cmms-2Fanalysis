# GitHub Pages Blank Page - Diagnosis & Fix

## Situation

After deployment, GitHub Pages shows a blank page instead of the dashboard.

## What Changed

Fixed `vite.config.ts` to detect GitHub Pages deployment:

```typescript
// Now correctly sets:
// - /movement-analysis/ for GitHub Pages (project repo)
// - / for Vercel and other deployments
// - ./ for local dev
```

## Diagnostic Steps

### Step 1: Check Browser Console (F12)

**Open DevTools and look for errors:**

```
Right-click → Inspect → Console tab
Look for any red error messages
```

**Common errors and their meanings:**

| Error | Cause | Solution |
|-------|-------|----------|
| `GET /movement-data.json 404` | Base path wrong | Fix base path |
| `GET /movement-analysis/movement-data.json 404` | JSON files not in /docs | Rebuild with cp step |
| `Unexpected token < in JSON` | HTML returned instead of JSON | Check /docs has JSON files |
| `Cannot read property 'map' of undefined` | Data didn't load | Check network tab |
| CORS error | Server headers issue | Check GitHub Pages settings |

### Step 2: Check Network Tab (F12)

**Look for failed requests:**

```
DevTools → Network tab
Look for RED items (failed requests)
Check URLs being requested
```

**What should load successfully:**

- ✅ `index.html` - Status 200
- ✅ `/movement-analysis/movement-data.json` - Status 200
- ✅ `/movement-analysis/never-moved-cows.json` - Status 200
- ✅ `/movement-analysis/assets/...` - Status 200

### Step 3: Verify /docs Folder

**Check what GitHub is actually serving:**

```bash
# List local /docs (what you're pushing)
ls -lh docs/

# Should show:
# - index.html (main React app)
# - movement-data.json (2.3 MB)
# - never-moved-cows.json
# - assets/ (folder with JS/CSS)
# - favicon.ico
# - robots.txt

# Verify JSON is valid
jq . docs/movement-data.json | head -5
```

### Step 4: Check GitHub Actions Build

**Verify the build succeeded:**

1. Go to: `https://github.com/stc-cow/movement-analysis/actions`
2. Click latest "Deploy to GitHub Pages" workflow
3. Expand each step and check for errors:
   - `Install dependencies` ✅
   - `Build with GitHub Pages base path` ✅
   - `Verify docs folder` ✅
   - `Upload artifact` ✅
   - `Deploy to GitHub Pages` ✅

**If build failed:**
- Check error messages in logs
- Fix the error locally
- Commit and push to trigger rebuild

### Step 5: Check GitHub Pages Settings

**Verify GitHub Pages is configured correctly:**

1. Go to: Repository → Settings → Pages
2. Check:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main`
   - **Folder**: `/docs`
   - **Status**: Should show green checkmark

**If not configured:**
```
Source: Deploy from a branch
Branch: main
Folder: /docs
Click Save
```

### Step 6: Test Base Path

**Verify the base path is correct in the build:**

```bash
# 1. Build locally
pnpm run build

# 2. Check index.html contains correct base path
grep -A 5 "<base" docs/index.html || echo "No base tag"

# 3. Check console.log shows correct path
# (Should show URL like /movement-analysis/ for GitHub Pages)
```

---

## Quick Fix Steps

### If You See Asset Loading Errors

**Problem**: `GET /index.js 404` instead of `GET /movement-analysis/index.js`

**Fix** (already applied):
1. ✅ Updated `vite.config.ts` to detect repo name
2. ✅ Sets base to `/movement-analysis/` for GitHub Pages
3. ✅ Sets base to `./` for Vercel/local

**Rebuild and deploy:**
```bash
# 1. Build locally
pnpm run build

# 2. Verify docs folder has files
ls docs/

# 3. Push to GitHub
git add .
git commit -m "fix: github pages base path detection"
git push origin main

# 4. Wait for GitHub Actions to complete
# Check: Repository → Actions → Latest run

# 5. Clear browser cache and reload
# Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

### If You See JSON 404 Errors

**Problem**: `GET /movement-data.json 404` or `GET /movement-analysis/movement-data.json 404`

**Check**:
1. Files exist in /docs:
   ```bash
   ls docs/movement-data.json
   ls docs/never-moved-cows.json
   ```

2. Build script copies them:
   ```bash
   grep "cp public" package.json
   # Should show: cp public/*.json docs/
   ```

3. Rebuild with correct script:
   ```bash
   pnpm run build:client
   # Should show: ✅ Copied movement-data.json to build output
   ```

4. Push updated build:
   ```bash
   git add docs/
   git commit -m "fix: ensure json files in docs"
   git push origin main
   ```

---

## Testing Checklist

### Local Testing

```bash
# 1. Clean build
rm -rf docs/
pnpm run build

# 2. Verify structure
ls -la docs/
# Must have: index.html, movement-data.json, never-moved-cows.json, assets/

# 3. Verify base path logic
grep "getBase" vite.config.ts

# 4. Verify JSON is valid
file docs/movement-data.json  # Should be: JSON data
wc -l docs/movement-data.json  # Should be: 80,000+ lines
```

### GitHub Actions Testing

```bash
# 1. Commit and push
git add .
git commit -m "fix: github pages base path"
git push origin main

# 2. Wait ~2 minutes for build
# Go to: Repository → Actions

# 3. Check build log for:
# ✅ "Checking docs folder contents..."
# ✅ "docs/index.html"
# ✅ "docs/movement-data.json"
# ✅ "docs/never-moved-cows.json"

# 4. Check deployment
# Should see: "Deployment successful"
```

### Live Site Testing

```
1. Go to: https://stc-cow.github.io/movement-analysis/
2. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
3. Wait 5 seconds for page to load
4. Open DevTools → Console tab
5. Look for errors (red text)
```

---

## Common Issues & Solutions

### Issue: Page loads but is blank (white screen)

**Cause**: JavaScript error or assets not loading

**Check**:
```
DevTools → Console tab
Look for any error messages
They will tell you what's wrong
```

**Common JavaScript errors**:
- `Cannot read property 'map' of undefined` → Data didn't load
- `fetch is not defined` → Environment issue
- `Unexpected token < in JSON` → JSON endpoint returns HTML

**Solution for each**:
1. Check browser console for error message
2. Share the error with debugging context
3. We'll fix based on specific error

### Issue: JSON files show 404

**Check**:
1. Are files in /docs?
   ```bash
   ls docs/movement-data.json docs/never-moved-cows.json
   ```

2. Did build copy them?
   ```bash
   grep "cp public" package.json
   ```

3. Are they tracked in git?
   ```bash
   git ls-files docs/movement-data.json
   ```

**Solution**:
```bash
# Rebuild
pnpm run build

# Verify files exist
ls docs/

# Force add to git
git add docs/movement-data.json docs/never-moved-cows.json

# Commit and push
git commit -m "chore: ensure json files in deployment"
git push origin main
```

### Issue: Assets loading from wrong path

**Symptoms**: HTML loads but no CSS/JS styling or functionality

**Cause**: Base path incorrect

**Check**:
```bash
# Verify build detected GitHub Pages
GITHUB_PAGES=true GITHUB_REPOSITORY=stc-cow/movement-analysis pnpm run build

# Check index.html has correct paths
cat docs/index.html | grep "src=" | head -3
# Should show paths like: /movement-analysis/assets/...
```

**Solution**:
```bash
# Already fixed in vite.config.ts
# Rebuild and deploy:
pnpm run build
git add .
git commit -m "fix: asset paths for github pages"
git push origin main
```

---

## What We Fixed

**File**: `vite.config.ts`

**Before**:
```typescript
const base = "./";  // Always relative, breaks assets
```

**After**:
```typescript
const getBase = (): string => {
  if (process.env.GITHUB_PAGES === "true") {
    const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];
    if (repoName && repoName !== "stc-cow.github.io") {
      return `/${repoName}/`;  // /movement-analysis/ for GitHub Pages
    }
    return "/";
  }
  return "./";  // For Vercel, local, etc.
};
const base = getBase();
```

**Why**: Vite needs the correct absolute base for production builds, but relative base for development and other deployments.

---

## Next Steps

1. **Rebuild locally**:
   ```bash
   rm -rf docs/
   pnpm run build
   ```

2. **Verify docs folder**:
   ```bash
   ls -lh docs/
   ```

3. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "fix: github pages blank page - correct base path"
   git push origin main
   ```

4. **Monitor build**:
   - Go to Actions tab
   - Wait for build to complete
   - Check for green checkmark ✅

5. **Test site**:
   - Visit: `https://stc-cow.github.io/movement-analysis/`
   - Hard refresh: Cmd+Shift+R
   - Check console for errors

6. **Share console errors** (if any):
   - If still blank, open DevTools → Console
   - Screenshot or copy any red error messages
   - Share them so we can debug further

---

## Support

If you still see blank page after these steps:

1. **Share the console error** (screenshot or exact text)
2. **Share the network tab errors** (what fails to load)
3. **Share the GitHub Actions build log** (if build failed)
4. **Confirm the site URL** (is it /movement-analysis/ or just /?)

With these details, we can pinpoint and fix the exact issue.
