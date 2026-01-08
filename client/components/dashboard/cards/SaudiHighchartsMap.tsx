import { useMemo } from "react";
import { getIntensityColor } from "@/lib/saudiGeoData";
import { regionCenters } from "@/lib/saudiGeoData";
import { normalizeRegionName } from "@/lib/saudiRegionMapping";

interface SaudiHighchartsMapProps {
  regionMetrics: Record<string, number>;
  maxMetric: number;
  title?: string;
  totalMovements?: number;
}

export function SaudiHighchartsMap({
  regionMetrics,
  maxMetric,
  title = "Movements by Region",
  totalMovements = 0,
}: SaudiHighchartsMapProps) {
  // Prepare region data sorted by value
  const sortedRegions = useMemo(() => {
    return Object.entries(regionMetrics)
      .map(([region, value]) => ({
        name: region,
        value: value,
        intensity: maxMetric > 0 ? value / maxMetric : 0,
        color: getIntensityColor(maxMetric > 0 ? value / maxMetric : 0),
      }))
      .sort((a, b) => b.value - a.value);
  }, [regionMetrics, maxMetric]);

  // Create a visual grid representation of regions
  return (
    <div className="w-full h-full flex flex-col">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span>≡</span> {title}
      </h3>

      {/* Region Grid */}
      <div className="flex-1 grid grid-cols-3 gap-2 overflow-auto">
        {sortedRegions.map((region) => (
          <div
            key={region.name}
            className="rounded-lg p-3 border border-gray-200 dark:border-gray-700 transition-all hover:shadow-md hover:scale-105 duration-300"
            style={{
              backgroundColor: region.color,
              opacity: 0.9,
            }}
          >
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                {region.name}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {region.value}
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-gray-400 to-gray-600 dark:from-gray-500 dark:to-gray-700 rounded-full"
                  style={{ width: `${region.intensity * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 justify-center">
          <span className="text-xs text-gray-600 dark:text-gray-400">Low</span>
          <div className="flex gap-1">
            {[0, 0.25, 0.5, 0.75, 1].map((intensity) => (
              <div
                key={intensity}
                className="w-4 h-4 rounded"
                style={{ backgroundColor: getIntensityColor(intensity) }}
                title={`${Math.round(intensity * 100)}%`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400">High</span>
        </div>
      </div>

      {/* KPI Display */}
      {totalMovements > 0 && (
        <div className="text-center py-3 mt-3 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800 rounded-lg">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Total Movements: {totalMovements}
          </p>
        </div>
      )}
    </div>
  );
}
