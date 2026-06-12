"use client";

import { AppTable } from "@/components/table/Table";
import { useGetCitiesQuery } from "@/store/slice/apiSlice";
import { Filter } from "lucide-react";
import { useState } from "react";
import { citiesColumns } from "../table/columns/cities-column";
import { regionOptions, statesForRegion } from "@/lib/nigeria-states";

export default function CitiesRateManagementView() {
  const [filters, setFilters] = useState({
    search: "",
    region: "",
    state: "",
  });

  const [appliedFilters, setAppliedFilters] = useState(filters);

  // Always refetch on focus / on cache invalidation so the table reflects
  // create/edit/delete actions immediately without a manual page refresh.
  const { data, isLoading, isFetching } = useGetCitiesQuery(appliedFilters, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const handleChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      // Clear state if region changes (state list depends on region)
      ...(key === "region" ? { state: "" } : {}),
    }));
  };

  const applyFilters = () => {
    setAppliedFilters(filters);
  };

  const clearFilters = () => {
    const empty = { search: "", region: "", state: "" };
    setFilters(empty);
    setAppliedFilters(empty);
  };

  const removeFilter = (key: string) => {
    setAppliedFilters((prev) => ({ ...prev, [key]: "" }));
    setFilters((prev) => ({ ...prev, [key]: "" }));
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <input
          value={filters.search}
          onChange={(e) => handleChange("search", e.target.value)}
          placeholder="Search by city name"
          className="border rounded-md p-2"
        />

        {/* Region — dropdown sourced from the shared Nigerian states lib */}
        <select
          value={filters.region}
          onChange={(e) => handleChange("region", e.target.value)}
          className="border rounded-md p-2 bg-white text-sm"
        >
          <option value="">All regions</option>
          {regionOptions.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>

        {/* State — dropdown filtered by selected region */}
        <select
          value={filters.state}
          onChange={(e) => handleChange("state", e.target.value)}
          className="border rounded-md p-2 bg-white text-sm"
        >
          <option value="">All states</option>
          {statesForRegion(filters.region).map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <button
          onClick={applyFilters}
          className="bg-red-600 text-white px-5 py-2 rounded-md flex gap-2 items-center"
        >
          Filter <Filter size={16} />
        </button>
      </div>

      {/* Applied Filters */}
      <div className="flex flex-wrap gap-2 items-center mb-6 mt-4">
        <span className="text-sm text-gray-500">Applied Filters:</span>

        {Object.entries(appliedFilters).map(([key, value]) =>
          value ? (
            <span
              key={key}
              className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-md text-sm"
            >
              {key}: {value}
              <button
                onClick={() => removeFilter(key)}
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </span>
          ) : null,
        )}

        {Object.values(appliedFilters).some(Boolean) && (
          <button
            onClick={clearFilters}
            className="text-red-600 text-sm font-medium ml-2"
          >
            Clear All
          </button>
        )}
      </div>

      {(isLoading || isFetching) && <div>...Loading all cities </div>}
      {/* Table */}
      {data?.data?.cities && (
        <AppTable columns={citiesColumns} data={data?.data?.cities} />
      )}
    </div>
  );
}
