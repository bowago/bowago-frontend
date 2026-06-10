"use client";
import { AppTable } from "@/components/table/Table";
import { shipments } from "@/lib/dummy-data/shipment-data";
import { Filter } from "lucide-react";
import { useState } from "react";
import { ShipmentColumns } from "../table/columns/shipment-column";

export default function RateView() {
  const [filters, setFilters] = useState({
    shipmentId: "",
    origin: "",
    destination: "",
    status: "",
  });

  const [appliedFilters, setAppliedFilters] = useState(filters);

  // Apply filtering only using appliedFilters
  const filteredData = shipments;
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
      shipmentId: "",
      origin: "",
      destination: "",
      status: "",
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
          value={filters.shipmentId}
          onChange={(e) => handleChange("shipmentId", e.target.value)}
          placeholder="Shipment ID"
          className="border rounded-md p-2"
        />

        <select
          value={filters.origin}
          onChange={(e) => handleChange("origin", e.target.value)}
          className="border rounded-md p-2"
        >
          <option value="">Shipment Origin</option>
          <option value="Lagos">Lagos</option>
          <option value="Kano">Kano</option>
          <option value="Ibadan">Ibadan</option>
        </select>

        <select
          value={filters.destination}
          onChange={(e) => handleChange("destination", e.target.value)}
          className="border rounded-md p-2"
        >
          <option value="">Destination</option>
          <option value="Abuja">Abuja</option>
          <option value="London">London</option>
          <option value="Benin">Benin</option>
        </select>

        <select
          value={filters.status}
          onChange={(e) => handleChange("status", e.target.value)}
          className="border rounded-md p-2"
        >
          <option value="">Status</option>
          <option value="in-transit">In Transit</option>
          <option value="delivered">Delivered</option>
          <option value="custom">With Custom</option>
        </select>

        <button
          onClick={applyFilters}
          className="bg-red-600 text-white px-5 py-2 rounded-md flex gap-2 items-center"
        >
          Filter <Filter size={16} />
        </button>
      </div>

      {/* Applied Filters */}
      <div className="flex flex-wrap gap-2 items-center mt-4 mb-10">
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

      {/* Table */}
      <AppTable columns={ShipmentColumns} data={filteredData} />
    </div>
  );
}
