"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Dot,
} from "recharts";

const data = [
  { month: "Jan", shipments: 28 },
  { month: "Feb", shipments: 32 },
  { month: "Mar", shipments: 27 },
  { month: "Apr", shipments: 35 },
  { month: "May", shipments: 42 },
  { month: "Jun", shipments: 48 },
  { month: "Jul", shipments: 62 },
];

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

const CustomDot = (props: any) => {
  const { cx, cy } = props;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="#e8432d"
      stroke="#fff"
      strokeWidth={2}
    />
  );
};

export default function ShipmentTrend() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 font-display">Shipment Trend</h3>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            domain={[10, 70]}
            ticks={[10, 20, 30, 40, 50, 60]}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#e8432d", strokeWidth: 1, strokeDasharray: "4 4" }} />
          <Line
            type="monotone"
            dataKey="shipments"
            stroke="#e8432d"
            strokeWidth={2.5}
            dot={<CustomDot />}
            activeDot={{ r: 6, fill: "#e8432d", stroke: "#fff", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}