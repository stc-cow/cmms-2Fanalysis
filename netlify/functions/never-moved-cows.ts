import { Handler } from "@netlify/functions";

const MOVEMENT_DATA_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTFm8lIuL_0cRCLq_jIa12vm1etX-ftVtl3XLaZuY2Jb_IDi4M7T-vq-wmFIra9T2BiAtOKkEZkbQwz/pub?gid=1539310010&single=true&output=csv";

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

const handler: Handler = async () => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=300",
  };

  try {
    // Fetch CSV from Google Sheets
    const response = await fetch(MOVEMENT_DATA_CSV_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "Failed to fetch data",
          cows: [],
          totalCount: 0,
        }),
      };
    }

    const csvText = await response.text();

    if (
      typeof csvText !== "string" ||
      csvText.includes("<html") ||
      csvText.includes("<!DOCTYPE")
    ) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          cows: [],
          totalCount: 0,
          timestamp: new Date().toISOString(),
        }),
      };
    }

    const lines = csvText.trim().split("\n");
    if (lines.length < 2) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          cows: [],
          totalCount: 0,
          timestamp: new Date().toISOString(),
        }),
      };
    }

    // Track COWs with movements
    const cowsWithMovements = new Set<string>();
    
    // Extract static COW data with coordinates
    const staticCowData = new Map<
      string,
      { latitude: number; longitude: number }
    >();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]?.trim();
      if (!line) continue;

      const cells = parseCSVLine(line);
      
      // Column 0: Movement COW ID - track all COWs with movement records
      const movementCowId = cells[0]?.trim();
      if (movementCowId) {
        cowsWithMovements.add(movementCowId);
      }

      // Columns 31-46: Static COW data (same row)
      // Column 31: Static COW ID
      // Column 39: Latitude (in static section)
      // Column 40: Longitude (in static section)
      const staticCowId = cells[31]?.trim();
      
      if (staticCowId) {
        // Extract coordinates from static COW section
        if (cells[39] && cells[40]) {
          const lat = parseFloat(cells[39].trim());
          const lon = parseFloat(cells[40].trim());

          if (!isNaN(lat) && !isNaN(lon)) {
            // Store the first valid coordinates found for this COW
            if (!staticCowData.has(staticCowId)) {
              staticCowData.set(staticCowId, { latitude: lat, longitude: lon });
            }
          }
        }
      }
    }

    // Find never-moved cows: Static COWs that DON'T appear in movement data
    const neverMovedCows = Array.from(staticCowData.entries())
      .filter(([cowId]) => !cowsWithMovements.has(cowId))
      .map(([cowId, coords]) => ({
        COW_ID: cowId,
        Latitude: coords.latitude,
        Longitude: coords.longitude,
      }));

    console.log(`Found ${cowsWithMovements.size} COWs with movements`);
    console.log(`Found ${staticCowData.size} static COWs`);
    console.log(`Found ${neverMovedCows.length} never-moved COWs`);

    const responseData = {
      cows: neverMovedCows,
      totalCount: neverMovedCows.length,
      timestamp: new Date().toISOString(),
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(responseData),
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error in never-moved-cows function:", errorMessage);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Internal server error",
        message: errorMessage,
        cows: [],
        totalCount: 0,
      }),
    };
  }
};

export { handler };
