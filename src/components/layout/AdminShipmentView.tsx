"use client";

import { ShipmentColumns } from "@/components/table/columns/shipment-column";
import { AppTable } from "@/components/table/Table";
import {
  AdminShipmentQueryParams,
  useGetAdminShipmentsQuery,
} from "@/store/slice/apiSlice";
import { Filter } from "lucide-react";
import { useState } from "react";
import { Shipment } from "../table/columns/shipment-column";

type ShipmentsResponse =
  | Shipment[]
  | {
      data?: Shipment[] | { shipments?: Shipment[] };
      shipments?: Shipment[];
    };

const emptyFilters = {
  status: "",
  search: "",
  assignedTo: "",
  fromDate: "",
  toDate: "",
};

const getShipments = (response?: ShipmentsResponse): Shipment[] => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (response.data && "shipments" in response.data) {
    return response.data.shipments ?? [];
  }
  return response.shipments ?? [];
};

const getQueryParams = (
  filters: typeof emptyFilters,
): AdminShipmentQueryParams => {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => Boolean(value)),
  );
};

export default function AdminShipmentView() {
  const [filters, setFilters] = useState(emptyFilters);

  const [appliedFilters, setAppliedFilters] = useState(filters);
  const { data, isLoading, isError } = useGetAdminShipmentsQuery(
    getQueryParams(appliedFilters),
  );
  const shipments = getShipments(data as ShipmentsResponse | undefined);

  const handleChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const applyFilters = () => {
    setAppliedFilters(filters);
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
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
          placeholder="Search tracking, name, or city"
          className="border rounded-md p-2"
        />

        <select
          value={filters.status}
          onChange={(e) => handleChange("status", e.target.value)}
          className="border rounded-md p-2"
        >
          <option value="">Status</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PICKED_UP">Picked Up</option>
          <option value="IN_TRANSIT">In Transit</option>
          <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
          <option value="DELIVERED">Delivered</option>
          <option value="FAILED">Failed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="RETURNED">Returned</option>
          <option value="PENDING_ADMIN_REVIEW">Admin Review</option>
        </select>

        <input
          value={filters.assignedTo}
          onChange={(e) => handleChange("assignedTo", e.target.value)}
          placeholder="Assigned staff ID"
          className="border rounded-md p-2"
        />

        <input
          type="date"
          value={filters.fromDate}
          onChange={(e) => handleChange("fromDate", e.target.value)}
          className="border rounded-md p-2"
        />

        <input
          type="date"
          value={filters.toDate}
          onChange={(e) => handleChange("toDate", e.target.value)}
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
      <div className="flex flex-wrap gap-2 items-center">
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
      {isLoading && <div className="mt-4">...Loading shipments</div>}
      {isError && (
        <div className="mt-4 text-sm text-red-600">
          Unable to load shipments.
        </div>
      )}
      <AppTable columns={ShipmentColumns} data={shipments} />
    </div>
  );
}
