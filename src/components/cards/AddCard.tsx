"use client";

import { ReactNode } from "react";

interface AddActionCardProps {
  icon: ReactNode;
  iconBg: string;
  value: string;
  label: string;
  addText: string;
  delay?: number;
  onClick?: () => void;
}

export default function AddActionCard({
  icon,
  iconBg,
  value,
  label,
  addText,
  delay = 0,
  onClick,
}: AddActionCardProps) {
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
      <button
        onClick={onClick}
        className={`flex items-center gap-1.5 text-sm font-medium text-red-500 py-1 px-2 border rounded-lg border-red-500`}
      >
        + {addText}
      </button>
    </div>
  );
}
