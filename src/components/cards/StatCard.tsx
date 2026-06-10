"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  iconBg: string;
  value: string;
  label: string;
  trend: number;
  trendPositive?: boolean;
  withTrend?: boolean;
  delay?: number;
}

export default function StatCard({
  icon,
  iconBg,
  value,
  label,
  trend,
  trendPositive = true,
  delay = 0,
  withTrend = true,
}: StatCardProps) {
  return (
    <div
      className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${iconBg}`}
      >
        {icon}
      </div>
      <div className="mb-1">
        <span className="text-4xl font-display font-bold tracking-tight text-gray-900">
          {value}
        </span>
      </div>
      <p className="text-sm text-gray-500 font-medium mb-4">{label}</p>
      {withTrend && (
        <div
          className={`flex items-center gap-1.5 text-sm font-semibold ${trendPositive ? "text-emerald-500" : "text-red-500"}`}
        >
          {trendPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span>+{trend}%</span>
        </div>
      )}
    </div>
  );
}
