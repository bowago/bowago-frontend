"use client";

import { AppTable } from "@/components/table/Table";
import { useGetStandardRateQuery } from "@/store/slice/apiSlice";
import { Filter, X } from "lucide-react";
import { useState } from "react";
import { RateColumns } from "../table/columns/standard-rate-column";

const SERVICE_TYPES = ["EXPRESS", "STANDARD", "ECONOMY"];
const ZONES = ["1", "2", "3", "4"];

export default function StandardRateManagementView() {
  const [filters, setFilters] = useState({
    zone: "",
    serviceType: "",
    isActive: "",
  });
  const [applied, setApplied] = useState(filters);

  const { data, isLoading } = useGetStandardRateQuery({
    zone: applied.zone ? Number(applied.zone) : undefined,
    serviceType: applied.serviceType || undefined,
    isActive: applied.isActive || undefined,
  } as any);

  const bands = data?.data?.bands ?? [];

  const applyFilters = () => setApplied(filters);
  const clearFilters = () => {
    const empty = { zone: "", serviceType: "", isActive: "" };
    setFilters(empty);
    setApplied(empty);
  };
  const set = (key: string, val: string) =>
    setFilters((p) => ({ ...p, [key]: val }));

  const labelMap: Record<string, (v: string) => string> = {
    zone: (v) => `Zone ${v}`,
    serviceType: (v) => `Service: ${v}`,
    isActive: (v) => (v === "true" ? "Active" : "Inactive"),
  };

  const hasFilter = Object.values(applied).some(Boolean);

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-end">
        <select
          value={filters.zone}
          onChange={(e) => set("zone", e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Zones</option>
          {ZONES.map((z) => (
            <option key={z} value={z}>Zone {z}</option>
          ))}
        </select>

        <select
          value={filters.serviceType}
          onChange={(e) => set("serviceType", e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Services</option>
          {SERVICE_TYPES.map((s) => (
            <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
          ))}
        </select>

        <select
          value={filters.isActive}
          onChange={(e) => set("isActive", e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <button
          onClick={applyFilters}
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
        >
          <Filter size={14} /> Filter
        </button>
        {hasFilter && (
          <button onClick={clearFilters} className="text-red-600 text-sm font-medium">
            Clear All
          </button>
        )}
      </div>

      {/* Applied chips */}
      {hasFilter && (
        <div className="flex flex-wrap gap-2 mt-3 mb-4">
          {Object.entries(applied).map(([key, val]) =>
            val ? (
              <span
                key={key}
                className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-xs"
              >
                {labelMap[key]?.(val) ?? `${key}: ${val}`}
                <button
                  onClick={() => {
                    set(key, "");
                    setApplied((p) => ({ ...p, [key]: "" }));
                  }}
                  className="text-red-500 hover:text-red-700 ml-1"
                >
                  <X size={11} />
                </button>
              </span>
            ) : null,
          )}
        </div>
      )}

      {isLoading && <p className="text-sm text-gray-400 py-6">Loading rates...</p>}
      {!isLoading && bands.length === 0 && (
        <p className="text-sm text-gray-400 py-6 text-center">No price bands found for the selected filters.</p>
      )}
      {!isLoading && bands.length > 0 && (
        <AppTable columns={RateColumns} data={bands} />
      )}
    </div>
  );
}
