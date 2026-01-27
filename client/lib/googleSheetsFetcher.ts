/**
 * ⚠️ DEPRECATED - No longer used
 *
 * This module previously fetched CSV data directly from Google Sheets APIs.
 *
 * ❌ All functions in this file are deprecated
 *
 * **Why deprecated:**
 * - Removed dependency on external Google Sheets APIs
 * - All data now served from static JSON files (/public)
 * - Faster load times, no network dependency on Google Sheets
 * - Better offline support
 *
 * **New approach:**
 * - Use client/lib/localDataFetcher.ts instead
 * - Data loaded from:
 *   - /movement-data.json
 *   - /never-moved-cows.json
 *
 * **Migration guide:**
 * - Replace imports of fetchMovementData with loadMovementData
 * - Replace imports of fetchNeverMovedCows with loadNeverMovedCows
 * - Both from client/lib/localDataFetcher.ts
 *
 * This file is kept for historical reference only.
 * Do not use or import from this module.
 */

// Old code removed - see git history if needed
