# Diagnostic Endpoints Reference

**Dashboard URL:** https://cow-analysis.netlify.app

---

## 🔍 Available Diagnostic Endpoints

### 1. **CSV Viewer** (Most Important for Debugging)

```
https://cow-analysis.netlify.app/api/data/csv-viewer
```

**What it does:** Fetches the CSV from Google Sheets and shows raw content analysis

**Response shows:**

- HTTP status code
- CSV file size
- Number of lines
- Whether it's HTML or CSV
- First 3 lines of content

**Use this to:**

- Verify CSV is being fetched
- Check if response is valid
- See first few rows of data

**Example Good Response:**

```json
{
  "httpStatus": 200,
  "csvSize": 5234,
  "lineCount": 450,
  "isEmpty": false,
  "isHTML": false,
  "headerCount": 31,
  "firstDataRowCellCount": 31,
  "firstLine": "COW_ID,Site_Label,Last_Deploy_Date,...",
  "secondLine": "COW-001,Riyadh,2024-01-10,..."
}
```

**Example Bad Response (Empty CSV):**

```json
{
  "httpStatus": 200,
  "csvSize": 0,
  "isEmpty": true,
  "lineCount": 0,
  "error": "CSV is completely empty"
}
```

**Example Bad Response (HTML Error):**

```json
{
  "httpStatus": 200,
  "csvSize": 4532,
  "isEmpty": false,
  "isHTML": true,
  "warning": "Response contains HTML, not CSV!",
  "first200Chars": "<!DOCTYPE html>..."
}
```

---

### 2. **Main Data Endpoint**

```
https://cow-analysis.netlify.app/api/data/processed-data
```

**What it does:**

- Fetches CSV
- Parses columns
- Detects column positions
- Validates required fields
- Returns processed movement data

**Response shows:**

- Array of movements with COW_ID, from/to locations, etc.
- Array of COWs
- Array of locations

**Use this to:**

- Test if dashboard data works
- See final processed data structure

**Check Netlify function logs** to see detailed parsing info:

```
📋 HEADER ROW (31 columns):
   [0] = "COW_ID"
   [16] = "From_Location"
   [20] = "To_Location"

🔍 COLUMN DETECTION:
   COW ID: ✓ Found at index 0
   FROM LOCATION: ✓ Found at index 16
   TO LOCATION: ✓ Found at index 20

📊 PARSING SUMMARY:
   ✓ Valid rows: 445
   ✗ Skipped: 5
```

---

### 3. **Never Moved COWs Endpoint**

```
https://cow-analysis.netlify.app/api/data/never-moved-cows
```

**What it does:**

- Fetches Dashboard sheet CSV (GID: 1464106304)
- Parses never-moved COW data
- Returns COWs that never moved + statistics

**Response shows:**

```json
{
  "cows": [
    {
      "COW_ID": "COW-001",
      "Region": "CENTRAL",
      "Location": "Riyadh",
      "Status": "ON-AIR",
      "Days_On_Air": 365
    }
  ],
  "stats": {
    "total": 150,
    "onAir": 120,
    "offAir": 30
  }
}
```

---

### 4. **Diagnostic Endpoint**

```
https://cow-analysis.netlify.app/api/data/diagnostic
```

**What it does:**

- Tests connectivity to both CSV URLs
- Shows HTTP status for each URL
- Provides recommendations

**Response shows:**

```json
{
  "urls": {
    "movement_data": "https://docs.google.com/.../pub?gid=1464106304&...",
    "never_moved_cows": "https://docs.google.com/.../pub?gid=1464106304&..."
  },
  "urlsAttempted": [
    {
      "endpoint": "movement_data",
      "status": 200,
      "success": true
    },
    {
      "endpoint": "never_moved_cows",
      "status": 200,
      "success": true
    }
  ],
  "recommendations": [
    "✓ Movement-data CSV is accessible and working.",
    "✓ Never-moved-cows CSV is accessible and working."
  ]
}
```

---

## 🚨 Troubleshooting Decision Tree

```
Start: Dashboard shows "Unable to Load Dashboard Data"
   ↓
1. Visit /api/data/csv-viewer
   ├─ httpStatus ≠ 200?
   │  └─ CSV URL is wrong or inaccessible
   │     → Check URL in MOVEMENT_DATA_CSV_URL
   │
   ├─ isEmpty: true?
   │  └─ CSV is empty (no data in sheet)
   │     → Check Google Sheet has data
   │
   ├─ isHTML: true?
   │  └─ Sheet not published to web
   │     → File → Share → Publish to web
   │
   └─ csvSize > 0 && isHTML: false?
      └─ CSV is good! Go to step 2
         ↓
2. Visit /api/data/processed-data
   ├─ See error in logs?
   │  └─ Check error message
   │
   └─ Check Netlify function logs
      ├─ "HEADER ROW" section shows correct columns?
      │  └─ Good! Go to step 3
      │
      └─ "Valid rows: 0"?
         └─ Columns are empty or wrong position
            → Check column indices match your data
```

---

## 📋 Debugging Workflow

### Step 1: Check Raw CSV

```bash
curl https://cow-analysis.netlify.app/api/data/csv-viewer
```

If this shows errors → **Fix the CSV URL or publish the sheet**

### Step 2: Check Parsing

```bash
curl https://cow-analysis.netlify.app/api/data/processed-data
```

Then **check Netlify function logs** for detailed output

If "Valid rows: 0" → **Columns are empty or in wrong positions**

### Step 3: Check Dashboard

```
https://cow-analysis.netlify.app
```

If still failing → Check browser console (F12) for errors

---

## 🔍 Key Things to Look For

### CSV Viewer Response

- ✓ `httpStatus: 200` - URL is working
- ❌ `httpStatus: 404` - URL doesn't exist
- ❌ `httpStatus: 403` - Access denied

- ✓ `csvSize: > 100` - CSV has content
- ❌ `csvSize: 0` - CSV is empty

- ✓ `isHTML: false` - Valid CSV format
- ❌ `isHTML: true` - Got error page (sheet not published)

### Parsing Logs

- ✓ `COW ID: ✓ Found at index 0` - Column found
- ❌ `COW ID: ✗ NOT FOUND - will use index 0` - Column not found

- ✓ `Valid rows: 445` - Data was parsed
- ❌ `Valid rows: 0` - All rows rejected

---

## 💡 Quick Fixes

| Symptom           | Cause               | Fix                           |
| ----------------- | ------------------- | ----------------------------- |
| `csvSize: 0`      | Empty CSV           | Check Google Sheet has data   |
| `isHTML: true`    | Sheet not published | File → Share → Publish to web |
| `httpStatus: 404` | URL wrong           | Test URL in browser           |
| `Valid rows: 0`   | Empty columns       | Check column data in sheet    |
| Dashboard blank   | API not responding  | Check /csv-viewer endpoint    |

---

## 🧪 Test All Endpoints

**Healthy system output:**

```bash
# 1. CSV is accessible
curl https://cow-analysis.netlify.app/api/data/csv-viewer
# Response: csvSize > 0, isEmpty: false, isHTML: false

# 2. Data parses correctly
curl https://cow-analysis.netlify.app/api/data/processed-data
# Response: contains movements array with > 0 items

# 3. Diagnostic is healthy
curl https://cow-analysis.netlify.app/api/data/diagnostic
# Response: all URLs success: true

# 4. Dashboard loads
curl https://cow-analysis.netlify.app
# Response: HTML page loads (HTTP 200)
```

---

## 📞 When Asking for Help

Tell me:

1. **CSV Viewer response:**

   ```json
   {
     "httpStatus": ?,
     "csvSize": ?,
     "isEmpty": ?,
     "isHTML": ?,
     "lineCount": ?,
     "headerCount": ?
   }
   ```

2. **If csvSize > 0, the first line:**

   ```
   "firstLine": "[show exact content]"
   ```

3. **Processing logs (from Netlify):**
   ```
   [paste the 📊 PARSING SUMMARY section]
   ```

With this info, I can pinpoint the exact issue! 🎯
