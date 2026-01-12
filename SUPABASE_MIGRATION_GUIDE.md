# Supabase Migration Guide

This guide walks you through migrating from Google Sheets to Supabase.

## Current Status ✅

- ✅ Supabase tables created
- ✅ RLS policies enabled
- ✅ Hybrid data source configured (Supabase primary, Google Sheets fallback)
- ✅ Migration endpoint created
- 🔄 **NEXT: Execute the migration**

## Your Supabase Project

- **Project ID**: rmcgmcmqpjhqxrwuzbmy
- **URL**: https://rmcgmcmqpjhqxrwuzbmy.supabase.co
- **API Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtY2dtY21xcGpocXhyd3V6Ym15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2OTY1MjgsImV4cCI6MjA4MzI3MjUyOH0.GcHML7-cwhrtCcsqf7IylJWz8A62yURIEhQbMSHcV68

## Step-by-Step Migration

### 1. **Create Tables in Supabase** ✅ (DONE)

Tables have been created with proper schema:

- `dim_cow` - COW equipment details
- `dim_location` - Location/warehouse data
- `movement_data` - COW movement records  
- `dim_event` - Event definitions
- `never_moved_cow` - Static COW data

### 2. **Enable RLS Policies** ✅ (DONE)

Row-Level Security is enabled with public read-only access:

```sql
-- Read-only access for all users
create policy "public read <table>"
on <table>
for select
using (true);
```

### 3. **Import Data from Google Sheets** 🔄 (NEXT)

#### Option A: Automatic Import via Migration Endpoint (Recommended)

The migration endpoint automatically fetches from Google Sheets and imports to Supabase.

**Make a POST request to:**

```
POST http://localhost:8080/api/migrate/import-google-sheets
```

**Using curl:**
```bash
curl -X POST http://localhost:8080/api/migrate/import-google-sheets
```

**Using JavaScript/Fetch:**
```javascript
const response = await fetch('http://localhost:8080/api/migrate/import-google-sheets', {
  method: 'POST'
});
const data = await response.json();
console.log(data); // Shows import summary
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Data migration completed successfully",
  "summary": {
    "movements": 2534,
    "cows": 427,
    "locations": 1208
  }
}
```

#### Option B: Manual Import via Supabase Dashboard

1. Export CSV from Google Sheets:
   - Sheet: "Movement-data"
   - File → Download → CSV
   - Save as: `movement_data.csv`

2. In Supabase Dashboard:
   - Go to Table Editor
   - Select `movement_data` table
   - Click "Insert" → "Import CSV"
   - Upload `movement_data.csv`
   - Map columns (should auto-detect)
   - Confirm and import

### 4. **Verify Data Import**

Check the Supabase Dashboard:
- https://app.supabase.com/project/rmcgmcmqpjhqxrwuzbmy/editor

Tables should show:
- `movement_data`: 2534+ rows
- `dim_cow`: 427+ rows
- `dim_location`: 1208+ rows
- `never_moved_cow`: n rows

### 5. **Application Now Uses Hybrid Source**

The application automatically:

1. **Tries Supabase first** (fast, no Google dependency)
2. **Falls back to Google Sheets** (if Supabase fails)
3. **Caches for 5 minutes** (reduces API calls)

**Current data flow:**
```
Movement-data CSV
├─→ Supabase (primary)
└─→ Google Sheets (fallback)
    ↓
Application (useDashboardData)
    ↓
Dashboard UI
```

## Testing the Migration

### 1. Check if Supabase is being used

Check browser console or server logs for:

```
✓ Fetching data from Supabase...
✓ Fetched from Supabase:
  - 2534 movements
  - 427 cows
  - 1208 locations
```

### 2. Verify application still works

Visit the dashboard and confirm:
- Executive Overview loads
- Map displays regions with color intensity
- Vendor charts show data
- All KPIs are populated

### 3. Check performance

Should notice:
- Faster page loads (Supabase is faster than Google Sheets)
- No more hanging issues
- Smooth interaction

## After Migration: Production Setup

### Step 1: Keep Both Sources Active

**Current setup (hybrid) is safe:**
- Uses Supabase if available
- Falls back to Google Sheets if needed
- Works during transition

### Step 2: Rotate Service Role Key (CRITICAL)

The service role key has been exposed in code. After migration succeeds:

1. Go to **Supabase Dashboard → Project Settings → API**
2. Click **"Regenerate"** on `service_role` key
3. Update `.env` files with new key
4. Redeploy application

### Step 3: Remove Google Sheets (Optional, After Stable)

Once confirmed working on Supabase:

1. Remove `MOVEMENT_DATA_CSV_URL` from `.env`
2. Remove `NEVER_MOVED_COW_CSV_URL` from `.env`
3. Simplify `server/routes/data.ts` (remove Google Sheets fallback)
4. Delete `GOOGLE_APPS_SCRIPT_ENDPOINT.gs`
5. Unpublish Google Sheets (if desired)

## Troubleshooting

### Migration Shows 0 Rows Imported

**Issue**: CSV parsing failed
**Solution**:
1. Check Google Sheet is published to web
2. Try manual import via Supabase Dashboard
3. Check column headers match expected schema

### Application Still Uses Google Sheets

**Issue**: Supabase fetch failing
**Solution**:
1. Check `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set
2. Check Supabase project is accessible
3. Check RLS policies (should allow public read)
4. See server logs for detailed error

### Data Looks Different

**Issue**: Schema mismatch
**Solution**:
1. Ensure column names are exactly mapped
2. Check data types match (text, numeric, timestamp)
3. Verify no data was lost during import

## Database Schema

### movement_data
```
id: bigint (PK)
sn: integer
cow_id: text (FK → dim_cow)
from_location_id: text
to_location_id: text  
moved_datetime: timestamp
movement_type: text (Full/Half/Zero)
distance_km: numeric
vendor: text
ebu_royal_category: text (ROYAL/EBU/NON EBU)
```

### dim_cow
```
cow_id: text (PK)
tower_type: text
vendor: text
shelter_type: text
installation_date: date
remarks: text
```

### dim_location
```
location_id: text (PK)
location_name: text
latitude: numeric
longitude: numeric
region: text (WEST/EAST/CENTRAL/SOUTH)
governorate: text (official administrative region)
location_type: text (Site/Warehouse)
owner: text (STC/ACES)
```

### never_moved_cow
```
id: bigint (PK)
cow_id: text
region: text
remarks: text
```

## Security & Best Practices

✅ **Implemented**:
- RLS enabled (row level security)
- Read-only policies for public access
- Service role key in `.env` only
- No data exposed in frontend

⚠️ **To Do**:
- [ ] Rotate service role key after migration
- [ ] Remove Google Sheets fallback (after stable)
- [ ] Enable backup in Supabase (Settings → Backups)
- [ ] Set up monitoring alerts

## Support

If migration fails:
1. Check Supabase dashboard for table status
2. Review server logs: `console.log` output
3. Verify CSV columns match schema
4. Try manual import via Supabase UI

---

**Status**: Hybrid system active. Ready for migration.
**Next**: Execute migration endpoint or manual import.
