/**
 * ⚠️ DEPRECATED - No longer used
 *
 * This file previously contained API endpoints for fetching movement data from Google Sheets.
 *
 * ❌ These routes have been removed from server/index.ts
 *
 * **New Approach:**
 * - All data is now served from static JSON files in /public
 * - No API calls to external services
 * - Data is loaded directly in the browser from:
 *   - /movement-data.json
 *   - /never-moved-cows.json
 *
 * **See:**
 * - client/lib/localDataFetcher.ts (for data loading logic)
 * - client/hooks/useDashboardData.ts (for hook implementation)
 * - server/index.ts (for current server setup)
 *
 * This file is kept for historical reference only.
 * Do not use or import these routes.
 */

// Old route code removed - see git history if needed
