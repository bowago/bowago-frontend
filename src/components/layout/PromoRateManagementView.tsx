"use client";

import { AppTable } from "@/components/table/Table";
import { useGetPromoRateQuery } from "@/store/slice/apiSlice";
import { Filter, X } from "lucide-react";
import { useState } from "react";
import { PromoRateColumns } from "../table/columns/promo-rate-column";

const SERVICE_TYPES = ["EXPRESS", "STANDARD", "ECONOMY"];
const ZONES = ["1", "2", "3", "4"];

export default function PromoRateManagementView() {
  const [filters, setFilters] = useState({
    serviceType: "",
    zone: "",
    isActive: "",
    validFrom: "",
    validUntil: "",
  });
  const [applied, setApplied] = useState(filters);

  const { data, isLoading } = useGetPromoRateQuery({
    isActive: applied.isActive ? applied.isActive === "true" : undefined,
    serviceType: applied.serviceType || undefined,
    zone: applied.zone ? Number(applied.zone) : undefined,
  } as any);

  const promos: any[] = data?.data?.promos ?? [];

  // Client-side date validity filter
  const filtered = promos.filter((p) => {
    if (applied.validFrom && p.validFrom && new Date(p.validFrom) < new Date(applied.validFrom)) return false;
    if (applied.validUntil && p.validUntil && new Date(p.validUntil) > new Date(applied.validUntil)) return false;
    return true;
  });

  const set = (key: string, val: string) =>
    setFilters((prev) => ({ ...prev, [key]: val }));
  const applyFilters = () => setApplied(filters);
  const clearFilters = () => {
    const empty = { serviceType: "", zone: "", isActive: "", validFrom: "", validUntil: "" };
    setFilters(empty);
    setApplied(empty);
  };

  const hasFilter = Object.values(applied).some(Boolean);

  const labelMap: Record<string, (v: string) => string> = {
    serviceType: (v) => `Service: ${v}`,
    zone: (v) => `Zone ${v}`,
    isActive: (v) => (v === "true" ? "Active" : "Inactive"),
    validFrom: (v) => `Valid from: ${v}`,
    validUntil: (v) => `Valid until: ${v}`,
  };

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-end">
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
          value={filters.zone}
          onChange={(e) => set("zone", e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Zones</option>
          {ZONES.map((z) => <option key={z} value={z}>Zone {z}</option>)}
        </select>

        <select
          value={filters.isActive}
          onChange={(e) => set("isActive", e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive / Expired</option>
        </select>

        <div className="flex items-center gap-1">
          <label className="text-xs text-gray-500">Valid from</label>
          <input type="date" value={filters.validFrom}
            onChange={(e) => set("validFrom", e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="flex items-center gap-1">
          <label className="text-xs text-gray-500">Until</label>
          <input type="date" value={filters.validUntil}
            onChange={(e) => set("validUntil", e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm" />
        </div>

        <button onClick={applyFilters} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          <Filter size={14} /> Filter
        </button>
        {hasFilter && (
          <button onClick={clearFilters} className="text-red-600 text-sm font-medium">Clear All</button>
        )}
      </div>

      {/* Applied chips */}
      {hasFilter && (
        <div className="flex flex-wrap gap-2 mt-3 mb-4">
          {Object.entries(applied).map(([key, val]) =>
            val ? (
              <span key={key} className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-xs">
                {labelMap[key]?.(val) ?? `${key}: ${val}`}
                <button onClick={() => { set(key, ""); setApplied((p) => ({ ...p, [key]: "" })); }} className="text-red-500 ml-1"><X size={11} /></button>
              </span>
            ) : null
          )}
        </div>
      )}

      {isLoading && <p className="text-sm text-gray-400 py-6">Loading promo rates...</p>}
      {!isLoading && filtered.length === 0 && (
        <p className="text-sm text-gray-400 py-6 text-center">No promo rates found.</p>
      )}
      {!isLoading && filtered.length > 0 && (
        <AppTable columns={PromoRateColumns} data={filtered} />
      )}
    </div>
  );
}
