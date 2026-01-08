import { useEffect, useState } from "react";
import { DimCow, DimLocation, DimEvent, CowMovementsFact } from "@shared/models";
import { generateMockDatabase } from "@/lib/mockData";

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
 * Hook to load dashboard data from API
 * Falls back to mock data if API fails
 */
export function useDashboardData(): UseDashboardDataResult {
  const [data, setData] = useState<DashboardDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to load real data from Google Sheets API
        const response = await fetch("/api/data/processed-data", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const realData = (await response.json()) as DashboardDataResponse;

        // Verify we have meaningful data
        if (realData.movements.length === 0 || realData.cows.length === 0) {
          throw new Error("No data found in Google Sheet");
        }

        console.log(`Loaded real data: ${realData.movements.length} movements, ${realData.cows.length} cows`);
        setData(realData);
      } catch (err) {
        console.warn("Failed to load real data, falling back to mock data:", err);
        
        // Fall back to mock data
        const mockData = generateMockDatabase();
        setData(mockData);
        setError(null); // Don't show error if we have fallback
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { data, loading, error };
}
