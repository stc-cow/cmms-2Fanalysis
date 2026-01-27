# Quick Deployment Checklist - 5 Minutes to Production

## ✅ Pre-Deployment (1 minute)

```bash
# Verify JSON files exist
ls -lh public/movement-data.json
ls -lh public/never-moved-cows.json
# Output: 2.3M movement-data.json, 66K never-moved-cows.json

# Verify dev works
pnpm run dev
# Check: Dashboard loads at http://localhost:8080/
# Check: Console shows "✅ Loaded data..."
```

## ✅ Build (1 minute)

```bash
# Build for production
pnpm run build

# Verify output
ls -lh dist/spa/movement-data.json
ls -lh dist/spa/never-moved-cows.json
# Both files must exist!

# Check console output for:
# ✅ Copied movement-data.json to build output
# ✅ Copied never-moved-cows.json to build output
```

## ✅ GitHub Pages (2 minutes)

```bash
# Commit and push
git add -A
git commit -m "Production: Add BASE_URL support for subpath deployments"
git push origin main

# GitHub Actions will:
# 1. Run: pnpm run build
# 2. Deploy: dist/spa/ to gh-pages branch
# 3. Available at: https://username.github.io/repo-name/

# Verify deployment (wait 1-2 minutes)
curl https://username.github.io/repo-name/movement-data.json
# Should return JSON, not 404
```

## ✅ Builder Export (1 minute)

```
1. Go to Builder.io
2. Click: Export as Static (or similar)
3. Select: dist/spa/ folder
4. Deploy to desired location
5. Verify JSON files are at root of deployment
```

## ✅ Post-Deployment (1 minute)

1. **Open dashboard URL**
   ```
   https://your-deployment-url/
   ```

2. **Check DevTools Console (F12)**
   - Should see: `✅ Loaded 2535 movements from local JSON`
   - Should see: `✅ Loaded 139 never-moved cows from local JSON`
   - No 404 errors

3. **Verify Data Loads**
   - Total COWs: 428
   - Total Movements: 2,535
   - Total Distance: 866,211 KM
   - All KPIs displayed

4. **Test Fetch Paths**
   ```bash
   # From browser console:
   curl https://your-url/movement-data.json
   # OR
   fetch('/movement-data.json').then(r => r.json()).then(console.log)
   ```

## 🚨 If Something Goes Wrong

### Dashboard Loads but Shows 404 Error
```
Fix: JSON files not in build output
Run: pnpm run build
Check: ls -lh dist/spa/movement-data.json
```

### JSON Fetch Works but No Data Displays
```
Fix: BASE_URL issue
Check Console: import.meta.env.BASE_URL
Should show: / (for root) or /repo-name/ (for GitHub Pages)
```

### Works Locally but Not in Production
```
Fix: BASE_URL not set correctly for your deployment
For GitHub Pages: No action needed (auto-detected)
For custom: Set VITE_BASE_URL environment variable
Rebuild: VITE_BASE_URL=/your-path/ pnpm run build
```

## 📋 Environment Variables Reference

| Deployment | Command | Environment |
|-----------|---------|-------------|
| **Local Dev** | `pnpm run dev` | `BASE_URL=/` |
| **GitHub Pages** | `git push` | `BASE_URL=/repo-name/` (auto) |
| **Root Domain** | `pnpm run build` | `BASE_URL=/` (default) |
| **Subpath** | `VITE_BASE_URL=/path/ pnpm run build` | `BASE_URL=/path/` |

## 🎯 Verification URLs

After deployment, these URLs must return valid JSON:

```
✅ https://your-host/movement-data.json
✅ https://your-host/never-moved-cows.json

For GitHub Pages:
✅ https://username.github.io/repo-name/movement-data.json
✅ https://username.github.io/repo-name/never-moved-cows.json
```

## ✨ Success Indicators

When deployment is successful, you'll see:

```
Dashboard Console (F12):
✅ Loading dashboard data from local JSON files...
✅ Loading Movement Data from local JSON...
✅ Loaded 2535 movements from local JSON
✅ Loading Never Moved COWs from local JSON...
✅ Loaded 139 never-moved cows from local JSON

Dashboard Display:
✅ Total COWs: 428
✅ Total Movements: 2,535
✅ Total Distance (KM): 866,211
✅ All KPIs visible
✅ Map rendering
✅ Charts displaying
```

## 🎓 How It Works

```
User visits: https://host/path/
     ↓
Vite detects: BASE_URL=/path/
     ↓
Frontend uses: fetch('/path/movement-data.json')
     ↓
Server responds with JSON
     ↓
✅ Dashboard displays data
```

## 🔒 No External Dependencies

This deployment is:
- ✅ **No Google APIs** - Pure JSON
- ✅ **No Backend** - Static files only
- ✅ **No Credentials** - No secrets needed
- ✅ **No Network** - Works offline
- ✅ **STC Cypher Safe** - 100% compliant

## 📞 Quick Help

**Console error: `Failed to load movement data`**
→ Check browser Network tab
→ Verify JSON file URL matches deployment path

**Dashboard blank**
→ Open DevTools Console (F12)
→ Look for error messages
→ Verify BASE_URL is correct

**404 on JSON file**
→ File not in build output
→ Run: `pnpm run build` again
→ Verify: `ls -lh dist/spa/movement-data.json`

---

**Ready to deploy? Run: `pnpm run build` then upload `dist/spa/` folder!** 🚀

