"use client";

import { useState } from "react";
import {
  useGetShipmentModesQuery,
  useUpdateShipmentModeMutation,
} from "@/store/slice/apiSlice";
import { Loader2, Pencil, Check, X, Plane, Truck, Ship } from "lucide-react";

type ModeSetting = {
  mode: "AIR" | "LAND" | "SEA";
  volumetricDivisor: number;
  transitHoursDefault: number | null;
  isActive: boolean;
};

const MODE_META: Record<
  string,
  { label: string; description: string; icon: React.ElementType; color: string }
> = {
  AIR: {
    label: "Air",
    description: "Fastest, highest cost per kg",
    icon: Plane,
    color: "text-purple-600 bg-purple-50",
  },
  LAND: {
    label: "Land",
    description: "Balanced speed & cost — the platform default",
    icon: Truck,
    color: "text-amber-600 bg-amber-50",
  },
  SEA: {
    label: "Sea",
    description: "Slowest, lowest cost per kg",
    icon: Ship,
    color: "text-sky-600 bg-sky-50",
  },
};

function EditRow({ setting }: { setting: ModeSetting }) {
  const [editing, setEditing] = useState(false);
  const [divisor, setDivisor] = useState(setting.volumetricDivisor);
  const [transitHours, setTransitHours] = useState(setting.transitHoursDefault ?? 0);
  const [updateMode, { isLoading }] = useUpdateShipmentModeMutation();

  const save = async () => {
    if (divisor <= 0) return;
    await updateMode({
      mode: setting.mode,
      volumetricDivisor: divisor,
      transitHoursDefault: transitHours || null,
    }).unwrap();
    setEditing(false);
  };

  const toggleActive = async () => {
    await updateMode({ mode: setting.mode, isActive: !setting.isActive }).unwrap();
  };

  const meta = MODE_META[setting.mode];
  const Icon = meta.icon;

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <span className={`w-9 h-9 rounded-full flex items-center justify-center ${meta.color}`}>
            <Icon className="w-4 h-4" />
          </span>
          <div>
            <div className="font-medium text-gray-900">{meta.label}</div>
            <div className="text-xs text-gray-400">{meta.description}</div>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        {editing ? (
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={1}
              value={divisor}
              onChange={(e) => setDivisor(Number(e.target.value))}
              className="w-24 border rounded-lg px-2 py-1 text-xs text-center"
            />
            <span className="text-xs text-gray-400">cm³/kg</span>
          </div>
        ) : (
          <span className="text-sm font-medium text-gray-700">
            {setting.volumetricDivisor.toLocaleString()}
          </span>
        )}
      </td>
      <td className="px-5 py-4">
        {editing ? (
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={0}
              value={transitHours}
              onChange={(e) => setTransitHours(Number(e.target.value))}
              className="w-20 border rounded-lg px-2 py-1 text-xs text-center"
            />
            <span className="text-xs text-gray-400">hrs</span>
          </div>
        ) : (
          <span className="text-sm text-gray-700">
            {setting.transitHoursDefault ? `${setting.transitHoursDefault} hrs` : "—"}
          </span>
        )}
      </td>
      <td className="px-5 py-4">
        <button
          onClick={toggleActive}
          disabled={isLoading}
          className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors disabled:opacity-50 ${
            setting.isActive
              ? "bg-green-100 text-green-600 hover:bg-green-200"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
          title="Click to toggle"
        >
          {setting.isActive ? "Active" : "Inactive"}
        </button>
      </td>
      <td className="px-5 py-4">
        {editing ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={save}
              disabled={isLoading || divisor <= 0}
              className="p-1 rounded bg-green-50 hover:bg-green-100 text-green-600 disabled:opacity-40"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setDivisor(setting.volumetricDivisor);
                setTransitHours(setting.transitHoursDefault ?? 0);
              }}
              className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-500"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-500 transition-colors"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </td>
    </tr>
  );
}

// [V1 Feature 1] Admin screen for per-mode volumetric divisor, default
// transit hours, and whether a mode is offered at all — mirrors
// DeliverySLAManagementView.tsx's inline-edit pattern.
export default function ShipmentModeSettingsView() {
  const { data, isLoading } = useGetShipmentModesQuery();
  const modes: ModeSetting[] = (data as any)?.data?.modes ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">
          Shipment Mode Settings
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Configure the volumetric weight divisor and default transit time for
          each mode of shipment. Turning a mode off hides it from the quote
          form entirely — it won&apos;t 404, it just won&apos;t be offered.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 font-semibold text-gray-700">Mode</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-700">
                Volumetric Divisor
              </th>
              <th className="text-left px-5 py-3 font-semibold text-gray-700">
                Default Transit Time
              </th>
              <th className="text-left px-5 py-3 font-semibold text-gray-700">Status</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-700 w-16">
                Edit
              </th>
            </tr>
          </thead>
          <tbody>
            {modes.map((m) => (
              <EditRow key={m.mode} setting={m} />
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        📦 Volumetric weight = (L × W × H) ÷ divisor, rounded up to the
        nearest 0.5kg. The default is 5000 (1kg per 5000cm³) for every mode
        until you tune it here.
      </p>
    </div>
  );
}
