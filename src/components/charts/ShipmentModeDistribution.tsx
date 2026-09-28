"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useGetAdminDashboardQuery } from "@/store/slice/apiSlice";
import { Plane, Truck, Ship } from "lucide-react";

const FALLBACK_COLORS: Record<string, string> = {
  AIR: "#8b5cf6",
  LAND: "#f59e0b",
  SEA: "#0ea5e9",
};

const MODE_ICONS: Record<string, React.ElementType> = {
  AIR: Plane,
  LAND: Truck,
  SEA: Ship,
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-lg px-3 py-2 shadow-lg text-xs">
        <p className="font-semibold text-gray-800">{payload[0].name}</p>
        <p className="text-gray-500">
          {payload[0].value}% ({payload[0].payload.count} shipment
          {payload[0].payload.count === 1 ? "" : "s"})
        </p>
      </div>
    );
  }
  return null;
};

// [V1 Feature 1] Mode of shipment (Air/Land/Sea) distribution — mirrors
// ServiceDistribution.tsx's shape/pattern, sourced from the same
// GET /admin/dashboard payload (data.modeDistribution).
export default function ShipmentModeDistribution() {
  const { data, isLoading } = useGetAdminDashboardQuery(undefined);
  const dist: any[] = (data as any)?.data?.modeDistribution ?? [];

  const hasData = dist.length > 0 && dist.some((d) => d.value > 0);

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 font-display">
        Shipment Mode
      </h3>
      {isLoading ? (
        <div className="h-40 flex items-center justify-center text-gray-400 text-xs">
          Loading...
        </div>
      ) : !hasData ? (
        <div className="h-40 flex items-center justify-center text-gray-400 text-xs text-center">
          No shipment data yet.
          <br />
          Mode breakdown will appear once shipments are made.
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="w-40 h-40 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dist}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {dist.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color ?? FALLBACK_COLORS[entry.name] ?? "#6b7280"}
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2 flex-1">
            {dist.map((item) => {
              const Icon = MODE_ICONS[item.name] ?? Truck;
              return (
                <div key={item.name} className="flex items-center gap-2">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: `${item.color ?? FALLBACK_COLORS[item.name] ?? "#6b7280"}1a`,
                    }}
                  >
                    <Icon
                      size={12}
                      color={item.color ?? FALLBACK_COLORS[item.name] ?? "#6b7280"}
                    />
                  </span>
                  <span className="text-xs text-gray-500">
                    {item.name}:{" "}
                    <span className="font-medium text-gray-700">
                      {item.value}%
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
