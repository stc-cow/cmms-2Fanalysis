import { useState, useMemo } from "react";
import { MapPin, Database } from "lucide-react";
import { CardTabs, DASHBOARD_CARDS } from "@/components/dashboard/CardTabs";
import { HeaderFilters } from "@/components/dashboard/HeaderFilters";
import { ExecutiveOverviewCard } from "@/components/dashboard/cards/ExecutiveOverviewCard";
import { SaudiMapCard } from "@/components/dashboard/cards/SaudiMapCard";
import { MovementTypesCard } from "@/components/dashboard/cards/MovementTypesCard";
import { RegionAnalysisCard } from "@/components/dashboard/cards/RegionAnalysisCard";
import { WarehouseIntelligenceCard } from "@/components/dashboard/cards/WarehouseIntelligenceCard";
import { COWUtilizationCard } from "@/components/dashboard/cards/COWUtilizationCard";
import { EventsAnalysisCard } from "@/components/dashboard/cards/EventsAnalysisCard";
import { RoyalEBUAnalysisCard } from "@/components/dashboard/cards/RoyalEBUAnalysisCard";
import { DistanceCostProxyCard } from "@/components/dashboard/cards/DistanceCostProxyCard";
import { AIReadinessCard } from "@/components/dashboard/cards/AIReadinessCard";
import { DashboardFilters as DashboardFiltersType } from "@shared/models";
import { generateMockDatabase } from "@/lib/mockData";
import {
  enrichMovements,
  calculateCowMetrics,
  calculateRegionMetrics,
  filterMovements,
  calculateKPIs,
} from "@/lib/analytics";

export default function Dashboard() {
  // Load mock data
  const { cows, locations, events, movements: rawMovements } =
    generateMockDatabase();

  // Enrich movements with classification
  const enrichedMovements = useMemo(
    () => enrichMovements(rawMovements, locations),
    [rawMovements, locations]
  );

  // Dashboard filters state
  const [filters, setFilters] = useState<DashboardFiltersType>({});
  const [activeCard, setActiveCard] = useState("executive");

  // Calculate metrics
  const filteredMovements = useMemo(
    () => filterMovements(enrichedMovements, filters, locations),
    [enrichedMovements, filters, locations]
  );

  const cowMetrics = useMemo(
    () =>
      cows.map((cow) =>
        calculateCowMetrics(cow.COW_ID, filteredMovements, locations)
      ),
    [filteredMovements, cows, locations]
  );

  const regionMetrics = useMemo(
    () => {
      const regions = ["WEST", "EAST", "CENTRAL", "SOUTH", "NORTH"];
      return regions.map((region) =>
        calculateRegionMetrics(region, cows, locations, filteredMovements, cowMetrics)
      );
    },
    [filteredMovements, cows, locations, cowMetrics]
  );

  const kpis = useMemo(
    () => calculateKPIs(filteredMovements, cows, locations, cowMetrics),
    [filteredMovements, cows, locations, cowMetrics]
  );

  // Get unique years and vendors
  const years = Array.from(
    new Set(
      enrichedMovements.map((m) => new Date(m.Moved_DateTime).getFullYear())
    )
  ).sort((a, b) => b - a);

  const vendors = Array.from(new Set(cows.map((c) => c.Vendor))).sort();

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 dark:bg-slate-950 overflow-hidden">
      {/* Fixed Header */}
      <header className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                COW Analytics
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                STC & ACES Fleet Management
              </p>
            </div>
          </div>

          {/* Filters Section */}
          <div className="flex-1 mx-6">
            <HeaderFilters
              filters={filters}
              onFiltersChange={setFilters}
              vendors={vendors}
              years={years}
            />
          </div>

          {/* Org Badge */}
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Database className="w-5 h-5" />
            <span className="text-sm font-medium">Live Data</span>
          </div>
        </div>
      </header>

      {/* Card Navigation Tabs */}
      <CardTabs
        tabs={DASHBOARD_CARDS}
        activeTab={activeCard}
        onTabChange={setActiveCard}
      />

      {/* Card Content Area - Full Screen */}
      <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-slate-950">
        {/* Executive Overview */}
        {activeCard === "executive" && (
          <ExecutiveOverviewCard
            kpis={kpis}
            cows={cows}
            locations={locations}
            movements={filteredMovements}
            cowMetrics={cowMetrics}
          />
        )}

        {/* Movement Types */}
        {activeCard === "movements" && (
          <MovementTypesCard
            movements={filteredMovements}
            locations={locations}
          />
        )}

        {/* Region Analysis */}
        {activeCard === "regions" && (
          <RegionAnalysisCard
            movements={filteredMovements}
            locations={locations}
            regionMetrics={regionMetrics}
          />
        )}

        {/* Warehouse Intelligence */}
        {activeCard === "warehouse" && (
          <WarehouseIntelligenceCard
            movements={filteredMovements}
            locations={locations}
          />
        )}

        {/* COW Utilization */}
        {activeCard === "utilization" && (
          <COWUtilizationCard cowMetrics={cowMetrics} />
        )}

        {/* Events Analysis */}
        {activeCard === "events" && (
          <EventsAnalysisCard
            movements={filteredMovements}
            events={events}
          />
        )}

        {/* Royal/EBU Analysis */}
        {activeCard === "royal" && (
          <RoyalEBUAnalysisCard movements={filteredMovements} />
        )}

        {/* Distance & Cost Proxy */}
        {activeCard === "distance" && (
          <DistanceCostProxyCard
            movements={filteredMovements}
            cows={cows}
            locations={locations}
          />
        )}

        {/* AI Readiness */}
        {activeCard === "ai" && (
          <AIReadinessCard
            cowMetrics={cowMetrics}
            movements={filteredMovements}
            locations={locations}
          />
        )}

        {/* Map Placeholder - Keep for future */}
        {activeCard === "map" && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Saudi Interactive Map
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Coming soon: Real-time movement visualization with animated flows
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
