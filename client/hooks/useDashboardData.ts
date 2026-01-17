import { useEffect, useState } from "react";
import {
  DimCow,
  DimLocation,
  DimEvent,
  CowMovementsFact,
} from "@shared/models";

interface DashboardDataResponse {
  movements: CowMovementsFact[];
  cows: DimCow[];
  locations: DimLocation[];
  events: DimEvent[];
}

interface UseDashboardDataResult {
  data: DashboardDataResponse | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to load dashboard data from Google Sheets API
 * Single source of truth: Google Sheets CSV
 * No retries - single timeout-based request only to prevent hanging
 *
 * API Endpoint Configuration:
 * - Development: http://localhost:8080/api/data/processed-data
 * - Production (GitHub Pages): Set VITE_API_BASE_URL env var
 * - Example: VITE_API_BASE_URL=https://your-backend.com
 */
export function useDashboardData(): UseDashboardDataResult {
  const [data, setData] = useState<DashboardDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        if (!isMounted) return;

        setLoading(true);
        setError(null);

        // Get API base URL from environment or use relative path for dev
        const apiBase = import.meta.env.VITE_API_BASE_URL || "/api";
        const endpoint = `${apiBase}/data/processed-data`;

        console.log("Loading dashboard data from Google Sheets...");
        console.log(`API Endpoint: ${endpoint}`);

        const controller = new AbortController();
        // 10 second timeout - strict, no retries
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        // Add timestamp to bust any caches and force fresh data
        const cacheBustParam = `?t=${Date.now()}`;
        const response = await fetch(`${endpoint}${cacheBustParam}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const realData = (await response.json()) as DashboardDataResponse;

        // Verify we have meaningful data
        if (!realData.movements || realData.movements.length === 0) {
          throw new Error("No movement data in response");
        }

        if (!isMounted) return;

        console.log(
          `✓ Loaded data: ${realData.movements.length} movements, ${realData.cows.length} cows`,
        );
        setData(realData);
        setError(null);
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;

        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        console.error("Failed to load data from API:", errorMessage);
        setError(errorMessage);
        setData(null);
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  return { data, loading, error };
}
