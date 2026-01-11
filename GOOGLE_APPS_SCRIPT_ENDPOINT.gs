/**
 * Google Apps Script Web Endpoint for Never Moved COWs
 * Deploy as: Web app
 * Execute as: Your account
 * Who has access: Anyone
 * 
 * This script serves the "Never Moved COW" data as JSON
 * that can be consumed by the COW Analytics dashboard
 */

/**
 * Main HTTP handler - called when the web app receives a GET request
 * Returns JSON data of all Never Moved COWs
 */
function doGet(e) {
  try {
    // Get the spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Get the "Never Moved COW" sheet
    const SOURCE_SHEET_NAME = "Never Moved COW";
    const source = ss.getSheetByName(SOURCE_SHEET_NAME);
    
    if (!source) {
      return ContentService
        .createTextOutput(JSON.stringify({
          error: 'Sheet "Never Moved COW" not found',
          status: 404,
          timestamp: new Date().toISOString()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Read all data
    const lastRow = source.getLastRow();
    
    if (lastRow < 2) {
      return ContentService
        .createTextOutput(JSON.stringify({
          data: [],
          stats: {
            total: 0,
            onAir: 0,
            offAir: 0
          },
          timestamp: new Date().toISOString()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get data range (A2:M + all rows)
    const data = source.getRange("A2:M" + lastRow).getValues();
    const output = [];
    let onAirCount = 0;
    let offAirCount = 0;
    
    // Parse each row
    data.forEach(row => {
      const cowId = row[0];      // A - COW ID
      const region = row[3];     // D - Region
      const district = row[4];   // E - District
      const city = row[5];       // F - City
      const location = row[7];   // H - Location
      const latitude = row[8];   // I - Latitude
      const longitude = row[9];  // J - Longitude
      const status = (row[10] || "OFF-AIR").toString().trim().toUpperCase(); // K - Status
      const lastDeploy = row[11];   // L - Last Deploying Date
      const firstDeploy = row[12];  // M - First Deploying Date
      
      // Skip rows with missing critical fields
      if (!cowId || latitude === "" || longitude === "") return;
      
      // Calculate days on air
      let daysOnAir = 0;
      if (firstDeploy && firstDeploy !== "") {
        try {
          const deployDate = new Date(firstDeploy);
          const today = new Date();
          daysOnAir = Math.floor(
            (today.getTime() - deployDate.getTime()) / (1000 * 60 * 60 * 24)
          );
        } catch (e) {
          daysOnAir = 0;
        }
      }
      
      // Count status
      if (status === "ON-AIR") {
        onAirCount++;
      } else {
        offAirCount++;
      }
      
      // Add to output
      output.push({
        COW_ID: cowId.toString().trim(),
        Region: region ? region.toString().trim() : "",
        District: district ? district.toString().trim() : "",
        City: city ? city.toString().trim() : "",
        Location: location ? location.toString().trim() : "",
        Latitude: parseFloat(latitude) || 0,
        Longitude: parseFloat(longitude) || 0,
        Status: status === "ON-AIR" ? "ON-AIR" : "OFF-AIR",
        Last_Deploy_Date: lastDeploy ? lastDeploy.toString() : "",
        First_Deploy_Date: firstDeploy ? firstDeploy.toString() : "",
        Days_On_Air: daysOnAir
      });
    });
    
    // Build response
    const response = {
      data: output,
      cows: output, // Alias for compatibility
      stats: {
        total: output.length,
        onAir: onAirCount,
        offAir: offAirCount
      },
      source: "Never Moved COW",
      timestamp: new Date().toISOString(),
      recordCount: output.length
    };
    
    // Return as JSON
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        error: error.toString(),
        status: 500,
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Helper function to test the script locally (in Apps Script editor)
 * Run this in the Apps Script editor to see the output
 */
function testEndpoint() {
  const result = doGet({});
  Logger.log(result.getContent());
}

/**
 * Dashboard creation helper (from your original script)
 * This creates a visual dashboard in the spreadsheet
 */
function deployNeverMovedCOW_Dashboard_Once() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const SOURCE_SHEET_NAME = "Never Moved COW";
  let source = ss.getSheetByName(SOURCE_SHEET_NAME);
  
  if (!source) {
    throw new Error(
      'Source sheet "' + SOURCE_SHEET_NAME + '" not found.\n' +
      'Please check spelling and spaces exactly.'
    );
  }
  
  const DASHBOARD_SHEET_NAME = "Dashboard";
  let dashboard = ss.getSheetByName(DASHBOARD_SHEET_NAME);
  
  if (!dashboard) {
    dashboard = ss.insertSheet(DASHBOARD_SHEET_NAME);
  }
  
  dashboard.clear();
  dashboard.getRange("A:Z").clearContent();
  
  const lastRow = source.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert("No data found in Never Moved COW.");
    return;
  }
  
  const data = source.getRange("A2:M" + lastRow).getValues();
  const output = [];
  
  data.forEach(row => {
    const cowId = row[0];
    const region = row[3];
    const district = row[4];
    const city = row[5];
    const location = row[7];
    const latitude = row[8];
    const longitude = row[9];
    const status = row[10];
    const lastDeploy = row[11];
    const firstDeploy = row[12];
    
    if (!cowId || !latitude || !longitude) return;
    
    output.push([
      cowId,
      region,
      district,
      city,
      location,
      latitude,
      longitude,
      status,
      lastDeploy,
      firstDeploy
    ]);
  });
  
  dashboard.getRange("A1:J1").setValues([[
    "COW ID",
    "Region",
    "District",
    "City",
    "Location",
    "Latitude",
    "Longitude",
    "Status",
    "Last Deploying Date",
    "First Deploying Date"
  ]]);
  
  if (output.length > 0) {
    dashboard
      .getRange(2, 1, output.length, output[0].length)
      .setValues(output);
  }
  
  let onAir = 0;
  let offAir = 0;
  
  output.forEach(r => {
    if (r[7] === "ON-AIR") onAir++;
    if (r[7] === "OFF-AIR") offAir++;
  });
  
  dashboard.getRange("L1:M4").setValues([
    ["Metric", "Count"],
    ["ON-AIR", onAir],
    ["OFF-AIR", offAir],
    ["TOTAL", onAir + offAir]
  ]);
  
  dashboard.setFrozenRows(1);
  dashboard.autoResizeColumns(1, 10);
  
  SpreadsheetApp.getUi().alert(
    "Deployment completed successfully.\n\n" +
    "✔ Source: Never Moved COW\n" +
    "✔ Dashboard created\n" +
    "✔ Data formatted"
  );
}
