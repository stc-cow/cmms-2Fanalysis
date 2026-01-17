# GitHub Pages Deployment - Client-Side Google Sheets

## Architecture

```
GitHub Pages (Static React App)  →  Google Sheets (Data Source)
https://stc-cow.github.io/           (CSV published to web)
   ↑
   └─ Direct CSV fetch (client-side)
      No backend required!
```

## What's Deployed

✅ **Frontend**: React Dashboard on GitHub Pages
✅ **Data**: Google Sheets (published to web)
❌ **Backend**: None! (all processing happens in the browser)

## How It Works

1. **User visits** `https://stc-cow.github.io`
2. **React app loads** from GitHub Pages
3. **App fetches CSV** directly from Google Sheets URLs:
   - Movement Data: Sheet ID `1539310010`
   - Never-Moved-COWs: Sheet ID `1685376708`
4. **CSV is parsed** in the browser (client-side)
5. **Dashboard renders** with live Google Sheets data

## Requirements

✅ **Google Sheets published to web**
- Your sheets must be "Publish to web" so the CSV URLs are accessible
- Settings → Share → Publish to web

✅ **GitHub Pages enabled**
- Repository Settings → Pages → Deploy from `main` → `/docs` folder

## Deployment

### Step 1: Ensure Google Sheets are Published

For each sheet:

1. Open your Google Sheet
2. Click **File → Share → Publish to web**
3. Select each sheet tab you want to publish
4. Click **Publish**
5. You'll get a URL like:
   ```
   https://docs.google.com/spreadsheets/d/e/[SHEET_ID]/pub...
   ```

### Step 2: Verify CSV URLs Work

Test the CSV URLs in your browser:

```
Movement Data:
https://docs.google.com/spreadsheets/d/e/2PACX-1vTFm8lIuL_0cRCLq_jIa12vm1etX-ftVtl3XLaZuY2Jb_IDi4M7T-vq-wmFIra9T2BiAtOKkEZkbQwz/pub?gid=1539310010&single=true&output=csv

Never-Moved-COWs:
https://docs.google.com/spreadsheets/d/e/2PACX-1vTFm8lIuL_0cRCLq_jIa12vm1etX-ftVtl3XLaZuY2Jb_IDi4M7T-vq-wmFIra9T2BiAtOKkEZkbQwz/pub?gid=1685376708&single=true&output=csv
```

Both should download CSV files when opened.

### Step 3: Deploy to GitHub Pages

```bash
# Commit changes
git add .
git commit -m "Switch to client-side Google Sheets fetching"

# Push to main - GitHub Actions will auto-deploy
git push origin main
```

GitHub Actions will:
1. Build the React app with Vite
2. Copy to `/docs` folder
3. Deploy to GitHub Pages

**Status**: Check repo **Actions** tab to see build progress

### Step 4: Visit Your Dashboard

```
https://stc-cow.github.io/cmms-2Fanalysis/
```

Open **DevTools (F12)** and check **Console**:

```
✅ Should see:
📊 Loading dashboard data from Google Sheets (client-side)...
✓ Loaded 2535 movements, 428 cows
✅ Loaded 118 Never Moved COWs
```

## Architecture Files

### Client-Side Fetcher
**File**: `client/lib/googleSheetsFetcher.ts`
- Fetches CSV directly from Google Sheets
- Parses CSV into structured data
- No backend dependency

### Data Hook
**File**: `client/hooks/useDashboardData.ts`
- Uses client-side fetcher
- Loads movement data
- No API endpoints

### Dashboard
**File**: `client/pages/Dashboard.tsx`
- Loads Never-Moved-COWs client-side
- Renders all charts and analytics
- Works 100% offline (after initial load)

## URL Configuration

The Google Sheets CSV URLs are hardcoded in:
```typescript
// client/lib/googleSheetsFetcher.ts

const MOVEMENT_DATA_CSV_URL = "https://docs.google.com/spreadsheets/d/e/[YOUR_SHEET_ID]/pub?gid=1539310010&single=true&output=csv";
const NEVER_MOVED_COWS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/[YOUR_SHEET_ID]/pub?gid=1685376708&single=true&output=csv";
```

To change sheets, update these URLs.

## Troubleshooting

### Error: "Failed to fetch movement data"

**Cause**: Google Sheets are not published to web

**Fix**:
1. Open Google Sheet
2. File → Share → Publish to web
3. Select the sheet tabs
4. Click Publish
5. Wait 1-2 minutes for URLs to be active

### Error: "No movement data in response"

**Cause**: CSV URL is wrong or sheet is empty

**Fix**:
1. Test the CSV URL in browser - should download a CSV file
2. Verify sheet has data
3. Check `client/lib/googleSheetsFetcher.ts` for correct URLs

### Dashboard shows blank/no data

**Cause**: CSV fetch failed or incorrect column mapping

**Fix**:
1. Open browser DevTools (F12)
2. Check Console for error messages
3. Verify Google Sheets columns match expected format

### Slow loading

**Cause**: Large Google Sheets file or network latency

**Fix**:
- Google Sheets CSV fetch can take 10-30 seconds
- Files are cached in browser after first load
- Consider archiving old data in separate sheets

## Performance

- **First load**: 10-30 seconds (downloading CSV from Google)
- **Subsequent loads**: Instant (browser cache)
- **Data updates**: Automatic when Google Sheet changes (CORS may cache 1-2 hours)

## Security

✅ **No sensitive data stored on servers**
✅ **All processing happens in browser**
✅ **Google Sheets access only (published URLs)**
✅ **Works offline after initial load**

❌ **You cannot hide data** - anyone can access the published CSV URL

## Files Changed

### Created
- ✅ `client/lib/googleSheetsFetcher.ts` - Client-side CSV fetcher

### Updated
- ✅ `client/hooks/useDashboardData.ts` - Uses client-side fetcher
- ✅ `client/pages/Dashboard.tsx` - Client-side Never-Moved-COWs fetch

### Removed
- ❌ `.env.example` (no backend config needed)
- ❌ `GITHUB_PAGES_BACKEND_SETUP.md` (no backend)
- ❌ `DEPLOYMENT_FIXED.md` (no backend)

### Unchanged
- ✅ `.github/workflows/jekyll-gh-pages.yml` (still builds to `/docs`)
- ✅ `vite.config.ts` (still handles GitHub Pages base path)
- ✅ `public/404.html` (still handles SPA routing)
- ✅ All React components (still work as before)

## Next Steps

1. ✅ Ensure Google Sheets are published to web
2. ✅ Push code to main branch
3. ✅ Wait for GitHub Actions to deploy
4. ✅ Visit https://stc-cow.github.io and check console
5. ✅ Done! 🎉

---

**No backend required. Works entirely on GitHub Pages!**
