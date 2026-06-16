"use client";

import { AppTable } from "@/components/table/Table";
import { useGetDimensionsQuery } from "@/store/slice/apiSlice";
import { Filter, X } from "lucide-react";
import { useState, useMemo } from "react";
import { BoxDimensionsColumns } from "../table/columns/box-dimension-column";

export default function BoxesRateManagementView() {
  const [filters, setFilters] = useState({ search: "", bestFor: "", maxWeight: "" });
  const [applied, setApplied] = useState(filters);

  const { data, isLoading } = useGetDimensionsQuery({});
  const dimensions: any[] = data?.data?.dimensions ?? [];

  // Pure client-side filtering — all box data is loaded at once (usually < 20 items)
  const filtered = useMemo(() => {
    return dimensions.filter((d) => {
      if (applied.search) {
        const q = applied.search.toLowerCase();
        if (
          !d.categoryId?.toLowerCase().includes(q) &&
          !d.displayName?.toLowerCase().includes(q)
        )
          return false;
      }
      if (applied.bestFor) {
        if (!d.bestFor?.toLowerCase().includes(applied.bestFor.toLowerCase()))
          return false;
      }
      if (applied.maxWeight) {
        if (d.weightKgLimit > parseFloat(applied.maxWeight)) return false;
      }
      return true;
    });
  }, [dimensions, applied]);

  const set = (key: string, val: string) =>
    setFilters((p) => ({ ...p, [key]: val }));
  const applyFilters = () => setApplied(filters);
  const clearFilters = () => {
    const empty = { search: "", bestFor: "", maxWeight: "" };
    setFilters(empty);
    setApplied(empty);
  };
  const hasFilter = Object.values(applied).some(Boolean);

  const labelMap: Record<string, (v: string) => string> = {
    search: (v) => `Search: "${v}"`,
    bestFor: (v) => `Best For: ${v}`,
    maxWeight: (v) => `Max Weight ≤ ${v}kg`,
  };

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-end">
        <input
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          placeholder="Search Category ID or Display Name..."
          className="border rounded-lg px-3 py-2 text-sm min-w-[220px]"
        />
        <input
          value={filters.bestFor}
          onChange={(e) => set("bestFor", e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          placeholder="Best For (e.g. Clothing)"
          className="border rounded-lg px-3 py-2 text-sm min-w-[160px]"
        />
        <div className="flex items-center gap-1">
          <label className="text-xs text-gray-500 whitespace-nowrap">Max Weight (kg)</label>
          <input
            type="number"
            min={0}
            value={filters.maxWeight}
            onChange={(e) => set("maxWeight", e.target.value)}
            placeholder="e.g. 30"
            className="border rounded-lg px-3 py-2 text-sm w-24"
          />
        </div>
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
            ) : null
          )}
        </div>
      )}

      {isLoading && <p className="text-sm text-gray-400 py-6">Loading box dimensions...</p>}
      {!isLoading && filtered.length === 0 && (
        <p className="text-sm text-gray-400 py-6 text-center">No boxes match the filters.</p>
      )}
      {!isLoading && filtered.length > 0 && (
        <AppTable columns={BoxDimensionsColumns} data={filtered} />
      )}
    </div>
  );
}
