"use client";

import { useGetAdminDashboardQuery } from "@/store/slice/apiSlice";

const RANK_STYLES = [
  { bg: "bg-gray-800 text-white", card: "bg-white border-gray-100" },
  { bg: "bg-purple-600 text-white", card: "bg-purple-50 border-purple-100" },
  { bg: "bg-orange-500 text-white", card: "bg-orange-50 border-orange-100" },
];

export default function TopRoutes() {
  const { data, isLoading } = useGetAdminDashboardQuery(undefined);
  const routes: any[] = (data as any)?.data?.topRoutes ?? [];

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 font-display">Top Routes</h3>
      {isLoading ? (
        <div className="text-center text-gray-400 text-xs py-4">Loading...</div>
      ) : routes.length === 0 ? (
        <div className="text-center text-gray-400 text-xs py-4">No shipment data yet</div>
      ) : (
        <div className="flex flex-col gap-3">
          {routes.map((route, i) => {
            const style = RANK_STYLES[i] ?? RANK_STYLES[2];
            return (
              <div
                key={route.rank}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${style.card}`}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${style.bg}`}>
                  {route.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 font-display">
                    {route.from} — {route.to}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{route.shipments} Shipments</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
