"use client";

import { AppTable } from "@/components/table/Table";
import { useGetContractRateQuery } from "@/store/slice/apiSlice";
import { Filter, X } from "lucide-react";
import { useState } from "react";
import AddContractRateModal from "../modals/AddContractRateModal";
import { ContractRateColumns } from "../table/columns/contract-rate-column";

const SERVICE_TYPES = ["EXPRESS", "STANDARD", "ECONOMY"];

export default function ContractRateManagementView() {
  const [filters, setFilters] = useState({
    search: "",
    serviceType: "",
    isActive: "",
    validFrom: "",
    validUntil: "",
  });
  const [applied, setApplied] = useState(filters);

  const { data, isLoading } = useGetContractRateQuery({
    search: applied.search || undefined,
    isActive: applied.isActive ? applied.isActive === "true" : undefined,
  } as any);

  const rates: any[] = data?.data?.rates ?? [];

  // Client-side filter for serviceType and date range
  const filtered = rates.filter((r) => {
    if (applied.serviceType && r.serviceType !== applied.serviceType) return false;
    if (applied.validFrom && r.validFrom && new Date(r.validFrom) < new Date(applied.validFrom)) return false;
    if (applied.validUntil && r.validUntil && new Date(r.validUntil) > new Date(applied.validUntil)) return false;
    return true;
  });

  const set = (key: string, val: string) =>
    setFilters((p) => ({ ...p, [key]: val }));

  const applyFilters = () => setApplied(filters);
  const clearFilters = () => {
    const empty = { search: "", serviceType: "", isActive: "", validFrom: "", validUntil: "" };
    setFilters(empty);
    setApplied(empty);
  };

  const hasFilter = Object.values(applied).some(Boolean);

  const labelMap: Record<string, (v: string) => string> = {
    search: (v) => `Search: "${v}"`,
    serviceType: (v) => `Service: ${v}`,
    isActive: (v) => (v === "true" ? "Active" : "Inactive"),
    validFrom: (v) => `Valid From: ${v}`,
    validUntil: (v) => `Valid Until: ${v}`,
  };

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-end">
        <input
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          placeholder="Search by label or email..."
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

        <div className="flex items-center gap-1">
          <label className="text-xs text-gray-500">Valid from</label>
          <input
            type="date"
            value={filters.validFrom}
            onChange={(e) => set("validFrom", e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="flex items-center gap-1">
          <label className="text-xs text-gray-500">Until</label>
          <input
            type="date"
            value={filters.validUntil}
            onChange={(e) => set("validUntil", e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
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
            ) : null,
          )}
        </div>
      )}

      {isLoading && <p className="text-sm text-gray-400 py-6">Loading contract rates...</p>}
      {!isLoading && filtered.length === 0 && (
        <p className="text-sm text-gray-400 py-6 text-center">No contract rates found.</p>
      )}
      {!isLoading && filtered.length > 0 && (
        <AppTable columns={ContractRateColumns} data={filtered} />
      )}
    </div>
  );
}
