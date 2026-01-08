import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CowMovementsFact, DimEvent } from "@shared/models";

interface EventsAnalysisCardProps {
  movements: CowMovementsFact[];
  events: DimEvent[];
}

const EVENT_COLORS: Record<string, string> = {
  Hajj: "#f59e0b",
  Umrah: "#06b6d4",
  Royal: "#8b5cf6",
  "National Event": "#10b981",
  Seasonal: "#ec4899",
  "Normal Coverage": "#6b7280",
};

export function EventsAnalysisCard({
  movements,
  events,
}: EventsAnalysisCardProps) {
  const eventMap = new Map(events.map((e) => [e.Event_ID, e]));
  const eventCounts: Record<string, number> = {
    Hajj: 0,
    Umrah: 0,
    Royal: 0,
    "National Event": 0,
    Seasonal: 0,
    "Normal Coverage": 0,
  };

  movements.forEach((mov) => {
    if (mov.Event_ID) {
      const event = eventMap.get(mov.Event_ID);
      if (event && eventCounts.hasOwnProperty(event.Event_Type)) {
        eventCounts[event.Event_Type]++;
      }
    }
  });

  const eventData = Object.entries(eventCounts)
    .filter(([_, count]) => count > 0)
    .map(([type, count]) => ({
      name: type,
      value: count,
    }));

  // Distance by event type
  const distanceByEvent: Record<string, { total: number; count: number }> = {
    Hajj: { total: 0, count: 0 },
    Umrah: { total: 0, count: 0 },
    Royal: { total: 0, count: 0 },
    "National Event": { total: 0, count: 0 },
    Seasonal: { total: 0, count: 0 },
    "Normal Coverage": { total: 0, count: 0 },
  };

  movements.forEach((mov) => {
    if (mov.Event_ID) {
      const event = eventMap.get(mov.Event_ID);
      if (event && distanceByEvent.hasOwnProperty(event.Event_Type)) {
        distanceByEvent[event.Event_Type].total += mov.Distance_KM || 0;
        distanceByEvent[event.Event_Type].count++;
      }
    }
  });

  const distanceData = Object.entries(distanceByEvent)
    .filter(([_, data]) => data.count > 0)
    .map(([type, data]) => ({
      type,
      avgDistance: Math.round((data.total / data.count) * 100) / 100,
    }));

  const normalCoverageCount =
    movements.length - (eventData.reduce((sum, e) => sum + e.value, 0) || 0);
  const totalEventsData =
    eventData.length > 0
      ? eventData
      : [{ name: "Normal Coverage", value: normalCoverageCount }];

  return (
    <div className="h-[calc(100vh-200px)] overflow-hidden flex flex-col gap-4 p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Event distribution pie */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 overflow-hidden flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex-shrink-0">
            Event Type Distribution
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={totalEventsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {totalEventsData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={EVENT_COLORS[entry.name] || "#6b7280"}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Distance by event */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 overflow-hidden flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex-shrink-0">
            Avg Distance by Event Type
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={distanceData}
              margin={{ top: 5, right: 30, left: 0, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="type" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="avgDistance" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Event statistics */}
      <div className="flex-shrink-0 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Event Summary
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {Object.entries(eventCounts).map(([type, count]) => (
            <div key={type} className="p-2 bg-gray-50 dark:bg-gray-900 rounded text-center text-xs">
              <div className="font-medium text-gray-600 dark:text-gray-400">{type}</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">{count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
