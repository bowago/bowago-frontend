"use client";

import { AppTable } from "@/components/table/Table";
import { useGetStandardRateQuery } from "@/store/slice/apiSlice";
import { Filter } from "lucide-react";
import { useState } from "react";
import { BoxDimensionsColumns } from "../table/columns/box-dimension-column";
import { SelectInput } from "../ui/input";
import { RateColumns } from "../table/columns/standard-rate-column";

export default function StandardRateManagementView() {
  const [filters, setFilters] = useState({
    zone: 0,
  });

  const [appliedFilters, setAppliedFilters] = useState(filters);

  const { data, isLoading } = useGetStandardRateQuery({
    zone: appliedFilters.zone,
  });

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
      zone: 0,
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

  // console.log(data);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-row flex-wrap gap-4 items-end">
        <div className="w-1/4">
          <SelectInput
            label="Zone"
            placeholder="Select a zone"
            options={[
              { label: "Zone 1", value: "1" },
              { label: "Zone 2", value: "2" },
              { label: "Zone 3", value: "3" },
              { label: "Zone 4", value: "4" },
            ]}
            value={filters.zone.toString()}
            onValueChange={(e) => handleChange("search", e)}
          />
        </div>

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

      {isLoading && <div>...Loading all standard rate </div>}
      {/* Table */}
      {data?.data?.bands && (
        <AppTable columns={RateColumns} data={data?.data?.bands} />
      )}
    </div>
  );
}
