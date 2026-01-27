import { useEffect, useState } from "react";
import {
  DimCow,
  DimLocation,
  DimEvent,
  CowMovementsFact,
} from "@shared/models";
import { loadMovementData } from "@/lib/localDataFetcher";

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
 * Hook to load dashboard data from local JSON files
 * Single source of truth: Local JSON files in public/
 * No API calls - fully offline capable
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

        console.log(
          "📊 Loading dashboard data from local JSON files...",
        );

        const controller = new AbortController();
        // 30 second timeout for JSON fetch
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
          const realData = await loadMovementData();

          clearTimeout(timeoutId);

          // Verify we have meaningful data
          if (!realData.movements || realData.movements.length === 0) {
            throw new Error("No movement data in response");
          }

          if (!isMounted) return;

          console.log(
            `✅ Loaded data: ${realData.movements.length} movements, ${realData.cows.length} cows`,
          );
          setData(realData);
          setError(null);
          setLoading(false);
        } catch (fetchErr) {
          clearTimeout(timeoutId);
          throw fetchErr;
        }
      } catch (err) {
        if (!isMounted) return;

        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        console.error(
          "❌ Failed to load data from local JSON:",
          errorMessage,
        );
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
