import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CowMovementsFact, DimLocation } from "@shared/models";
import { calculateWarehouseMetrics } from "@/lib/analytics";

interface WarehouseIntelligenceCardProps {
  movements: CowMovementsFact[];
  locations: DimLocation[];
}

export function WarehouseIntelligenceCard({
  movements,
  locations,
}: WarehouseIntelligenceCardProps) {
  const warehouses = locations.filter((l) => l.Location_Type === "Warehouse");
  const warehouseMetrics = warehouses
    .map((wh) =>
      calculateWarehouseMetrics(wh.Location_ID, movements, locations),
    )
    .filter((m) => m !== null);

  const topOutgoing = warehouseMetrics
    .sort((a, b) => b!.Outgoing_Movements - a!.Outgoing_Movements)
    .slice(0, 5);

  const topIncoming = warehouseMetrics
    .sort((a, b) => b!.Incoming_Movements - a!.Incoming_Movements)
    .slice(0, 5);

  return (
    <div className="h-[calc(100vh-200px)] overflow-hidden flex flex-col gap-4 p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Outgoing */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 overflow-hidden flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex-shrink-0">
            Top Dispatch Warehouses
          </h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart
              data={topOutgoing.map((m) => ({
                name: m!.Location_Name.split(" ")[0],
                movements: m!.Outgoing_Movements,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="movements" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Incoming */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 overflow-hidden flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex-shrink-0">
            Top Receiving Warehouses
          </h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart
              data={topIncoming.map((m) => ({
                name: m!.Location_Name.split(" ")[0],
                movements: m!.Incoming_Movements,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="movements" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed table */}
      <div className="flex-shrink-0 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 overflow-hidden">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Warehouse Analytics
        </h3>
        <div className="overflow-x-auto max-h-48">
          <Table className="text-xs">
            <TableHeader>
              <TableRow>
                <TableHead>Warehouse</TableHead>
                <TableHead className="text-right">Out</TableHead>
                <TableHead className="text-right">In</TableHead>
                <TableHead className="text-right">Avg Out (KM)</TableHead>
                <TableHead className="text-right">Idle (Days)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warehouseMetrics.slice(0, 10).map((m) => (
                <TableRow key={m!.Location_ID}>
                  <TableCell className="font-medium text-xs">
                    {m!.Location_Name}
                  </TableCell>
                  <TableCell className="text-right">
                    {m!.Outgoing_Movements}
                  </TableCell>
                  <TableCell className="text-right">
                    {m!.Incoming_Movements}
                  </TableCell>
                  <TableCell className="text-right">
                    {m!.Avg_Outgoing_Distance.toFixed(0)}
                  </TableCell>
                  <TableCell className="text-right">
                    {m!.Idle_Accumulation_Days.toFixed(1)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
