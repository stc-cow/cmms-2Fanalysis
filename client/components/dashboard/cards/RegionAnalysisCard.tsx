import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts";
import { CowMovementsFact, DimLocation, RegionMetrics } from "@shared/models";

interface RegionAnalysisCardProps {
  movements: CowMovementsFact[];
  locations: DimLocation[];
  regionMetrics: RegionMetrics[];
}

export function RegionAnalysisCard({
  movements,
  locations,
  regionMetrics,
}: RegionAnalysisCardProps) {
  const locMap = new Map(locations.map((l) => [l.Location_ID, l]));

  // Region-to-Region transitions (heatmap style)
  const regionTransitions = new Map<string, number>();
  movements.forEach((mov) => {
    const fromLoc = locMap.get(mov.From_Location_ID);
    const toLoc = locMap.get(mov.To_Location_ID);
    if (fromLoc && toLoc) {
      const key = `${fromLoc.Region} → ${toLoc.Region}`;
      regionTransitions.set(key, (regionTransitions.get(key) || 0) + 1);
    }
  });

  const heatmapData = Array.from(regionTransitions.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([route, count]) => ({
      route,
      count,
    }));

  // Regional metrics sorted
  const sortedRegionMetrics = [...regionMetrics].sort(
    (a, b) => b.Total_COWs_Deployed - a.Total_COWs_Deployed,
  );

  // Color mapping for regions
  const regionColors: Record<string, string> = {
    WEST: "#3b82f6",
    EAST: "#a855f7",
    CENTRAL: "#ec4899",
    SOUTH: "#f59e0b",
  };

  // Get gradient color for bars based on count
  const getBarColor = (index: number) => {
    const colors = [
      "#8b5cf6", // purple
      "#a855f7", // lighter purple
      "#c084fc", // light purple
      "#d8b4fe", // lighter
      "#e9d5ff", // pale
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="h-[calc(100vh-200px)] overflow-hidden flex flex-col gap-5 p-6">
      {/* Main Chart - Full Width and Large */}
      <div className="flex-1 min-h-0 bg-gradient-to-br from-white/80 via-white/60 to-white/40 dark:from-slate-800/80 dark:via-slate-800/60 dark:to-slate-700/40 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 p-8 overflow-hidden flex flex-col backdrop-blur-sm hover:border-blue-300/50 dark:hover:border-blue-600/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-400 dark:to-purple-300 bg-clip-text text-transparent mb-6 flex-shrink-0 uppercase tracking-wide">
          🔄 Top Region Transitions
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={heatmapData}
            layout="vertical"
            margin={{ top: 10, right: 40, left: 200 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" opacity={0.3} />
            <XAxis type="number" tick={{ fontSize: 13, fill: "#6b7280" }} />
            <YAxis
              dataKey="route"
              type="category"
              width={190}
              tick={{ fontSize: 12, fill: "#6b7280", fontWeight: 600 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "2px solid #a855f7",
                borderRadius: "12px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
                padding: "12px 16px",
              }}
              cursor={{ fill: "rgba(168, 85, 247, 0.15)" }}
              formatter={(value) => [`${value} movements`, "Count"]}
            />
            <Bar dataKey="count" fill="#a855f7" radius={[0, 8, 8, 0]} animationDuration={600} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Section - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-shrink-0 h-72">
        {/* Regional deployment metrics */}
        <div className="bg-gradient-to-br from-white/80 via-white/60 to-white/40 dark:from-slate-800/80 dark:via-slate-800/60 dark:to-slate-700/40 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 p-6 overflow-hidden flex flex-col backdrop-blur-sm hover:border-green-300/50 dark:hover:border-green-600/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/5">
          <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-700 dark:from-green-400 dark:to-green-300 bg-clip-text text-transparent mb-4 flex-shrink-0 uppercase tracking-wide">
            📊 COWs by Region
          </h3>
          <div className="overflow-y-auto flex-1">
            <div className="space-y-2.5 pr-3">
              {sortedRegionMetrics.map((region) => (
                <div
                  key={region.Region}
                  className="p-3 bg-gradient-to-br from-white/70 to-white/50 dark:from-slate-700/50 dark:to-slate-600/30 rounded-lg border border-gray-200/40 dark:border-gray-700/40 hover:border-blue-300/50 dark:hover:border-blue-600/50 transition-all duration-300 hover:shadow-sm"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                      <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: regionColors[region.Region as keyof typeof regionColors] || "#6b7280" }}></span>
                      {region.Region}
                    </span>
                    <span className="text-base font-bold bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent">
                      {region.Total_COWs_Deployed}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <div className="flex justify-between">
                      <span>✓ {region.Active_COWs} Active</span>
                      <span>⊘ {region.Static_COWs} Static</span>
                    </div>
                    <div className="flex justify-between">
                      <span>📍 {(region.Total_Distance_KM / 1000).toFixed(0)}K KM</span>
                      <span>⏱️ {region.Avg_Deployment_Duration_Days.toFixed(0)}d</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cross-Region Movement Summary */}
        <div className="bg-gradient-to-br from-white/80 via-white/60 to-white/40 dark:from-slate-800/80 dark:via-slate-800/60 dark:to-slate-700/40 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 p-6 overflow-hidden flex flex-col backdrop-blur-sm hover:border-orange-300/50 dark:hover:border-orange-600/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/5">
          <h3 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 dark:from-orange-400 dark:to-orange-300 bg-clip-text text-transparent mb-4 flex-shrink-0 uppercase tracking-wide">
            🌍 Cross-Region Movements
          </h3>
          <div className="overflow-y-auto flex-1">
            <div className="grid grid-cols-2 gap-3">
              {sortedRegionMetrics.map((region) => (
                <div
                  key={region.Region}
                  className="p-3 bg-gradient-to-br from-white/70 to-white/50 dark:from-slate-700/50 dark:to-slate-600/30 rounded-lg border border-gray-200/40 dark:border-gray-700/40 hover:border-blue-300/50 dark:hover:border-blue-600/50 transition-all duration-300 text-center hover:shadow-sm hover:-translate-y-0.5"
                >
                  <div className="inline-block w-7 h-7 mb-2 rounded-lg" style={{ backgroundColor: `${regionColors[region.Region as keyof typeof regionColors] || "#6b7280"}20` }}>
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs font-bold" style={{ color: regionColors[region.Region as keyof typeof regionColors] || "#6b7280" }}>
                        {region.Region.substring(0, 1)}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wider">
                    {region.Region}
                  </div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                    {region.Cross_Region_Movements}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
