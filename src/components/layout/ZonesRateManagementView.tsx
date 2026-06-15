"use client";

import { AppTable } from "@/components/table/Table";
import { useGetZoneQuery } from "@/store/slice/apiSlice";
import { Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { ZoneColumns } from "../table/columns/zone-column";

const PAGE_SIZE = 20;

export default function ZonesRateManagementView() {
  const [filters, setFilters] = useState({
    fromCity: "",
    toCity: "",
  });

  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useGetZoneQuery({
    ...appliedFilters,
    page,
    limit: PAGE_SIZE,
  });

  const meta = data?.meta as
    | { total: number; page: number; limit: number; totalPages: number; hasNext: boolean; hasPrev: boolean }
    | undefined;

  // Apply filtering only using appliedFilters

  const handleChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Apply filters when button is clicked
  const applyFilters = () => {
    setAppliedFilters(filters);
    setPage(1); // reset to first page on new filter
  };

  const clearFilters = () => {
    const empty = {
      fromCity: "",
      toCity: "",
    };

    setFilters(empty);
    setAppliedFilters(empty);
    setPage(1);
  };

  const removeFilter = (key: string) => {
    setAppliedFilters((prev) => ({
      ...prev,
      [key]: "",
    }));

    setFilters((prev) => ({
      ...prev,
      [key]: "",
    }));

    setPage(1);
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <input
          value={filters.fromCity}
          onChange={(e) => handleChange("fromCity", e.target.value)}
          placeholder="From (City)"
          className="border rounded-md p-2"
        />
        <input
          value={filters.toCity}
          onChange={(e) => handleChange("toCity", e.target.value)}
          placeholder="To (City)"
          className="border rounded-md p-2"
        />

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

      {isLoading && <div>...Loading all zones </div>}
      {/* Table */}
      {data?.data?.matrix && (
        <AppTable columns={ZoneColumns} data={data?.data?.matrix} pageSize={PAGE_SIZE} hidePagination />
      )}

      {/* Server-side pagination */}
      {meta && meta.total > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <span>
            Showing {(meta.page - 1) * meta.limit + 1}–
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} route
            {meta.total === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!meta.hasPrev || isFetching}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <span className="px-2">
              Page {meta.page} of {meta.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!meta.hasNext || isFetching}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
