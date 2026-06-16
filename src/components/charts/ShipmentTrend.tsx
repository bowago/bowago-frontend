"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { useGetAdminDashboardQuery } from "@/store/slice/apiSlice";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-lg px-3 py-2 shadow-lg text-xs">
        <p className="font-semibold text-gray-800">{label}</p>
        <p className="text-[#e8432d] font-medium">{payload[0].value} shipments</p>
      </div>
    );
  }
  return null;
};

export default function ShipmentTrend() {
  const { data, isLoading } = useGetAdminDashboardQuery(undefined);
  const trend: { month: string; shipments: number }[] = (data as any)?.data?.trend ?? [];

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 font-display">
        Shipment Trend ({new Date().getFullYear()})
      </h3>
      {isLoading ? (
        <div className="h-[180px] flex items-center justify-center text-gray-400 text-xs">Loading...</div>
      ) : trend.every((t) => t.shipments === 0) ? (
        <div className="h-[180px] flex items-center justify-center text-gray-400 text-xs">No shipment data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#e8432d", strokeWidth: 1, strokeDasharray: "4 4" }} />
            <Line
              type="monotone"
              dataKey="shipments"
              stroke="#e8432d"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#e8432d", stroke: "#fff", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: "#e8432d", stroke: "#fff", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
