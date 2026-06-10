"use client";

interface Route {
  rank: number;
  from: string;
  to: string;
  shipments: number;
  color: string;
  bg: string;
  border: string;
}

const routes: Route[] = [
  {
    rank: 1,
    from: "Lagos",
    to: "Abuja",
    shipments: 49,
    color: "text-gray-800",
    bg: "bg-gray-800",
    border: "border-gray-200",
  },
  {
    rank: 2,
    from: "Shanghai",
    to: "Lagos",
    shipments: 40,
    color: "text-purple-600",
    bg: "bg-purple-600",
    border: "border-purple-100",
  },
  {
    rank: 3,
    from: "Lagos",
    to: "London",
    shipments: 14,
    color: "text-orange-500",
    bg: "bg-orange-500",
    border: "border-orange-100",
  },
];

const rankBg: Record<number, string> = {
  1: "bg-gray-800 text-white",
  2: "bg-purple-600 text-white",
  3: "bg-orange-500 text-white",
};

const cardBg: Record<number, string> = {
  1: "bg-white",
  2: "bg-purple-50",
  3: "bg-orange-50",
};

export default function TopRoutes() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 font-display">Top Routes</h3>
      <div className="flex flex-col gap-3">
        {routes.map((route) => (
          <div
            key={route.rank}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${cardBg[route.rank]} border-gray-100`}
          >
            <span
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${rankBg[route.rank]}`}
            >
              {route.rank}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 font-display">
                {route.from} — {route.to}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{route.shipments} Shipments</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}