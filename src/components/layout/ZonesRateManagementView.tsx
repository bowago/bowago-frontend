"use client";

import { AppTable } from "@/components/table/Table";
import { useGetZoneQuery } from "@/store/slice/apiSlice";
import { Filter } from "lucide-react";
import { useState } from "react";

import { ZoneColumns } from "../table/columns/zone-column";

export default function ZonesRateManagementView() {
  const [filters, setFilters] = useState({
    fromCity: "",
    toCity: "",
  });

  const [appliedFilters, setAppliedFilters] = useState(filters);

  const { data, isLoading } = useGetZoneQuery(appliedFilters);


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
  };

  const clearFilters = () => {
    const empty = {
      fromCity: "",
      toCity: "",
    };

    setFilters(empty);
    setAppliedFilters(empty);
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
        <AppTable columns={ZoneColumns} data={data?.data?.matrix} />
      )}
    </div>
  );
}
