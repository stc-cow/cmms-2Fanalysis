const fs = require("fs");
const path = require("path");

// Simple CSV parser that handles quoted fields
function parseCSV(csvContent) {
  const lines = csvContent.trim().split("\n");
  if (lines.length === 0) return [];

  // Parse headers
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);

  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    const values = parseCSVLine(line);
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });

    data.push(row);
  }

  return data;
}

// Parse a single CSV line, handling quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
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

async function convert() {
  try {
    // Read and convert movement data
    const movementCSV = fs.readFileSync("./movement-data.csv", "utf-8");
    const movementData = parseCSV(movementCSV);
    fs.writeFileSync(
      "./public/movement-data.json",
      JSON.stringify(movementData, null, 2),
    );
    console.log(`✓ Movement Data: ${movementData.length} records converted`);

    // Read and convert never-moved cows
    const neverMovedCSV = fs.readFileSync("./never-moved-cows.csv", "utf-8");
    const neverMovedData = parseCSV(neverMovedCSV);
    fs.writeFileSync(
      "./public/never-moved-cows.json",
      JSON.stringify(neverMovedData, null, 2),
    );
    console.log(
      `✓ Never Moved Cows: ${neverMovedData.length} records converted`,
    );

    console.log("\n✓ Conversion complete! Files ready in public/");
    console.log("- public/movement-data.json");
    console.log("- public/never-moved-cows.json");
  } catch (error) {
    console.error("Conversion error:", error.message);
    process.exit(1);
  }
}

convert();
