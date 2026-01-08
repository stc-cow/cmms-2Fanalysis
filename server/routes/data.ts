import { Router, Request, Response } from "express";

const router = Router();

/**
 * Fetch data from Google Sheets as CSV
 * Google Sheets Export URL format:
 * https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={GID}
 */
router.get("/import-data", async (req: Request, res: Response) => {
  try {
    // Configuration
    const SHEET_ID = "2PACX-1vTFm8lIuL_0cRCLq_jIa12vm1etX-ftVtl3XLaZuY2Jb_IDi4M7T-vq-wmFIra9T2BiAtOKkEZkbQwz";
    const GID = "1539310010"; // Sheet tab ID
    const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

    console.log(`Fetching data from Google Sheets: ${CSV_URL}`);

    const response = await fetch(CSV_URL);
    if (!response.ok) {
      throw new Error(`Google Sheets returned ${response.status}`);
    }

    const csvData = await response.text();

    res.setHeader("Content-Type", "text/csv");
    res.send(csvData);
  } catch (error) {
    console.error("Error fetching Google Sheet data:", error);
    res.status(500).json({
      error: "Failed to fetch data from Google Sheets",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Parse and return processed data
 */
router.get("/processed-data", async (req: Request, res: Response) => {
  try {
    const SHEET_ID = "2PACX-1vTFm8lIuL_0cRCLq_jIa12vm1etX-ftVtl3XLaZuY2Jb_IDi4M7T-vq-wmFIra9T2BiAtOKkEZkbQwz";
    const GID = "1539310010";
    const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

    console.log("Fetching and processing data from Google Sheets...");

    const response = await fetch(CSV_URL);
    if (!response.ok) {
      throw new Error(`Google Sheets returned ${response.status}`);
    }

    const csvData = await response.text();

    // Import the parser (dynamic import to avoid bundling issues)
    const { importGoogleSheetData } = await import("@/lib/dataImport.js");
    const processedData = importGoogleSheetData(csvData);

    res.json(processedData);
  } catch (error) {
    console.error("Error processing Google Sheet data:", error);
    res.status(500).json({
      error: "Failed to process data from Google Sheets",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
