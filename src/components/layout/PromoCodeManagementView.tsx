"use client";

import { AppTable } from "@/components/table/Table";
import { useGetPromoCodesQuery } from "@/store/slice/apiSlice";
import { Filter, X } from "lucide-react";
import { useState } from "react";
import { PromoCodeColumns } from "../table/columns/promo-code-column";

const SERVICE_TYPES = ["EXPRESS", "STANDARD", "ECONOMY"];

export default function PromoCodeManagementView() {
  const [filters, setFilters] = useState({
    search: "",
    serviceType: "",
    isActive: "",
  });
  const [applied, setApplied] = useState(filters);

  const { data, isLoading } = useGetPromoCodesQuery({
    search: applied.search || undefined,
    isActive: applied.isActive ? applied.isActive === "true" : undefined,
  } as any);

  const promoCodes: any[] = data?.data?.promoCodes ?? [];

  // Client-side filter for serviceType (backend list endpoint doesn't take
  // this param — it's a small admin list, filtering client-side is fine)
  const filtered = promoCodes.filter((p) => {
    if (applied.serviceType && p.serviceType !== applied.serviceType) return false;
    return true;
  });

  const set = (key: string, val: string) =>
    setFilters((p) => ({ ...p, [key]: val }));

  const applyFilters = () => setApplied(filters);
  const clearFilters = () => {
    const empty = { search: "", serviceType: "", isActive: "" };
    setFilters(empty);
    setApplied(empty);
  };

  const hasFilter = Object.values(applied).some(Boolean);

  const labelMap: Record<string, (v: string) => string> = {
    search: (v) => `Search: "${v}"`,
    serviceType: (v) => `Service: ${v}`,
    isActive: (v) => (v === "true" ? "Active" : "Inactive"),
  };

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-end">
        <input
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          placeholder="Search by code..."
          className="border rounded-lg px-3 py-2 text-sm min-w-[200px]"
        />

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
                  onClick={() => { set(key, ""); setApplied((p) => ({ ...p, [key]: "" })); }}
                  className="text-red-500 ml-1"
                >
                  <X size={11} />
                </button>
              </span>
            ) : null,
          )}
        </div>
      )}

      {isLoading && <p className="text-sm text-gray-400 py-6">Loading promo codes...</p>}
      {!isLoading && filtered.length === 0 && (
        <p className="text-sm text-gray-400 py-6 text-center">No promo codes found.</p>
      )}
      {!isLoading && filtered.length > 0 && (
        <AppTable columns={PromoCodeColumns} data={filtered} />
      )}
    </div>
  );
}
