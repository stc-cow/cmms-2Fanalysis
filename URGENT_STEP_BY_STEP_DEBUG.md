# URGENT: Step-by-Step Debugging

**Error:** "No movement data found in Google Sheet - column mapping may be incorrect"

This means the CSV is either **not being fetched** or **has no valid data rows**.

---

## 🔧 3-Step Diagnostic Process

### STEP 1: Check Raw CSV Content

**Deploy the updated code first:**

```bash
git add -A
git commit -m "Add CSV viewer endpoint for raw content debugging"
git push origin main
```

**Wait for Netlify deployment to complete, then visit:**

```
https://cow-analysis.netlify.app/api/data/csv-viewer
```

**You'll see something like:**

```json
{
  "httpStatus": 200,
  "csvSize": 5234,
  "byteCount": 5234,
  "lineCount": 450,
  "isEmpty": false,
  "isHTML": false,
  "firstLine": "COW_ID,Site_Label,Last_Deploy_Date,...",
  "secondLine": "COW-001,Riyadh,2024-01-10,...",
  "thirdLine": "COW-002,Jeddah,2024-01-09,...",
  "headerCount": 31,
  "firstDataRowCellCount": 31
}
```

---

## ✅ Good Response Means:
- ✓ httpStatus: 200
- ✓ csvSize: > 0
- ✓ isEmpty: false
- ✓ isHTML: false
- ✓ lineCount: > 2
- ✓ firstLine starts with column names

**If you see this → Skip to STEP 3**

---

## ❌ Bad Responses:

### Response: `csvSize: 0` or `isEmpty: true`
**Problem:** CSV is empty
**Solution:** 
1. Check if the Google Sheet has data
2. Verify the GID is correct
3. Check if the sheet is published to web

### Response: `isHTML: true` with HTML content
**Problem:** Google Sheets returned an error page instead of CSV
**Meaning:** Sheet is not published or URL is wrong
**Solution:**
1. Open Google Sheet
2. Click **Share** → **Publish to web**
3. Copy the CSV export URL
4. Update `MOVEMENT_DATA_CSV_URL` environment variable

### Response: `httpStatus: 404` or `500`
**Problem:** HTTP error from Google Sheets
**Meaning:** URL is malformed or doesn't exist
**Solution:**
1. Test the CSV URL in your browser
2. Should download a CSV file, not show error

---

## STEP 2: Check Parsed Data Structure

**Visit:**

```
https://cow-analysis.netlify.app/api/data/processed-data
```

**Look at the Netlify function logs** to see the detailed parsing output.

**Expected output shows:**

```
📋 HEADER ROW (31 columns):
   [0] = "COW_ID"
   [1] = "Site_Label"
   ...
   [16] = "From_Location"
   [20] = "To_Location"

📍 FIRST 5 DATA ROWS:
   Row 1: 31 cells
      [0] = "COW-001"
      [16] = "Warehouse A"
      [20] = "Site B"

🔍 COLUMN DETECTION:
   COW ID: ✓ Found at index 0
   FROM LOCATION: ✓ Found at index 16
   TO LOCATION: ✓ Found at index 20

📊 PARSING SUMMARY:
   ✓ Valid rows: 445
   ✗ Skipped: 5
```

---

## STEP 3: Common Issues & Fixes

### Issue: "csvSize: 0" (Empty CSV)
**Check:**
1. Open Google Sheet → Is there data in columns A-U?
2. Are you using the correct GID?
3. Is the sheet published to web?

**Fix:**
- Add data to the sheet
- Use correct GID
- File → Share → Publish to web

### Issue: "isHTML: true" (Got HTML error page)
**Check:**
1. The sheet is not published
2. URL is incorrect
3. GID is wrong

**Fix:**
```
1. Open Google Sheet in edit mode
2. Click File → Share → Publish to web
3. Select the correct sheet/tab
4. Copy the export URL (with &output=csv)
5. Set environment variable: MOVEMENT_DATA_CSV_URL=[URL]
```

### Issue: "csvSize > 0 but isHTML: true"
**Check:**
- Google Sheets is returning an error page

**Fix:**
- Make sure sheet is published
- Try the URL in browser - should download CSV, not show error page

### Issue: CSV loads but "No movement data found"
**Check:**
1. Is column [0] (COW_ID) populated with data?
2. Is column [16] (From_Location) populated?
3. Is column [20] (To_Location) populated?

**Look at the parsing logs:**
```
Row 1:
   cells[0] = ""  ← EMPTY - This is the problem!
   cells[16] = "Warehouse A"
   cells[20] = "Site B"
```

**Fix:**
- Your COW_ID column is empty
- Verify the GID points to the right sheet
- Or the column positions are wrong

---

## 🎯 What To Tell Me

Run these steps and tell me:

1. **CSV Viewer Response:**
   ```
   httpStatus: ?
   csvSize: ?
   isEmpty: ?
   isHTML: ?
   lineCount: ?
   ```

2. **If csvSize > 0, show first lines:**
   ```
   firstLine: [exact content]
   secondLine: [exact content]
   thirdLine: [exact content]
   ```

3. **Parsing logs (if available):**
   ```
   📊 PARSING SUMMARY:
   ✓ Valid rows: ?
   ✗ Skipped: ?
   ```

With this info, I can pinpoint the exact issue!

---

## 📞 Quick Checklist

- [ ] Deployed new code with csv-viewer endpoint
- [ ] Visited `/api/data/csv-viewer` endpoint
- [ ] Noted the csvSize, isEmpty, isHTML values
- [ ] Checked if csvSize is 0 or > 0
- [ ] (If size > 0) Visited `/api/data/processed-data`
- [ ] Checked Netlify function logs for parsing output
- [ ] Ready to share results

---

## 🆘 Still Not Working?

1. **Visit csv-viewer** and tell me the exact response
2. **Open the CSV URL in browser** - should download file, not show error
3. **Verify the GID** - the sheet ID at end of the URL (gid=1464106304)
4. **Check Google Sheet** - open it, make sure data is there

**Most Common Issue:** The sheet is not published to web
- Open sheet → Click Share → Look for "Published to web" → If not there, click "Publish"

---

## Next Steps

1. Deploy the code
2. Visit `/api/data/csv-viewer`
3. Share the response with me
4. We'll fix it from there! 🚀
