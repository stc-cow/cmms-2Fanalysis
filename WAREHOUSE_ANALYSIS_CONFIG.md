# Warehouse Analysis Configuration ✅

## Overview

The **Warehouse Intelligence Card** now properly analyzes dispatch (outgoing) and receiving (incoming) warehouses with region-based filtering.

---

## Column Mapping (Google Sheet)

| Purpose | Column | Index | Header Name | Usage |
|---------|--------|-------|-------------|-------|
| **Dispatch Source** | O | 14 | "From Location" | Identify dispatch/outgoing warehouses |
| **Dispatch Region** | AA | 26 | "Region From" | Region where COW is dispatched FROM |
| **Receiving Dest** | U | 20 | "To Location" | Identify receiving/incoming warehouses |
| **Receiving Region** | AB | 27 | "Region To" | Region where COW is received TO |
| **Distance** | Y | 24 | "Distance (KM)" | Movement distance (KM) |

---

## Warehouse Detection Logic

### Dispatch Warehouses
```
IF "WH" found in Column O ("From Location")
  THEN:
    - Warehouse_Name = From Location value
    - Region = Column AA ("Region From")
    - Movement_Type = "OUTGOING" / "DISPATCH"
```

### Receiving Warehouses
```
IF "WH" found in Column U ("To Location")
  THEN:
    - Warehouse_Name = To Location value
    - Region = Column AB ("Region To")
    - Movement_Type = "INCOMING" / "RECEIVE"
```

---

## Warehouse Master Data

| Warehouse Name | Region |
|---|---|
| stc Sharma WH | West |
| ACES Makkah WH | West |
| ACES Muzahmiya WH | Central |
| stc Riyadh Exit 18 WH | Central |
| stc Jeddah WH | West |
| ACES Dammam WH | East |
| stc Abha WH | South |
| stc Al Ula WH | West |
| stcc Madinah WH | West |
| Madaf WH | Central |
| stc Al Kharaj WH | Central |
| stc Jizan WH | South |
| HOI Al Kharaj WH | Central |
| stc Taboulk WH | West |
| stc Arar WH | East |
| stc Umluj WH | West |
| stc Sakaka WH | East |
| stc Burida WH | Central |

---

## Dashboard Features

### 1. Region Filter Buttons
Located at the top of **Warehouse Locations** section:
- **All** - Show all warehouses across all regions
- **WEST** - Show only West region warehouses
- **EAST** - Show only East region warehouses
- **CENTRAL** - Show only Central region warehouses
- **SOUTH** - Show only South region warehouses

### 2. Top Dispatch Warehouses Chart
Shows warehouses with the **most outgoing movements** (FROM Location):
- X-axis: Warehouse names (with "WH" removed for clarity)
- Y-axis: Number of outgoing movements
- Filter: Respects selected region

### 3. Top Receiving Warehouses Chart
Shows warehouses with the **most incoming movements** (TO Location):
- X-axis: Warehouse names (with "WH" removed for clarity)
- Y-axis: Number of incoming movements
- Filter: Respects selected region

### 4. Warehouse Analytics Table
Displays detailed metrics for all warehouses:

| Column | Description |
|--------|-------------|
| **Warehouse** | Full warehouse name |
| **Region** | West / East / Central / South |
| **Owner** | Warehouse owner (STC / ACES / Madaf / HOI) |
| **Outgoing** | Number of movements FROM this warehouse |
| **Incoming** | Number of movements TO this warehouse |
| **Avg Out (KM)** | Average distance for outgoing movements |
| **Avg In (KM)** | Average distance for incoming movements |
| **Idle Days** | Total days COW spent idle in warehouse |

---

## Region-Based Filtering Behavior

When user selects a region from the filter buttons:

### Dispatch Warehouses (Top Dispatch Chart)
```
SHOW IF:
  Warehouse has "WH" in Column O (From Location)
  AND Warehouse's Region (Column AA) matches selected region
```

### Receiving Warehouses (Top Receiving Chart)
```
SHOW IF:
  Warehouse has "WH" in Column U (To Location)
  AND Warehouse's Region (Column AB) matches selected region
```

### Analytics Table
```
SHOW IF:
  (selectedRegion is NULL) OR (Warehouse.Region == selectedRegion)
```

---

## Data Processing Flow

### Backend (server/routes/data.ts)
1. Parse CSV from Google Sheets
2. Extract columns:
   - Column O (14): From Location
   - Column U (20): To Location
   - Column AA (26): Region From
   - Column AB (27): Region To
3. Identify warehouses by checking "WH" in location names
4. Return structured JSON to frontend

### Frontend (client/components/dashboard/cards/WarehouseIntelligenceCard.tsx)
1. Receive movements and locations data
2. Filter locations to find warehouses (Location_Type = "Warehouse" OR name includes "WH")
3. Calculate warehouse metrics:
   - Count outgoing movements (From_Location_ID)
   - Count incoming movements (To_Location_ID)
   - Calculate average distances
   - Track idle days
4. Apply region filter when user selects a region
5. Display charts and tables with filtered results

---

## Example Data Flow

### Raw CSV Row
```
COW_ID: COW-001
From Location (Col O): stc Sharma WH    ← Contains "WH"
To Location (Col U): Riyadh Site        ← No "WH"
Region From (Col AA): West              ← Dispatch region
Region To (Col AB): Central             ← Receiving region
Distance (Col Y): 450.5 km
```

### After Processing
```
{
  COW_ID: "COW-001",
  From_Location_ID: "stc-sharma-wh",
  To_Location_ID: "riyadh-site",
  Distance_KM: 450.5,
  Region_From: "West",
  Region_To: "Central",
  Movement_Type: "HALF" (WH to Site)
}

Warehouse Metrics:
{
  Warehouse: "stc Sharma WH",
  Region: "West",
  Outgoing_Movements: 1,  (this movement)
  Incoming_Movements: 0,  (if not receiving here)
  Avg_Outgoing_Distance: 450.5 km
  Idle_Days: 0
}
```

### After Region Filter (West Selected)
```
Show: "stc Sharma WH" ✓ (Region = West)
Hide: Other warehouses not in West region
```

---

## File Changes

### Backend
- **`server/routes/data.ts`** (Line 141-149)
  - Updated `fromLocationIdx` from column Q (16) to column O (14)
  - Added documentation for warehouse column mapping

### Frontend
- **`client/components/dashboard/cards/WarehouseIntelligenceCard.tsx`**
  - Added `filteredMetrics` calculation based on selected region
  - Updated `topOutgoing` and `topIncoming` to use filtered metrics
  - Updated table to display filtered results
  - Added region filter subtitle to help users understand dispatch vs receiving

---

## Testing Checklist

- [ ] Select "West" region → Only West warehouses shown
- [ ] Select "East" region → Only East warehouses shown
- [ ] Select "Central" region → Only Central warehouses shown
- [ ] Select "South" region → Only South warehouses shown
- [ ] Select "All" → All warehouses shown
- [ ] Charts update when region changes
- [ ] Table updates when region changes
- [ ] Outgoing count reflects "From Location" with "WH"
- [ ] Incoming count reflects "To Location" with "WH"
- [ ] Region badges show correct region per warehouse
- [ ] Distance averages calculate correctly per region

---

## Key Points

✅ **Column O** → Dispatch source (From Location)  
✅ **Column U** → Receiving destination (To Location)  
✅ **Column AA** → Dispatch region (Region From)  
✅ **Column AB** → Receiving region (Region To)  
✅ **"WH" Detection** → Identifies warehouse locations  
✅ **Region Filtering** → Dashboard filters by selected region  
✅ **Master Data** → 18 warehouses with region assignments  
✅ **Metrics** → Outgoing, incoming, distance, and idle days  

---

## Deployment Status

✅ **Built**: Successfully compiled  
✅ **Deployed**: Pushed to `docs/` folder  
✅ **Live**: GitHub Pages serving new version  

The Warehouse Analysis card is now fully configured with proper dispatch/receiving and region-based filtering! 🏢
