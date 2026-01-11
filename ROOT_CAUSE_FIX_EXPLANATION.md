# Root Cause Fixed: GID Mismatch

## 🎯 What Was Wrong

The error **"No movement data found in Google Sheet"** was caused by a **GID (sheet tab) mismatch**.

### The Problem

Your Google Sheet has **TWO different sheets/tabs within the SAME file**:

```
Google Sheet: 1bzcG70TopGRRm60NbKX4o3SCE2-QRUDFnY0Z4fYSjEM
├── Sheet Tab 1: "Movement-data" (GID: 1539310010) ← MAIN DASHBOARD DATA
└── Sheet Tab 2: "Dashboard" (GID: 1464106304) ← NEVER MOVED COWS DATA
```

**What we were doing (WRONG):**
- Using GID `1464106304` for BOTH endpoints
- `/api/data/processed-data` was fetching the "Never Moved COWs" sheet
- `/api/data/never-moved-cows` was also fetching the same sheet

**Why it failed:**
- The "Never Moved COWs" sheet doesn't have "From Location" and "To Location" columns
- The parser couldn't find these required columns
- Result: "No movement data found"

---

## ✅ The Solution: Use Correct GIDs

### What Was Fixed

**Updated `/server/routes/data.ts`:**

```typescript
const SHEET_ID = "1bzcG70TopGRRm60NbKX4o3SCE2-QRUDFnY0Z4fYSjEM";
const MOVEMENT_DATA_GID = "1539310010";      // ← Movement-data tab
const NEVER_MOVED_COW_GID = "1464106304";   // ← Dashboard tab

// Movement data endpoint (FOR MAIN DASHBOARD)
const MOVEMENT_DATA_CSV_URL = 
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${MOVEMENT_DATA_GID}`;

// Never moved cows endpoint
const NEVER_MOVED_COW_CSV_URL = 
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${NEVER_MOVED_COW_GID}`;
```

### Environment Variables Set

✅ `MOVEMENT_DATA_CSV_URL` = `https://docs.google.com/spreadsheets/d/1bzcG70TopGRRm60NbKX4o3SCE2-QRUDFnY0Z4fYSjEM/export?format=csv&gid=1539310010`

✅ `NEVER_MOVED_COW_CSV_URL` = `https://docs.google.com/spreadsheets/d/1bzcG70TopGRRm60NbKX4o3SCE2-QRUDFnY0Z4fYSjEM/export?format=csv&gid=1464106304`

---

## 🚀 Now Your Dashboard Should Work!

### What's Different Now

| Endpoint | Before | After |
|----------|--------|-------|
| `/api/data/processed-data` | GID 1464106304 (Never Moved COWs) ❌ | GID 1539310010 (Movement-data) ✅ |
| `/api/data/never-moved-cows` | GID 1464106304 (Never Moved COWs) ✅ | GID 1464106304 (Never Moved COWs) ✅ |

### Expected Results After Deploy

**Main Dashboard (`/api/data/processed-data`):**
```
✓ Fetches Movement-data sheet (GID 1539310010)
✓ Finds "From Location" and "To Location" columns
✓ Parses movement data successfully
✓ Returns ~445 valid movements
```

**Never Moved COWs Card (`/api/data/never-moved-cows`):**
```
✓ Fetches Dashboard sheet (GID 1464106304)
✓ Finds COW location data
✓ Returns never-moved COWs with status
```

---

## 📋 Deployment Steps

### Step 1: Deploy the Fixed Code
```bash
git add -A
git commit -m "Fix: Use correct GID (1539310010) for Movement-data sheet"
git push origin main
```

### Step 2: Clear Netlify Cache and Redeploy
1. Go to https://app.netlify.com
2. Select **cow-analysis** site
3. Click **Deploys** tab
4. Click **Clear cache and retry deploy**
5. Wait 2-3 minutes for deployment

### Step 3: Verify It's Fixed

Visit these endpoints to confirm:

```
https://cow-analysis.netlify.app/api/data/csv-viewer
```

**Expected response:**
```json
{
  "httpStatus": 200,
  "csvSize": 5234,
  "isEmpty": false,
  "isHTML": false,
  "lineCount": 450,
  "headerCount": 31
}
```

Then visit the main endpoint:

```
https://cow-analysis.netlify.app/api/data/processed-data
```

**Expected:** No error, returns movement data with ~445 rows

---

## 🎓 Why This Happened

Google Sheets allows multiple sheets within a single spreadsheet file. Each sheet has:
- **Sheet ID** (the file itself): `1bzcG70TopGRRm60NbKX4o3SCE2-QRUDFnY0Z4fYSjEM`
- **GID** (the specific tab): `1539310010` or `1464106304`

The original code assumed both datasets were in the same sheet (same GID), when actually they're in different tabs within the same file.

---

## ✨ Key Takeaways

✅ **Correct CSV URL structure:**
```
https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={GID}
```

✅ **Your Sheet Details:**
- Sheet ID: `1bzcG70TopGRRm60NbKX4o3SCE2-QRUDFnY0Z4fYSjEM`
- Movement-data GID: `1539310010`
- Never Moved COWs GID: `1464106304`

✅ **Environment Variables Used:**
- `MOVEMENT_DATA_CSV_URL` → Points to GID 1539310010
- `NEVER_MOVED_COW_CSV_URL` → Points to GID 1464106304

---

## 🧪 Test Commands

After deployment, test with:

```bash
# Check movement data CSV
curl "https://cow-analysis.netlify.app/api/data/csv-viewer"

# Check processing
curl "https://cow-analysis.netlify.app/api/data/processed-data"

# Check never moved cows
curl "https://cow-analysis.netlify.app/api/data/never-moved-cows"

# Check diagnostics
curl "https://cow-analysis.netlify.app/api/data/diagnostic"
```

---

## 📞 Next Steps

1. **Deploy code changes** (git push)
2. **Wait for Netlify** to build and deploy (2-3 minutes)
3. **Visit dashboard** at https://cow-analysis.netlify.app
4. Should see movement data loading and never-moved COWs card populated

**Your dashboard should now be working!** 🎉
