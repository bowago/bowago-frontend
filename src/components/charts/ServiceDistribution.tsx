"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Road Freight", value: 30, color: "#e8432d" },
  { name: "Sea Freight", value: 10, color: "#8B7D2E" },
  { name: "Air Freight", value: 30, color: "#1a1a1a" },
  { name: "Warehousing", value: 15, color: "#d946ef" },
  { name: "Agro Export", value: 5, color: "#3b4fd8" },
  { name: "Custom", value: 10, color: "#0d9488" },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-lg px-3 py-2 shadow-lg text-xs">
        <p className="font-semibold text-gray-800">{payload[0].name}</p>
        <p className="text-gray-500">{payload[0].value}%</p>
      </div>
    );
  }
  return null;
};

export default function ServiceDistribution() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 font-display">Service Distribution</h3>
      <div className="flex items-center gap-4">
        <div className="w-40 h-40 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-1.5 flex-1">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-gray-500">{item.name}: <span className="font-medium text-gray-700">{item.value}%</span></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}