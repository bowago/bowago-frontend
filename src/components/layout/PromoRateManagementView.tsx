"use client";

import { AppTable } from "@/components/table/Table";
import {
  useGetContractRateQuery,
  useGetPromoRateQuery,
} from "@/store/slice/apiSlice";
import { Filter } from "lucide-react";
import { useState } from "react";

import { ZoneColumns } from "../table/columns/zone-column";
import { PromoRateColumns } from "../table/columns/promo-rate-column";

export default function PromoRateManagementView() {
  const [filters, setFilters] = useState({
    isActive: false,
    search: "",
  });

  const [appliedFilters, setAppliedFilters] = useState(filters);

  const { data, isLoading } = useGetPromoRateQuery(appliedFilters);

  // console.log(data);

  const handleActiveChange = (checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      isActive: checked,
    }));
  };
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
      isActive: false,
      search: "",
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
          value={filters.search}
          onChange={(e) => handleChange("search", e.target.value)}
          placeholder="Search by label or user email or user name"
          className="border rounded-md p-2"
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!filters.isActive}
            onChange={(e) => handleActiveChange(e.target.checked)}
          />
          <span className="text-sm">Active Only</span>
        </label>

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

      {isLoading && <div>...Loading all promo rate </div>}
      {/* Table */}
      {data?.data?.promos && (
        <AppTable columns={PromoRateColumns} data={data?.data?.promos} />
      )}
    </div>
  );
}
